import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentAreaLoader } from "@/components/ContentAreaLoader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, ExternalLink, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, handleApiError } from "@/lib/api";
import type {
  ContentOutlineHistoryItem,
  KeywordScore,
  MetaOptimizeHistoryItem,
  PaginatedResponse,
  SemanticScoreHistoryItem,
} from "@/lib/api/types";

type ToolTab = "semantic" | "meta" | "content";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scoreColor(score: number) {
  if (score >= 0.8) return "text-green-600 dark:text-green-400";
  if (score >= 0.6) return "text-lime-600 dark:text-lime-400";
  if (score >= 0.4) return "text-orange-500 dark:text-orange-400";
  return "text-red-500 dark:text-red-400";
}

function scoreBarColor(score: number) {
  if (score >= 0.8) return "bg-green-500";
  if (score >= 0.6) return "bg-lime-500";
  if (score >= 0.4) return "bg-orange-400";
  return "bg-red-500";
}

function KeywordBar({ item, isPrimary }: { item: KeywordScore; isPrimary: boolean }) {
  const semPct = Math.round((item.semantic_score ?? 0) * 100);
  const extPct = Math.round((item.extraction_score ?? 0) * 100);
  return (
    <div
      className={`p-3 rounded-md border ${isPrimary ? "border-primary/40 bg-primary/5" : "border-transparent"}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">
          {item.phrase}
          {isPrimary && (
            <Badge variant="secondary" className="ml-2 text-[10px] py-0">
              Primary
            </Badge>
          )}
        </span>
        <span className={`text-sm font-semibold ${scoreColor(item.semantic_score)}`}>{semPct}%</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] w-16 text-muted-foreground shrink-0">Semantic</span>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(item.semantic_score)}`}
              style={{ width: `${semPct}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] w-16 text-muted-foreground shrink-0">Extraction</span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-muted-foreground/30 transition-all duration-500"
              style={{ width: `${extPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function IntentBadge({ intent }: { intent: string | null }) {
  if (!intent) return null;
  const colors: Record<string, string> = {
    commercial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    comparative: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    informational: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors[intent] ?? "bg-muted text-muted-foreground"}`}
    >
      {intent}
    </span>
  );
}

function parseToolTab(search: string): ToolTab {
  const q = search.startsWith("?") ? search.slice(1) : search;
  const t = new URLSearchParams(q).get("tool");
  if (t === "meta" || t === "content") return t;
  return "semantic";
}

function HistoryPagination({
  page,
  lastPage,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  lastPage: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (lastPage <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <span className="text-sm text-muted-foreground">
        Page {page} of {lastPage} ({total} total)
      </span>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={onPrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" disabled={page >= lastPage} onClick={onNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function PageAnalysisHistory() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const search = useSearch();

  const tab = useMemo(() => parseToolTab(search || ""), [search]);

  const setTabAndUrl = (next: ToolTab) => {
    setLocation(`/page-analysis/history?tool=${next}`);
  };

  const [semanticHistory, setSemanticHistory] = useState<PaginatedResponse<SemanticScoreHistoryItem> | null>(
    null
  );
  const [semanticPage, setSemanticPage] = useState(1);
  const [semanticLoading, setSemanticLoading] = useState(false);

  const [metaHistory, setMetaHistory] = useState<PaginatedResponse<MetaOptimizeHistoryItem> | null>(null);
  const [metaPage, setMetaPage] = useState(1);
  const [metaLoading, setMetaLoading] = useState(false);

  const [contentHistory, setContentHistory] = useState<PaginatedResponse<ContentOutlineHistoryItem> | null>(
    null
  );
  const [contentPage, setContentPage] = useState(1);
  const [contentLoading, setContentLoading] = useState(false);

  const [expandedSemantic, setExpandedSemantic] = useState<number | null>(null);
  const [expandedMeta, setExpandedMeta] = useState<number | null>(null);
  const [expandedContent, setExpandedContent] = useState<number | null>(null);

  const loadSemantic = useCallback(
    async (page: number) => {
      setSemanticLoading(true);
      try {
        const data = await apiClient.getSemanticScoreHistory(page, 10);
        setSemanticHistory(data);
        setSemanticPage(page);
      } catch (e: unknown) {
        const { message } = handleApiError(e);
        toast({ title: "Could not load history", description: message, variant: "destructive" });
      } finally {
        setSemanticLoading(false);
      }
    },
    [toast]
  );

  const loadMeta = useCallback(
    async (page: number) => {
      setMetaLoading(true);
      try {
        const data = await apiClient.getMetaOptimizeHistory(page, 10);
        setMetaHistory(data);
        setMetaPage(page);
      } catch (e: unknown) {
        const { message } = handleApiError(e);
        toast({ title: "Could not load history", description: message, variant: "destructive" });
      } finally {
        setMetaLoading(false);
      }
    },
    [toast]
  );

  const loadContent = useCallback(
    async (page: number) => {
      setContentLoading(true);
      try {
        const data = await apiClient.getContentOutlineHistory(page, 10);
        setContentHistory(data);
        setContentPage(page);
      } catch (e: unknown) {
        const { message } = handleApiError(e);
        toast({ title: "Could not load history", description: message, variant: "destructive" });
      } finally {
        setContentLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (tab === "semantic" && semanticHistory === null && !semanticLoading) void loadSemantic(1);
    if (tab === "meta" && metaHistory === null && !metaLoading) void loadMeta(1);
    if (tab === "content" && contentHistory === null && !contentLoading) void loadContent(1);
  }, [
    tab,
    semanticHistory,
    metaHistory,
    contentHistory,
    semanticLoading,
    metaLoading,
    contentLoading,
    loadSemantic,
    loadMeta,
    loadContent,
  ]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <History className="w-5 h-5" />
            <span className="text-xs font-medium uppercase tracking-wide">Page analysis</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Analysis history</h1>
          {/* <p className="text-sm text-muted-foreground max-w-2xl">
            Paginated records from the page-analysis APIs: semantic scoring, meta tag runs, and content outlines.
            Other tools (AI visibility, FAQ jobs, keyword clustering, PBN) use different endpoints and do not appear
            here yet.
          </p> */}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/semantic">
              Semantic tool
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/meta">
              Meta tool
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/content-generator">
              Outlines tool
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">API coverage</CardTitle>
          <CardDescription>
            History list views call{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">/api/page-analysis/…/history</code> only for the
            three tabs below. If we add history endpoints for other features, they can get a section here or their own
            list page.
          </CardDescription>
        </CardHeader>
      </Card> */}

      <Tabs value={tab} onValueChange={(v) => setTabAndUrl(v as ToolTab)}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="semantic" className="flex-1 min-w-[140px]">
            Semantic scores
          </TabsTrigger>
          <TabsTrigger value="meta" className="flex-1 min-w-[140px]">
            Meta optimizations
          </TabsTrigger>
          <TabsTrigger value="content" className="flex-1 min-w-[140px]">
            Content outlines
          </TabsTrigger>
        </TabsList>

        <TabsContent value="semantic" className="mt-4 space-y-4">
          <ContentAreaLoader
            loading={semanticLoading}
            phase="Loading semantic score history…"
            minHeightClassName="min-h-[200px]"
          >
            {semanticHistory && !semanticLoading ? (
              semanticHistory.data.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No semantic analyses yet. Run one from the Semantic Score Checker.
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>URL</TableHead>
                          <TableHead>Keyword</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {semanticHistory.data.map((item, idx) => {
                          const pct = Math.round(item.semantic_score * 100);
                          return (
                            <Fragment key={`sem-${item.source_url}-${idx}`}>
                              <TableRow
                                className="cursor-pointer"
                                onClick={() => setExpandedSemantic(expandedSemantic === idx ? null : idx)}
                              >
                                <TableCell className="max-w-[220px] truncate text-sm">{item.source_url}</TableCell>
                                <TableCell className="text-sm">
                                  {item.target_keyword || item.comparison_value || "—"}
                                </TableCell>
                                <TableCell>
                                  <span className={`text-sm font-semibold ${scoreColor(item.semantic_score)}`}>
                                    {pct}%
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDate(item.analyzed_at)}
                                </TableCell>
                              </TableRow>
                              {expandedSemantic === idx ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="bg-muted/50 p-4">
                                    {item.keyword_scores && item.keyword_scores.length > 0 ? (
                                      <div className="space-y-2">
                                        {item.keyword_scores.map((ks) => (
                                          <KeywordBar
                                            key={ks.phrase}
                                            item={ks}
                                            isPrimary={ks.phrase === (item.target_keyword ?? item.comparison_value)}
                                          />
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">No keyword breakdown stored.</p>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ) : null}
                            </Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <HistoryPagination
                      page={semanticHistory.current_page}
                      lastPage={semanticHistory.last_page}
                      total={semanticHistory.total}
                      onPrev={() => loadSemantic(semanticPage - 1)}
                      onNext={() => loadSemantic(semanticPage + 1)}
                    />
                  </CardContent>
                </Card>
              )
            ) : null}
          </ContentAreaLoader>
        </TabsContent>

        <TabsContent value="meta" className="mt-4 space-y-4">
          <ContentAreaLoader
            loading={metaLoading}
            phase="Loading meta optimization history…"
            minHeightClassName="min-h-[200px]"
          >
            {metaHistory && !metaLoading ? (
              metaHistory.data.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No meta optimizations yet. Run one from the Meta Tag Optimizer.
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>URL</TableHead>
                          <TableHead>Keyword</TableHead>
                          <TableHead>Suggested title</TableHead>
                          <TableHead>Intent</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metaHistory.data.map((item, idx) => (
                          <Fragment key={`meta-${item.url}-${idx}`}>
                            <TableRow
                              className="cursor-pointer"
                              onClick={() => setExpandedMeta(expandedMeta === idx ? null : idx)}
                            >
                              <TableCell className="max-w-[200px] truncate text-sm">{item.url}</TableCell>
                              <TableCell className="text-sm">{item.target_keyword || "—"}</TableCell>
                              <TableCell className="max-w-[220px] truncate text-sm">{item.suggested_title}</TableCell>
                              <TableCell>
                                <IntentBadge intent={item.intent} />
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(item.analyzed_at)}
                              </TableCell>
                            </TableRow>
                            {expandedMeta === idx ? (
                              <TableRow>
                                <TableCell colSpan={5} className="bg-muted/50 p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <div className="font-medium mb-1">Original title</div>
                                      <p className="text-muted-foreground">{item.original_title || "N/A"}</p>
                                    </div>
                                    <div>
                                      <div className="font-medium mb-1">Optimized title</div>
                                      <p>{item.suggested_title}</p>
                                    </div>
                                    <div>
                                      <div className="font-medium mb-1">Original description</div>
                                      <p className="text-muted-foreground">{item.original_description || "N/A"}</p>
                                    </div>
                                    <div>
                                      <div className="font-medium mb-1">Optimized description</div>
                                      <p>{item.suggested_description}</p>
                                    </div>
                                  </div>
                                  <div className="mt-4">
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href="/meta">Open Meta Tag Optimizer</Link>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : null}
                          </Fragment>
                        ))}
                      </TableBody>
                    </Table>
                    <HistoryPagination
                      page={metaHistory.current_page}
                      lastPage={metaHistory.last_page}
                      total={metaHistory.total}
                      onPrev={() => loadMeta(metaPage - 1)}
                      onNext={() => loadMeta(metaPage + 1)}
                    />
                  </CardContent>
                </Card>
              )
            ) : null}
          </ContentAreaLoader>
        </TabsContent>

        <TabsContent value="content" className="mt-4 space-y-4">
          <ContentAreaLoader
            loading={contentLoading}
            phase="Loading outline history…"
            minHeightClassName="min-h-[200px]"
          >
            {contentHistory && !contentLoading ? (
              contentHistory.data.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No outlines yet. Generate one from the Content Generator.
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Keyword</TableHead>
                          <TableHead>Tone</TableHead>
                          <TableHead>Intent</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contentHistory.data.map((item, idx) => (
                          <Fragment key={`co-${item.keyword}-${idx}`}>
                            <TableRow
                              className="cursor-pointer"
                              onClick={() => setExpandedContent(expandedContent === idx ? null : idx)}
                            >
                              <TableCell className="text-sm font-medium">{item.keyword}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {item.tone}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <IntentBadge intent={item.intent} />
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(item.generated_at)}
                              </TableCell>
                            </TableRow>
                            {expandedContent === idx ? (
                              <TableRow>
                                <TableCell colSpan={4} className="bg-muted/50 p-4">
                                  <h4 className="font-semibold mb-2">Outline for &quot;{item.keyword}&quot;</h4>
                                  <div className="space-y-1 text-sm">
                                    {(Array.isArray(item.outline) ? item.outline : []).map((s, si) => (
                                      <div key={si} className="ml-2">
                                        <div className="font-medium">{s.heading}</div>
                                        {(s.subsections ?? []).map((sub, ssi) => (
                                          <div key={ssi} className="ml-4 text-muted-foreground">
                                            {sub.heading}
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                  {item.semantic_keywords && item.semantic_keywords.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 mt-3">
                                      {item.semantic_keywords.map((kw) => (
                                        <Badge key={kw} variant="secondary" className="text-[10px]">
                                          {kw}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : null}
                                  <div className="mt-4">
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href="/content-generator">Open Content Generator</Link>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : null}
                          </Fragment>
                        ))}
                      </TableBody>
                    </Table>
                    <HistoryPagination
                      page={contentHistory.current_page}
                      lastPage={contentHistory.last_page}
                      total={contentHistory.total}
                      onPrev={() => loadContent(contentPage - 1)}
                      onNext={() => loadContent(contentPage + 1)}
                    />
                  </CardContent>
                </Card>
              )
            ) : null}
          </ContentAreaLoader>
        </TabsContent>
      </Tabs>
    </div>
  );
}
