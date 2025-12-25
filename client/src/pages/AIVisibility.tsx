import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, CheckCircle2, XCircle, RefreshCw, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { apiClient, pollCitationStatus, handleApiError } from "@/lib/api";
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/DataTablePagination";

type ProviderResult = {
  provider?: string; // Can be 'gpt', 'gemini', or 'dataforseo'
  citation_found: boolean;
  confidence: number;
  citation_references: string[] | Array<{ url: string; relevance?: number }>; // Can be strings (DataForSEO) or objects (GPT/Gemini)
  explanation?: string;
  raw_response?: string;
  competitors?: any[];
};

type CitationByQueryEntry = {
  query: string;
  gpt: ProviderResult;
  gemini: ProviderResult;
  top_competitors?: Array<{
    domain: string;
    mentions?: number;
    urls?: string[];
  }>;
};

type CitationByQueryResponse = CitationByQueryEntry[] | Record<string, CitationByQueryEntry>;

type CitationCompetitorEntry = {
  domain: string;
  count?: number;
  citation_count?: number;
  query_count?: number;
  percentage?: number;
  query_percentage?: number;
  queries?: string[];
  urls?: string[];
  providers?: {
    gpt?: number;
    gemini?: number;
  };
};

type CitationCompetitorsResponse = {
  competitors: CitationCompetitorEntry[];
  total_queries?: number;
  total_citations?: number;
};

interface CitationTaskStatus {
  task_id: number;
  status: "pending" | "generating" | "queued" | "processing" | "completed" | "failed";
  progress?: {
    processed: number;
    total: number;
    last_query_index: number;
    updated_at: string;
  };
  competitors?: CitationCompetitorEntry[];
  meta?: {
    gpt_score?: number | null;
    gemini_score?: number | null;
    dataforseo_score?: number | null;
    requested_queries?: number;
    num_queries?: number;
    errors?: string[];
  };
}

interface CitationResult {
  task_id: number;
  url: string;
  status: string;
  queries: string[];
  results: {
    by_query: CitationByQueryResponse;
    scores: {
      gpt_score: number;
      gemini_score: number;
      dataforseo_score?: number;
    };
  };
  competitors?: CitationCompetitorEntry[] | CitationCompetitorsResponse | null;
  meta: {
    gpt_score: number;
    gemini_score: number;
    dataforseo_score?: number;
    completed_at: string;
    requested_queries: number;
    num_queries: number;
  };
}

