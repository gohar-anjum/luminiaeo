import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Network, AlertTriangle } from "lucide-react";
import * as d3 from "d3";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import { apiClient, ApiError } from "@/lib/api/client";
import type {
  CreateKeywordClusterRequest,
  KeywordClusterPayload,
  KeywordClusterTreeNode,
} from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type Phase =
  | "idle"
  | "submitting"
  | "polling"
  | "fetching_result"
  | "ready"
  | "failed";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_MS = 300_000;
const POST_503_MAX_ATTEMPTS = 3;
const POST_503_BASE_DELAY_MS = 2000;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(resolve, ms);
    const onAbort = () => {
      window.clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal.aborted) {
      window.clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function createKeywordClusterWith503Retry(
  body: CreateKeywordClusterRequest,
  signal: AbortSignal
) {
  let delay = POST_503_BASE_DELAY_MS;
  for (let attempt = 0; attempt < POST_503_MAX_ATTEMPTS; attempt++) {
    try {
      return await apiClient.createKeywordCluster(body, { signal });
    } catch (e) {
      if (
        e instanceof ApiError &&
        e.status === 503 &&
        attempt < POST_503_MAX_ATTEMPTS - 1
      ) {
        try {
          await sleep(delay, signal);
        } catch {
          throw e;
        }
        delay *= 2;
        continue;
      }
      throw e;
    }
  }
  throw new ApiError("Unable to start cluster job", 0);
}

interface FlatRow {
  depth: number;
  id: string;
  label: string;
  intent: string;
  childCount: number;
}

function flattenTree(node: KeywordClusterTreeNode, depth = 0): FlatRow[] {
  const row: FlatRow = {
    depth,
    id: node.id,
    label: node.label,
    intent: node.intent,
    childCount: node.children.length,
  };
  return [row, ...node.children.flatMap((c) => flattenTree(c, depth + 1))];
}

function downloadCsv(rows: FlatRow[]) {
  const header = ["depth", "id", "label", "intent", "child_count"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.depth,
        csvEscape(r.id),
        csvEscape(r.label),
        csvEscape(r.intent),
        r.childCount,
      ].join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "keyword-cluster.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function intentBadgeClass(intent: string): string {
  switch (intent) {
    case "informational":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
    case "commercial":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30";
    case "transactional":
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30";
    case "navigational":
      return "bg-violet-500/15 text-violet-800 dark:text-violet-200 border-violet-500/30";
    default:
      return "";
  }
}

export default function Clustering() {
  const { toast } = useToast();
  const [keyword, setKeyword] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [payload, setPayload] = useState<KeywordClusterPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(
    null
  );

  const svgRef = useRef<SVGSVGElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stopJob = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => () => stopJob(), [stopJob]);

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a seed keyword",
        variant: "destructive",
      });
      return;
    }

    stopJob();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setPhase("submitting");
    setErrorMessage(null);
    setFieldErrors(null);
    setPayload(null);

    const body: CreateKeywordClusterRequest = { keyword: keyword.trim() };

    try {
      const created = await createKeywordClusterWith503Retry(body, signal);

      if (created.cache_hit) {
        setPayload(created.payload);
        setPhase("ready");
        toast({
          title: "Loaded from cache",
          description: "This cluster was already generated recently.",
        });
        return;
      }

      const jobId = created.job_id;
      const deadline = Date.now() + MAX_POLL_MS;

      setPhase("polling");

      while (!signal.aborted) {
        if (Date.now() > deadline) {
          setPhase("failed");
          setErrorMessage(
            "The cluster job is taking too long. Please try again later."
          );
          return;
        }

        const status = await apiClient.getKeywordClusterStatus(jobId, {
          signal,
        });

        if (status.status === "failed") {
          setPhase("failed");
          setErrorMessage(status.error_message || "Cluster job failed.");
          return;
        }

        if (status.status === "completed") {
          setPhase("fetching_result");
          const outcome = await apiClient.getKeywordClusterResult(jobId, {
            signal,
          });

          if (outcome.kind === "completed") {
            setPayload(outcome.body.payload);
            setPhase("ready");
            return;
          }

          if (outcome.kind === "failed") {
            setPhase("failed");
            setErrorMessage(
              outcome.body.error_message || "Cluster job failed."
            );
            return;
          }

          setPhase("polling");
        }

        await sleep(POLL_INTERVAL_MS, signal);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setPhase("idle");
        return;
      }

      if (e instanceof ApiError) {
        if (e.status === 422) {
          const raw = e.response as Record<string, unknown> | null;
          const errors = raw?.errors as Record<string, string[]> | undefined;
          setFieldErrors(errors || null);
          setErrorMessage(
            (raw?.message as string) || e.message || "Validation failed"
          );
          setPhase("failed");
          return;
        }
        if (e.status === 401) {
          setErrorMessage("Please sign in to generate keyword clusters.");
          setPhase("failed");
          return;
        }
        if (e.status === 404) {
          setErrorMessage("Job not found or you do not have access.");
          setPhase("failed");
          return;
        }
        setErrorMessage(e.message || "Something went wrong.");
        setPhase("failed");
        return;
      }

      setErrorMessage(
        e instanceof Error ? e.message : "Network error. Please try again."
      );
      setPhase("failed");
    }
  };

  const treeRoot = payload?.tree ?? null;

  useEffect(() => {
    if (!treeRoot || !svgRef.current || phase !== "ready") return;

    const width = 960;
    const height = 600;

    const svgSel = d3.select(svgRef.current);
    svgSel.on(".zoom", null);
    svgSel.on("mousedown.zoom-ux", null);
    svgSel.on("mouseup.zoom-ux", null);
    svgSel.on("mouseleave.zoom-ux", null);
    svgSel.selectAll("*").remove();

    const svg = svgSel
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%")
      .style("touch-action", "none")
      .style("cursor", "grab");

    const zoomLayer = svg.append("g").attr("class", "zoom-layer");
    const g = zoomLayer.append("g").attr("class", "tree-inner");

    /** Tree coords: y → screen horizontal (depth), x → screen vertical (siblings). */
    const NODE_ROW_GAP = 58;
    const NODE_DEPTH_GAP = 240;
    const LABEL_OFFSET = 20;
    const LABEL_MAX_CHARS = 36;

    function truncateLabel(s: string): string {
      const t = s.trim();
      if (t.length <= LABEL_MAX_CHARS) return t;
      return `${t.slice(0, LABEL_MAX_CHARS - 1)}…`;
    }

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        zoomLayer.attr("transform", event.transform.toString());
      });

    svg
      .call(zoomBehavior)
      .on("mousedown.zoom-ux", () => {
        svg.style("cursor", "grabbing");
      })
      .on("mouseup.zoom-ux mouseleave.zoom-ux", () => {
        svg.style("cursor", "grab");
      });

    const treeLayout = d3
      .tree<KeywordClusterTreeNode>()
      .nodeSize([NODE_ROW_GAP, NODE_DEPTH_GAP])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.2));

    const root = d3.hierarchy(treeRoot, (d) =>
      d.children?.length ? d.children : null
    );

    type HNode = d3.HierarchyPointNode<KeywordClusterTreeNode> & {
      _children?: d3.HierarchyPointNode<KeywordClusterTreeNode>[] | undefined;
    };

    const linkGen = d3
      .linkHorizontal<d3.HierarchyPointLink<KeywordClusterTreeNode>, HNode>()
      .x((d) => d.y)
      .y((d) => d.x);

    function isBranch(d: HNode): boolean {
      return Boolean(
        (d.children && d.children.length > 0) ||
          (d._children && d._children.length > 0)
      );
    }

    function toggleCollapse(d: HNode) {
      if (d.children) {
        d._children = d.children;
        d.children = undefined;
      } else if (d._children) {
        d.children = d._children;
        d._children = undefined;
      }
    }

    function linkKey(d: d3.HierarchyPointLink<KeywordClusterTreeNode>) {
      return `${d.source.data.id}-${d.target.data.id}`;
    }

    let didFitViewBox = false;

    function fitViewBoxToTree() {
      const nodes = root.descendants() as HNode[];
      if (nodes.length === 0) return;

      let yMin = Infinity;
      let yMax = -Infinity;
      let xMin = Infinity;
      let xMax = -Infinity;
      for (const d of nodes) {
        yMin = Math.min(yMin, d.y);
        yMax = Math.max(yMax, d.y);
        xMin = Math.min(xMin, d.x);
        xMax = Math.max(xMax, d.x);
      }

      const padL = 240;
      const padR = 300;
      const padT = 48;
      const padB = 56;
      const vbW = Math.max(yMax - yMin + padL + padR, width * 0.85);
      const vbH = Math.max(xMax - xMin + padT + padB, height * 0.85);

      svg.attr(
        "viewBox",
        `${yMin - padL} ${xMin - padT} ${vbW} ${vbH}`
      );
    }

    function update() {
      treeLayout(root);

      const nodes = root.descendants() as HNode[];
      const links = root.links() as d3.HierarchyPointLink<KeywordClusterTreeNode>[];

      g.selectAll<SVGPathElement, (typeof links)[number]>(".link")
        .data(links, linkKey)
        .join(
          (enter) =>
            enter
              .append("path")
              .attr("class", "link")
              .attr("fill", "none")
              .attr("stroke", "hsl(var(--border))")
              .attr("stroke-width", 2)
              .attr("d", (d) => linkGen(d)),
          (update) =>
            update
              .transition()
              .duration(300)
              .attr("d", (d) => linkGen(d)),
          (exit) => exit.remove()
        );

      const nodeSel = g
        .selectAll<SVGGElement, HNode>(".node")
        .data(nodes, (d) => d.data.id)
        .join(
          (enter) => {
            const ng = enter
              .append("g")
              .attr("class", "node")
              .attr("transform", (d) => `translate(${d.y},${d.x})`);

            ng.append("circle")
              .attr("r", 8)
              .attr("stroke", "hsl(var(--background))")
              .attr("stroke-width", 2)
              .style("cursor", (d) => (isBranch(d) ? "pointer" : "default"));

            ng.append("text")
              .attr("class", "tree-label")
              .attr("dy", "-0.35em")
              .attr("fill", "hsl(var(--foreground))")
              .attr("font-size", "11px")
              .attr("font-weight", "500");

            ng.append("text")
              .attr("class", "tree-intent")
              .attr("dy", "0.95em")
              .attr("fill", "hsl(var(--muted-foreground))")
              .attr("font-size", "9px");

            return ng;
          },
          (update) => update,
          (exit) => exit.remove()
        );

      nodeSel.on("click", (_event, d) => {
        const n = d as HNode;
        if (!isBranch(n)) return;
        toggleCollapse(n);
        update();
      });

      nodeSel
        .transition()
        .duration(300)
        .attr("transform", (d) => `translate(${d.y},${d.x})`);

      nodeSel
        .selectChild("circle")
        .attr("fill", (d) =>
          isBranch(d) ? "hsl(var(--primary))" : "hsl(var(--success))"
        )
        .style("cursor", (d) => (isBranch(d) ? "pointer" : "default"));

      nodeSel
        .selectChild<SVGTextElement>(".tree-label")
        .attr("x", (d) => (isBranch(d) ? -LABEL_OFFSET : LABEL_OFFSET))
        .attr("text-anchor", (d) => (isBranch(d) ? "end" : "start"))
        .text((d) => truncateLabel(d.data.label));

      nodeSel
        .selectChild<SVGTextElement>(".tree-intent")
        .attr("x", (d) => (isBranch(d) ? -LABEL_OFFSET : LABEL_OFFSET))
        .attr("text-anchor", (d) => (isBranch(d) ? "end" : "start"))
        .text((d) => d.data.intent);

      nodeSel.each(function (d) {
        d3.select(this)
          .selectAll<SVGTitleElement, HNode>("title")
          .data([d])
          .join("title")
          .text((n) => `${n.data.label}\nIntent: ${n.data.intent}`);
      });

      if (!didFitViewBox) {
        fitViewBoxToTree();
        didFitViewBox = true;
      }
    }

    update();

    return () => {
      const el = svgRef.current;
      if (!el) return;
      const s = d3.select(el);
      s.on(".zoom", null);
      s.on("mousedown.zoom-ux", null);
      s.on("mouseup.zoom-ux", null);
      s.on("mouseleave.zoom-ux", null);
    };
  }, [treeRoot, phase]);

  const tableData = treeRoot ? flattenTree(treeRoot) : [];

  const {
    currentPage,
    totalPages,
    paginatedData: paginatedTableData,
    goToPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems: totalTableItems,
  } = usePagination(tableData, { itemsPerPage: 20 });

  const busy =
    phase === "submitting" ||
    phase === "polling" ||
    phase === "fetching_result";

  const handleExport = () => {
    if (!tableData.length) return;
    downloadCsv(tableData);
    toast({
      title: "Export started",
      description: "Downloading cluster data as CSV…",
    });
  };

  const suggestErrors = payload?.meta?.suggest_errors ?? [];
  const displaySuggestErrors = suggestErrors.slice(0, 20);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Keyword Clustering</h1>
        <p className="text-muted-foreground">
          Build a hierarchical keyword tree from a seed (Laravel API). Branches
          show themes; leaves show more specific queries with intent labels.
        </p>
      </div>

      <Card data-testid="card-generate">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">Seed keyword</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="keyword"
                  placeholder="e.g. content marketing"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  disabled={busy}
                  className="max-w-md flex-1 min-w-[200px]"
                  data-testid="input-keyword"
                />
                <Button
                  onClick={handleGenerate}
                  disabled={busy}
                  data-testid="button-generate"
                >
                  <Network className="w-4 h-4 mr-2" />
                  {busy ? statusLabel(phase) : "Generate cluster"}
                </Button>
              </div>
              {fieldErrors?.keyword?.length ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.keyword.join(" ")}
                </p>
              ) : null}
            </div>
            {errorMessage && phase === "failed" ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Could not load cluster</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {phase === "ready" && payload && treeRoot ? (
        <>
          {payload.meta.partial ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Partial results</AlertTitle>
              <AlertDescription>
                Some suggestion requests failed upstream. The tree may be
                sparse.
                {displaySuggestErrors.length > 0 ? (
                  <ul className="mt-2 list-disc pl-4 text-xs font-mono">
                    {displaySuggestErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex justify-end">
            <Button
              onClick={handleExport}
              variant="outline"
              data-testid="button-export"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <Card data-testid="card-tree">
            <CardHeader>
              <CardTitle>Keyword cluster tree</CardTitle>
              <p className="text-sm text-muted-foreground">
                Seed: <span className="font-medium">{payload.seed}</span> · Click
                nodes to expand or collapse · Drag to pan · Scroll or pinch to
                zoom · Hover a node for the full keyword
              </p>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg bg-card min-h-[min(70vh,560px)] h-[min(70vh,560px)]">
                <svg ref={svgRef} className="block size-full" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-table">
            <CardHeader>
              <CardTitle>Cluster details</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Depth</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Intent</TableHead>
                      <TableHead>Children</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTableData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No nodes to display
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTableData.map((item, index) => {
                        const actualIndex =
                          (currentPage - 1) * itemsPerPage + index;
                        return (
                          <TableRow
                            key={`${item.id}-${actualIndex}`}
                            data-testid={`row-cluster-${actualIndex}`}
                          >
                            <TableCell>{item.depth}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {item.id}
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.label}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs font-normal",
                                  intentBadgeClass(item.intent)
                                )}
                              >
                                {item.intent}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.childCount}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalTableItems}
                  onPageChange={goToPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function statusLabel(phase: Phase): string {
  switch (phase) {
    case "submitting":
      return "Submitting…";
    case "polling":
      return "Building cluster…";
    case "fetching_result":
      return "Loading result…";
    default:
      return "Working…";
  }
}
