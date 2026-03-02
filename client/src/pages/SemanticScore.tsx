import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import { apiClient, ApiError, handleApiError, validateUrl, normalizeUrl } from "@/lib/api";

export default function SemanticScore() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    const trimmed = url.trim();

    if (!trimmed) {
      setUrlError("Please enter a URL to analyze");
      toast({
        title: "Error",
        description: "Please enter a URL to analyze",
        variant: "destructive",
      });
      return;
    }

    if (trimmed.length > 2048) {
      const message = "URL must be 2048 characters or less";
      setUrlError(message);
      toast({
        title: "Invalid URL",
        description: message,
        variant: "destructive",
      });
      return;
    }

    if (!validateUrl(trimmed)) {
      const message = "Please enter a valid URL";
      setUrlError(message);
      toast({
        title: "Invalid URL",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setUrlError(null);
    setResults(null);

    try {
      const normalizedUrl = normalizeUrl(trimmed);
      const response = await apiClient.getSemanticScore({ url: normalizedUrl });

      setResults({
        url: normalizedUrl,
        semanticScore: response.semantic_score,
      });
    } catch (error: any) {
      if (error instanceof ApiError) {
        if (error.status === 402) {
          toast({
            title: "Not enough credits",
            description: "You don't have enough credits to run this analysis. Visit the Billing page to purchase more credits.",
            variant: "destructive",
          });
        } else if (error.status === 422) {
          const message =
            error.message ||
            "Please enter a valid URL";
          setUrlError(message);
          toast({
            title: "Validation error",
            description: message,
            variant: "destructive",
          });
        } else {
          const { message } = handleApiError(error);
          toast({
            title: "Error",
            description: message,
            variant: "destructive",
          });
        }
      } else {
        const { message } = handleApiError(error);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Generating semantic score report...",
    });
  };

  const chartData = results?.topics.map((topic: any) => ({
    name: topic.name,
    value: topic.coverage,
  })) || [];

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  const {
    currentPage,
    totalPages,
    paginatedData: paginatedMissingTopics,
    goToPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems: totalMissingTopics,
  } = usePagination(results?.missingTopics || [], { itemsPerPage: 10 });

  const semanticScore: number | null = results?.semanticScore ?? null;
  const semanticScorePercentage = semanticScore != null ? Math.round(semanticScore * 100) : null;
  const focusLabel =
    semanticScore == null
      ? null
      : semanticScore < 0.3
        ? "Low focus"
        : semanticScore < 0.6
          ? "Moderate focus"
          : "High focus";

  const focusExplanation =
    semanticScore == null
      ? null
      : semanticScore < 0.3
        ? "This page is not tightly focused on a single primary topic."
        : semanticScore < 0.6
          ? "This page covers its topic somewhat consistently."
          : "This page is strongly aligned with its main topic; good semantic focus.";

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Semantic Score Checker</h1>
        <p className="text-muted-foreground">
          Analyze and improve your content's semantic relevance
        </p>
      </div>

      <Card data-testid="card-analyze">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL to Analyze</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  placeholder="https://example.com/your-page"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (urlError) setUrlError(null);
                  }}
                  data-testid="input-url"
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  data-testid="button-analyze"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
              {urlError && (
                <p className="text-xs text-destructive mt-1">
                  {urlError}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isAnalyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-96 lg:col-span-3" />
        </div>
      )}

      {results && !isAnalyzing && (
        <>
          <div className="flex justify-end">
            <Button onClick={handleExport} variant="outline" data-testid="button-export">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Gauge */}
            <Card data-testid="card-score">
              <CardHeader>
                <CardTitle>Semantic Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeDasharray={`${semanticScorePercentage ?? 0}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-4xl font-bold" data-testid="text-score">
                        {semanticScore != null ? semanticScore.toFixed(2) : "--"}
                      </div>
                      <div className="text-xs text-muted-foreground">scale 0–1</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium">Overall Assessment</div>
                  {focusLabel && (
                    <Badge
                      variant={
                        semanticScore != null && semanticScore >= 0.6
                          ? "default"
                          : semanticScore != null && semanticScore >= 0.3
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {focusLabel}
                    </Badge>
                  )}
                  {semanticScore != null && (
                    <p className="text-xs text-muted-foreground">
                      {semanticScore.toFixed(2)} semantic score (cosine similarity between page and primary topic).
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Meta Data */}
            <Card className="lg:col-span-2" data-testid="card-meta">
              <CardHeader>
                <CardTitle>Meta Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {focusExplanation && (
                  <p className="text-sm text-muted-foreground">
                    {focusExplanation}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Topic Coverage Chart */}
            <Card data-testid="card-coverage">
              <CardHeader>
                <CardTitle>Topic Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {chartData.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Topic coverage breakdown will appear here when available.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Missing Topics */}
            <Card data-testid="card-missing-topics">
              <CardHeader>
                <CardTitle>Missing Topics</CardTitle>
              </CardHeader>
              <CardContent>
                {paginatedMissingTopics.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Topic</TableHead>
                          <TableHead>Suggestion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedMissingTopics.map((topic: any, index: number) => {
                          const actualIndex = (currentPage - 1) * itemsPerPage + index;
                          return (
                            <TableRow key={`${topic.name}-${actualIndex}`} data-testid={`row-topic-${actualIndex}`}>
                              <TableCell className="font-medium">{topic.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {topic.suggestion}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <DataTablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      itemsPerPage={itemsPerPage}
                      totalItems={totalMissingTopics}
                      onPageChange={goToPage}
                      onItemsPerPageChange={setItemsPerPage}
                    />
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Suggested missing topics will appear here when detailed analysis is available.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
