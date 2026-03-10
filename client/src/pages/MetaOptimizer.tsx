import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Copy,
  ClipboardCopy,
  Lightbulb,
  Clock,
  Coins,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, handleApiError, validateUrl, normalizeUrl } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type {
  MetaOptimizeResponse,
  MetaOptimizeHistoryItem,
  PaginatedResponse,
} from "@/lib/api/types";
import { useQueryClient } from "@tanstack/react-query";

const CREDIT_COST = 4;

function charCountColor(len: number, min: number, max: number) {
  if (len >= min && len <= max) return "text-green-600 dark:text-green-400";
  if (len > 0 && (len >= min - 10 || len <= max + 10))
    return "text-yellow-600 dark:text-yellow-400";
  return "text-red-500 dark:text-red-400";
}

function IntentBadge({ intent }: { intent: string | null }) {
  if (!intent) return null;
  const colors: Record<string, string> = {
    commercial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    comparative:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    informational:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors[intent] ?? "bg-muted text-muted-foreground"}`}
    >
      {intent}
    </span>
  );
}

function CacheBadge({ fromCache }: { fromCache: boolean }) {
  if (!fromCache) return null;
  return (
    <Badge variant="outline" className="gap-1 text-xs">
      <Clock className="w-3 h-3" />
      Cached result (free)
    </Badge>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MetaOptimizer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<MetaOptimizeResponse | null>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<PaginatedResponse<MetaOptimizeHistoryItem> | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const handleScan = async () => {
    const trimmed = url.trim();

    if (!trimmed) {
      setUrlError("Please enter a URL to optimize");
      return;
    }

    if (trimmed.length > 2048) {
      setUrlError("URL must be 2048 characters or less");
      return;
    }

    if (!validateUrl(trimmed)) {
      setUrlError("Please enter a valid URL (e.g. https://example.com)");
      return;
    }

    setIsScanning(true);
    setUrlError(null);
    setResults(null);

    try {
      const normalizedUrl = normalizeUrl(trimmed);
      const response = await apiClient.optimizeMetaTags({
        url: normalizedUrl,
        keyword: keyword.trim() || undefined,
      });

      setResults(response);
      setAnalyzedUrl(normalizedUrl);

      if (!response.from_cache) {
        queryClient.invalidateQueries({ queryKey: ["/api/billing/balance"] });
      }
    } catch (error: any) {
      if (error instanceof ApiError) {
        if (error.status === 402) {
          toast({
            title: "Insufficient credits",
            description: `You need ${CREDIT_COST} credits for this feature. Visit the Billing page to purchase more.`,
            variant: "destructive",
          });
        } else if (error.status === 422) {
          setUrlError(error.message || "Please check your input.");
          toast({ title: "Validation error", description: error.message, variant: "destructive" });
        } else if (error.status === 429) {
          toast({ title: "Rate limit reached", description: "Please wait a moment and try again.", variant: "destructive" });
        } else if (error.status === 503) {
          toast({ title: "Service unavailable", description: "Analysis service temporarily unavailable. Please try again.", variant: "destructive" });
        } else {
          const { message } = handleApiError(error);
          toast({ title: "Error", description: message, variant: "destructive" });
        }
      } else {
        const { message } = handleApiError(error);
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    } finally {
      setIsScanning(false);
    }
  };

  const loadHistory = useCallback(
    async (page: number) => {
      setIsLoadingHistory(true);
      try {
        const data = await apiClient.getMetaOptimizeHistory(page, 10);
        setHistory(data);
        setHistoryPage(page);
      } catch (error: any) {
        const { message } = handleApiError(error);
        toast({ title: "Error loading history", description: message, variant: "destructive" });
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [toast]
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  const copyAll = () => {
    if (!results) return;
    const text = `Title: ${results.title}\nDescription: ${results.description}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Title and description copied." });
  };

  const handleReanalyze = (item: MetaOptimizeHistoryItem) => {
    setUrl(item.url);
    setKeyword(item.target_keyword ?? "");
    setResults(null);
    setExpandedRow(null);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Meta Tag Optimizer</h1>
        <p className="text-muted-foreground">
          Analyze and optimize your page's meta tags for better SEO and click-through rates
        </p>
      </div>

      <Tabs
        defaultValue="optimize"
        onValueChange={(v) => {
          if (v === "history" && !history) loadHistory(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="optimize">Optimize</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Optimize Tab */}
        <TabsContent value="optimize" className="space-y-6 mt-4">
          <Card data-testid="card-scan">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Page URL</Label>
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
                {urlError && (
                  <p className="text-xs text-destructive">{urlError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyword">Target Keyword</Label>
                <Input
                  id="keyword"
                  placeholder="Enter your target keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  data-testid="input-keyword"
                />
                <p className="text-xs text-muted-foreground">
                  Optional but recommended for more accurate optimization
                </p>
              </div>
              <Button
                onClick={handleScan}
                disabled={isScanning}
                className="w-full"
                data-testid="button-optimize"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing page content...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Optimize
                    <Badge variant="secondary" className="ml-2 text-xs">
                      <Coins className="w-3 h-3 mr-1" />
                      {CREDIT_COST} credits
                    </Badge>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {isScanning && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
              <Skeleton className="h-32" />
            </div>
          )}

          {results && !isScanning && (
            <>
              {/* Status badges row */}
              <div className="flex flex-wrap items-center gap-2">
                <IntentBadge intent={results.intent} />
                {results.primary_keyword && (
                  <Badge variant="outline" className="text-xs">
                    Keyword: {results.primary_keyword}
                  </Badge>
                )}
                <CacheBadge fromCache={results.from_cache} />
                {results.analyzed_at && (
                  <span className="text-xs text-muted-foreground">
                    Analyzed {formatDate(results.analyzed_at)}
                  </span>
                )}
              </div>

              {/* Before / After comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="card-original">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Original Meta Tags</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium">Title</div>
                      <div className="p-3 rounded-md bg-muted text-sm">
                        {results.original_title || (
                          <span className="text-muted-foreground italic">Missing</span>
                        )}
                      </div>
                      <div
                        className={`text-xs ${charCountColor(
                          (results.original_title ?? "").length,
                          50,
                          60
                        )}`}
                      >
                        {(results.original_title ?? "").length} characters
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium">Description</div>
                      <div className="p-3 rounded-md bg-muted text-sm">
                        {results.original_description || (
                          <span className="text-muted-foreground italic">Missing</span>
                        )}
                      </div>
                      <div
                        className={`text-xs ${charCountColor(
                          (results.original_description ?? "").length,
                          140,
                          160
                        )}`}
                      >
                        {(results.original_description ?? "").length} characters
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/30" data-testid="card-optimized">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Optimized Meta Tags</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyAll}
                        data-testid="button-copy-all"
                      >
                        <ClipboardCopy className="w-3.5 h-3.5 mr-1.5" />
                        Copy All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Title</div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => copyToClipboard(results.title, "Title")}
                          data-testid="button-copy-title"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="p-3 rounded-md bg-primary/5 border border-primary/20 text-sm font-medium">
                        {results.title}
                      </div>
                      <div className={`text-xs ${charCountColor(results.title.length, 50, 60)}`}>
                        {results.title.length} / 50–60 characters
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Description</div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => copyToClipboard(results.description, "Description")}
                          data-testid="button-copy-description"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="p-3 rounded-md bg-primary/5 border border-primary/20 text-sm">
                        {results.description}
                      </div>
                      <div
                        className={`text-xs ${charCountColor(
                          results.description.length,
                          140,
                          160
                        )}`}
                      >
                        {results.description.length} / 140–160 characters
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Suggestions */}
              {results.suggestions && results.suggestions.length > 0 && (
                <Card data-testid="card-suggestions">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      Optimization Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {results.suggestions.map((s, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-sm text-muted-foreground"
                        >
                          <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-yellow-500/70" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Google Snippet Preview */}
              <Card data-testid="card-preview">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">SERP Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 border rounded-md space-y-1">
                    <div className="text-sm text-muted-foreground truncate">
                      {analyzedUrl}
                    </div>
                    <div className="text-lg text-primary hover:underline cursor-pointer leading-snug">
                      {results.title}
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {results.description}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-4">
          {isLoadingHistory && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          )}

          {history && !isLoadingHistory && (
            <>
              {history.data.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No optimization history yet. Run your first analysis above.
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
                          <TableHead>Suggested Title</TableHead>
                          <TableHead>Intent</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.data.map((item, idx) => (
                          <>
                            <TableRow
                              key={idx}
                              className="cursor-pointer"
                              onClick={() =>
                                setExpandedRow(expandedRow === idx ? null : idx)
                              }
                            >
                              <TableCell className="max-w-[200px] truncate text-sm">
                                {item.url}
                              </TableCell>
                              <TableCell className="text-sm">
                                {item.target_keyword || "—"}
                              </TableCell>
                              <TableCell className="max-w-[220px] truncate text-sm">
                                {item.suggested_title}
                              </TableCell>
                              <TableCell>
                                <IntentBadge intent={item.intent} />
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(item.analyzed_at)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReanalyze(item);
                                  }}
                                  title="Re-analyze"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            {expandedRow === idx && (
                              <TableRow key={`${idx}-expanded`}>
                                <TableCell colSpan={6} className="bg-muted/50 p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <div className="font-medium mb-1">
                                        Original Title
                                      </div>
                                      <p className="text-muted-foreground">
                                        {item.original_title || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <div className="font-medium mb-1">
                                        Optimized Title
                                      </div>
                                      <p>{item.suggested_title}</p>
                                    </div>
                                    <div>
                                      <div className="font-medium mb-1">
                                        Original Description
                                      </div>
                                      <p className="text-muted-foreground">
                                        {item.original_description || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <div className="font-medium mb-1">
                                        Optimized Description
                                      </div>
                                      <p>{item.suggested_description}</p>
                                    </div>
                                    {item.suggestions && item.suggestions.length > 0 && (
                                      <div className="md:col-span-2">
                                        <div className="font-medium mb-1">
                                          Suggestions
                                        </div>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                          {item.suggestions.map((s, si) => (
                                            <li key={si}>{s}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  {history.last_page > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <span className="text-sm text-muted-foreground">
                        Page {history.current_page} of {history.last_page} ({history.total} total)
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={history.current_page <= 1}
                          onClick={() => loadHistory(historyPage - 1)}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={history.current_page >= history.last_page}
                          onClick={() => loadHistory(historyPage + 1)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
