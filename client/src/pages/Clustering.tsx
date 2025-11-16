import { useState, useEffect, useRef } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { Download, Network } from "lucide-react";
import * as d3 from "d3";
import { useToast } from "@/hooks/use-toast";
import { registerMockData } from "@/lib/queryClient";
import clustersData from "@/data/clusters.json";

export default function Clustering() {
  const { toast } = useToast();
  const [keyword, setKeyword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Register mock data for this endpoint
  useEffect(() => {
    registerMockData("/api/clusters", async () => clustersData);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/clusters"],
    enabled: showResults,
  });

  const handleGenerate = async () => {
    if (!keyword) {
      toast({
        title: "Error",
        description: "Please enter a main keyword",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGenerating(false);
    setShowResults(true);
  };

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Downloading cluster data as CSV...",
    });
  };

  useEffect(() => {
    if (!data || !svgRef.current || !showResults) return;

    const width = 960;
    const height = 600;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");

    const g = svg.append("g").attr("transform", "translate(40,0)");

    const treeLayout = d3.tree().size([height - 100, width - 300]);

    const root = d3.hierarchy(data);
    const treeData = treeLayout(root);

    g.selectAll(".link")
      .data(treeData.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 2)
      .attr(
        "d",
        d3
          .linkHorizontal()
          .x((d: any) => d.y)
          .y((d: any) => d.x) as any
      );

    const node = g
      .selectAll(".node")
      .data(treeData.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

    node
      .append("circle")
      .attr("r", 8)
      .attr("fill", (d: any) => (d.children ? "hsl(var(--primary))" : "hsl(var(--success))"))
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", function (event: any, d: any) {
        if (d.children) {
          (d as any)._children = d.children;
          d.children = null;
        } else {
          d.children = (d as any)._children;
          (d as any)._children = null;
        }
        updateTree();
      });

    node
      .append("text")
      .attr("dy", ".35em")
      .attr("x", (d: any) => (d.children ? -13 : 13))
      .attr("text-anchor", (d: any) => (d.children ? "end" : "start"))
      .text((d: any) => d.data.name)
      .attr("fill", "hsl(var(--foreground))")
      .attr("font-size", "12px");

    function updateTree() {
      const newTreeData = treeLayout(root);

      g.selectAll(".link")
        .data(newTreeData.links())
        .transition()
        .duration(300)
        .attr(
          "d",
          d3
            .linkHorizontal()
            .x((d: any) => d.y)
            .y((d: any) => d.x) as any
        );

      const updatedNodes = g.selectAll(".node").data(newTreeData.descendants());

      updatedNodes
        .transition()
        .duration(300)
        .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

      updatedNodes
        .select("circle")
        .attr("fill", (d: any) => (d.children ? "hsl(var(--primary))" : "hsl(var(--success))"));

      updatedNodes
        .select("text")
        .attr("x", (d: any) => (d.children ? -13 : 13))
        .attr("text-anchor", (d: any) => (d.children ? "end" : "start"));
    }
  }, [data, showResults]);

  const flattenTree = (node: any, level = 0): any[] => {
    const result: any[] = [];
    if (level === 0) {
      result.push({ level: "Root", name: node.name, count: "-" });
    }
    if (node.children) {
      node.children.forEach((child: any) => {
        if (level === 0) {
          result.push({
            level: "Primary Cluster",
            name: child.name,
            count: child.children?.length || 0,
          });
        } else if (level === 1) {
          result.push({
            level: "Secondary Keyword",
            name: child.name,
            count: child.children?.length || 0,
          });
        } else if (level === 2) {
          result.push({ level: "Sub-Secondary", name: child.name, count: 0 });
        }
        result.push(...flattenTree(child, level + 1));
      });
    }
    return result;
  };

  const tableData = data ? flattenTree(data) : [];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Keyword Clustering</h1>
        <p className="text-muted-foreground">
          Visualize keyword relationships with interactive tree diagrams
        </p>
      </div>

      <Card data-testid="card-generate">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">Main Keyword</Label>
              <div className="flex gap-2">
                <Input
                  id="keyword"
                  placeholder="Enter main keyword..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  data-testid="input-keyword"
                />
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  data-testid="button-generate"
                >
                  <Network className="w-4 h-4 mr-2" />
                  {isGenerating ? "Generating..." : "Generate Clusters"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showResults && data && (
        <>
          <div className="flex justify-end">
            <Button onClick={handleExport} variant="outline" data-testid="button-export">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <Card data-testid="card-tree">
            <CardHeader>
              <CardTitle>Keyword Cluster Tree</CardTitle>
              <p className="text-sm text-muted-foreground">
                Click on nodes to expand/collapse branches
              </p>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-auto bg-card">
                <svg ref={svgRef} />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-table">
            <CardHeader>
              <CardTitle>Cluster Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Level</TableHead>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Children Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((item, index) => (
                      <TableRow key={index} data-testid={`row-cluster-${index}`}>
                        <TableCell>
                          <span className="text-sm font-medium">{item.level}</span>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