export default function AIVisibility() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [taskId, setTaskId] = useState<number | null>(null);
  const [taskStatus, setTaskStatus] = useState<CitationTaskStatus | null>(null);
  const [results, setResults] = useState<CitationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxPollingTime = 10 * 60 * 1000;
  const pollingStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const startPolling = useCallback((taskId: number) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingStartTimeRef.current = Date.now();
    
    const poll = async () => {
      if (pollingStartTimeRef.current && Date.now() - pollingStartTimeRef.current > maxPollingTime) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsAnalyzing(false);
        toast({
          title: "Timeout",
          description: "Analysis took too long. Please try again.",
          variant: "destructive",
        });
        return;
      }

      try {
        const status = await apiClient.getCitationStatus(taskId);
        const mappedStatus: CitationTaskStatus = {
          task_id: status.task_id,
          status: status.status as any,
          progress: status.progress ? {
            processed: status.progress.completed,
            total: status.progress.total,
            last_query_index: status.progress.completed,
            updated_at: new Date().toISOString(),
          } : undefined,
          meta: status.meta,
        };
        setTaskStatus(mappedStatus);

        if (status.status === "completed") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          try {
            const resultsData = await apiClient.getCitationResults(taskId);
            const mappedResults: CitationResult = {
              ...resultsData,
              results: {
                ...resultsData.results,
                by_query: resultsData.results.by_query.map((entry: any) => ({
                  ...entry,
                  gpt: {
                    ...entry.gpt,
                    // Preserve provider field if present
                    provider: entry.gpt?.provider,
                    // Keep citation_references in original format (can be strings or objects)
                    citation_references: entry.gpt.citation_references || [],
                  },
                })),
                scores: {
                  gpt_score: resultsData.results.scores.gpt_score,
                  gemini_score: resultsData.results.scores.gemini_score,
                  dataforseo_score: resultsData.results.scores.dataforseo_score,
                },
              },
              meta: {
                gpt_score: resultsData.results.scores.gpt_score,
                gemini_score: resultsData.results.scores.gemini_score,
                dataforseo_score: resultsData.results.scores.dataforseo_score ?? resultsData.meta?.dataforseo_score,
                completed_at: new Date().toISOString(),
                requested_queries: resultsData.queries.length,
                num_queries: resultsData.queries.length,
              },
            };
            setResults(mappedResults);
            setIsAnalyzing(false);
            toast({
              title: "Analysis Complete",
              description: "Citation analysis completed successfully.",
            });
          } catch (error: any) {
            setIsAnalyzing(false);
            const { message } = handleApiError(error);
            toast({
              title: "Error",
              description: message,
              variant: "destructive",
            });
          }
        } else if (status.status === "failed") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsAnalyzing(false);
          const mappedStatus: CitationTaskStatus = {
            task_id: status.task_id,
            status: status.status as any,
            progress: status.progress ? {
              processed: status.progress.completed,
              total: status.progress.total,
              last_query_index: status.progress.completed,
              updated_at: new Date().toISOString(),
            } : undefined,
            meta: status.meta,
          };
          const errors = mappedStatus.meta?.errors || [];
          toast({
            title: "Analysis Failed",
            description: errors.length > 0 ? errors.join(", ") : "Task failed",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsAnalyzing(false);
        const { message } = handleApiError(error);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }
    };

    poll();
    pollingIntervalRef.current = setInterval(poll, 5000);
  }, [toast, maxPollingTime]);

  const handleAnalyze = async () => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a domain URL to analyze",
        variant: "destructive",
      });
      return;
    }

    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch (e) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setTaskStatus(null);
    setResults(null);
    setTaskId(null);

    try {
      const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
      const task = await apiClient.analyzeCitations({ url: normalizedUrl, num_queries: 1000 });
      setTaskId(task.task_id);
      startPolling(task.task_id);
      toast({
        title: "Analysis Started",
        description: "Citation analysis has been queued. This may take a few minutes.",
      });
    } catch (error: any) {
      setIsAnalyzing(false);
      const { message } = handleApiError(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleRetry = async () => {
    if (!taskId) return;

    setIsRetrying(true);
    try {
      await apiClient.retryCitationAnalysis(taskId);
      toast({
        title: "Retry Started",
        description: "Failed queries are being retried.",
      });
      startPolling(taskId);
    } catch (error: any) {
      const { message } = handleApiError(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const byQueryResults = useMemo<CitationByQueryEntry[]>(() => {
    if (!results?.results?.by_query) return [];
    const byQuery = results.results.by_query;
    if (Array.isArray(byQuery)) {
      return byQuery;
    }
    return Object.values(byQuery);
  }, [results]);

  const {
    currentPage,
    totalPages,
    paginatedData: paginatedQueryResults,
    goToPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems: totalQueryItems,
  } = usePagination(byQueryResults, { itemsPerPage: 10 });

  const competitorEntries = useMemo<CitationCompetitorEntry[]>(() => {
    if (!results?.competitors) {
      return [];
    }
    if (Array.isArray(results.competitors)) {
      return results.competitors;
    }
    return results.competitors.competitors || [];
  }, [results]);

  // Calculate metrics from results
  const gptScore = results?.results?.scores?.gpt_score ?? taskStatus?.meta?.gpt_score ?? 0;
  const geminiScore = results?.results?.scores?.gemini_score ?? taskStatus?.meta?.gemini_score ?? 0;
  const dataforseoScore = results?.results?.scores?.dataforseo_score ?? taskStatus?.meta?.dataforseo_score ?? 0;
  const totalQueries =
    byQueryResults.length ||
    results?.queries?.length ||
    taskStatus?.meta?.num_queries ||
    taskStatus?.meta?.requested_queries ||
    0;
  
  const gptCitedCount = byQueryResults.filter((entry) => entry.gpt?.citation_found).length;
  const geminiCitedCount = byQueryResults.filter((entry) => entry.gemini?.citation_found).length;
  
  // Check if DataForSEO is being used (provider field in gpt result)
  const isDataForSEO = byQueryResults.some((entry) => entry.gpt?.provider === 'dataforseo');
  const primaryProvider = isDataForSEO ? 'DataForSEO' : 'GPT';
  const primaryScore = isDataForSEO ? dataforseoScore : gptScore;

  const citationShareData = [
    { name: primaryProvider, value: primaryScore },
    { name: "Gemini", value: geminiScore },
  ].filter(item => item.value > 0);

  const competitorData = competitorEntries.slice(0, 10).map((comp) => {
    const citations =
      comp.citation_count ??
      comp.count ??
      (comp.providers ? (comp.providers.gpt ?? 0) + (comp.providers.gemini ?? 0) : 0);
    return {
      name: comp.domain,
      citations,
    };
  });

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

  const progressPercentage = taskStatus?.progress
    ? Math.round((taskStatus.progress.processed / taskStatus.progress.total) * 100)
    : 0;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Indexability & Citations</h1>
        <p className="text-muted-foreground">
          Track your visibility across AI search platforms
        </p>
      </div>

      <Card data-testid="card-analyze">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Domain URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  data-testid="input-url"
                  disabled={isAnalyzing}
                  className="flex-1"
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  data-testid="button-analyze"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isAnalyzing ? "Analyzing..." : "Analyze Citations"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The system will generate hot topic questions and check if your domain is cited in GPT and Gemini responses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAnalyzing && taskStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Status: {taskStatus.status}</span>
                {taskStatus.progress && (
                  <span>
                    {taskStatus.progress.processed} / {taskStatus.progress.total} queries
                  </span>
                )}
              </div>
              {taskStatus.progress && (
                <Progress value={progressPercentage} className="h-2" />
              )}
            </div>
            {taskStatus.status === "failed" && taskStatus.meta?.errors && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Analysis Failed</p>
                  <ul className="text-xs text-destructive/80 mt-1 list-disc list-inside">
                    {taskStatus.meta.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isAnalyzing && !taskStatus && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {results && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="card-queries">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Queries Checked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalQueries}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Hot topic questions analyzed
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-gpt-score">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{primaryProvider} Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{primaryScore.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {gptCitedCount} of {totalQueries} queries cited
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-gemini-score">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gemini Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{geminiScore.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {geminiCitedCount} of {totalQueries} queries cited
                </p>
              </CardContent>
            </Card>
          </div>

          {taskStatus?.status === "failed" && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <span className="font-medium">Analysis encountered errors</span>
                  </div>
                  <Button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? "animate-spin" : ""}`} />
                    {isRetrying ? "Retrying..." : "Retry Failed Queries"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {citationShareData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-citation-share">
                <CardHeader>
                  <CardTitle>Citation Scores by Provider</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={citationShareData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                        >
                          {citationShareData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {competitorData.length > 0 && (
                <Card data-testid="card-competitor-comparison">
                  <CardHeader>
                    <CardTitle>Top Competitors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={competitorData}>
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80} 
                            tick={{ fontSize: 12 }} 
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="citations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <Card data-testid="card-queries-table">
            <CardHeader>
              <CardTitle>Query Analysis</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead>{isDataForSEO ? 'DataForSEO' : 'GPT'}</TableHead>
                      <TableHead>Gemini</TableHead>
                      <TableHead>References</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedQueryResults.map((queryResult, index) => {
                      const actualIndex = (currentPage - 1) * itemsPerPage + index;
                      const queryLabel =
                        queryResult.query ||
                        results?.queries?.[actualIndex] ||
                        `Query ${actualIndex + 1}`;
                      return (
                        <TableRow key={`${queryLabel}-${actualIndex}`} data-testid={`row-query-${actualIndex}`}>
                          <TableCell className="font-medium">{queryLabel}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {queryResult.gpt.citation_found ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span className="text-sm">
                                {queryResult.gpt.citation_found 
                                  ? `${queryResult.gpt.confidence}%` 
                                  : "Not cited"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {queryResult.gemini.citation_found ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span className="text-sm">
                                {queryResult.gemini.citation_found 
                                  ? `${queryResult.gemini.confidence}%` 
                                  : "Not cited"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {queryResult.gpt.citation_references.length > 0 && (
                                <div className="text-xs">
                                  <span className="font-medium">
                                    {queryResult.gpt.provider === 'dataforseo' ? 'DataForSEO' : 'GPT'}: 
                                  </span>
                                  {queryResult.gpt.citation_references.slice(0, 2).map((ref, i) => {
                                    // Handle both string and object formats
                                    const url: string = typeof ref === 'string' 
                                      ? ref 
                                      : (typeof ref === 'object' && ref !== null && 'url' in ref 
                                          ? String(ref.url) 
                                          : String(ref));
                                    const displayText: string = typeof ref === 'string' 
                                      ? ref 
                                      : (typeof ref === 'object' && ref !== null && 'url' in ref 
                                          ? String(ref.url) 
                                          : String(ref));
                                    return (
                                      <a
                                        key={i}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline block truncate max-w-xs"
                                        title={displayText}
                                      >
                                        {displayText}
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                              {queryResult.gemini.citation_references.length > 0 && (
                                <div className="text-xs">
                                  <span className="font-medium">Gemini: </span>
                                  {queryResult.gemini.citation_references.slice(0, 2).map((ref, i) => {
                                    // Handle both string and object formats
                                    const url: string = typeof ref === 'string' 
                                      ? ref 
                                      : (typeof ref === 'object' && ref !== null && 'url' in ref 
                                          ? String(ref.url) 
                                          : String(ref));
                                    const displayText: string = typeof ref === 'string' 
                                      ? ref 
                                      : (typeof ref === 'object' && ref !== null && 'url' in ref 
                                          ? String(ref.url) 
                                          : String(ref));
                                    return (
                                      <a
                                        key={i}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline block truncate max-w-xs"
                                        title={displayText}
                                      >
                                        {displayText}
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                              {queryResult.gpt.citation_references.length === 0 && 
                               queryResult.gemini.citation_references.length === 0 && (
                                <span className="text-xs text-muted-foreground">No references</span>
                              )}
                            </div>
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
                  totalItems={totalQueryItems}
                  onPageChange={goToPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
