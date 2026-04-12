import { useState, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, handleApiError, validateUrl, normalizeUrl } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type {
  SemanticScoreResponse,
  SemanticScoreHistoryItem,
  KeywordScore,
  PaginatedResponse,
} from "@/lib/api/types";
import { useQueryClient } from "@tanstack/react-query";
import { FeatureHero } from "@/components/FeatureHero";
import { SEMANTIC_SCORE_HERO } from "@/config/featureHeroConfigs";

const CREDIT_COST = 1;

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

function gaugeStrokeColor(score: number) {
  if (score >= 0.8) return "stroke-green-500";
  if (score >= 0.6) return "stroke-lime-500";
  if (score >= 0.4) return "stroke-orange-400";
  return "stroke-red-500";
}

function scoreLabel(score: number) {
  if (score >= 0.8) return "Excellent";
  if (score >= 0.6) return "Good";
  if (score >= 0.4) return "Needs Improvement";
  return "Poor";
}

function scoreLabelColor(score: number) {
  if (score >= 0.8) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  if (score >= 0.6) return "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200";
  if (score >= 0.4) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
}

function interpretation(score: number, keyword: string) {
  if (score >= 0.7)
    return `Your page has strong semantic relevance for "${keyword}".`;
  if (score >= 0.4)
    return `Your page has moderate semantic coverage. Consider adding more content about "${keyword}".`;
  return `Your page has weak semantic relevance. The content needs significant optimization for "${keyword}".`;
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

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            className="stroke-muted"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            className={gaugeStrokeColor(score)}
            strokeWidth="3"
            strokeDasharray={`${pct}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-4xl font-bold ${scoreColor(score)}`} data-testid="text-score">
            {pct}%
          </div>
        </div>
      </div>
      <span
        className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${scoreLabelColor(score)}`}
      >
        {scoreLabel(score)}
      </span>
    </div>
  );
}

function KeywordBar({
  item,
  isPrimary,
}: {
  item: KeywordScore;
  isPrimary: boolean;
}) {
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
        <span className={`text-sm font-semibold ${scoreColor(item.semantic_score)}`}>
          {semPct}%
        </span>
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

export default function SemanticScore() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<SemanticScoreResponse | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<PaginatedResponse<SemanticScoreHistoryItem> | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const handleAnalyze = async () => {
    const trimmed = url.trim();

    if (!trimmed) {
      setUrlError("Please enter a URL to analyze");
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

    setIsAnalyzing(true);
    setUrlError(null);
    setResults(null);

    try {
      const normalizedUrl = normalizeUrl(trimmed);
      const response = await apiClient.getSemanticScore({
        url: normalizedUrl,
        keyword: keyword.trim() || undefined,
      });

      setResults(response);

      if (!response.from_cache) {
        queryClient.invalidateQueries({ queryKey: ["/api/billing/balance"] });
      }
    } catch (error: any) {
      if (error instanceof ApiError) {
        if (error.status === 402) {
          toast({
            title: "Insufficient credits",
            description: `You need ${CREDIT_COST} credit for this feature. Visit the Billing page to purchase more.`,
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
      setIsAnalyzing(false);
    }
  };

  const loadHistory = useCallback(
    async (page: number) => {
      setIsLoadingHistory(true);
      try {
        const data = await apiClient.getSemanticScoreHistory(page, 10);
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

  return (
    <div className="p-8 space-y-6">
      <FeatureHero
        {...SEMANTIC_SCORE_HERO}
        inputValue={url}
        onInputChange={(v) => {
          setUrl(v);
          if (urlError) setUrlError(null);
        }}
        onCtaClick={handleAnalyze}
        ctaDisabled={isAnalyzing || !url.trim()}
        hasResults={results !== null || isAnalyzing}
        secondaryInputPlaceholder="Focus keyword (optional, auto-detected if empty)"
        secondaryInputValue={keyword}
        onSecondaryInputChange={setKeyword}
      />

      <Tabs
        defaultValue="analyze"
        onValueChange={(v) => {
          if (v === "history" && !history) loadHistory(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="analyze">Analyze</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6 mt-4">
          {urlError && (
            <p className="text-sm text-destructive" data-testid="text-url-error">
              {urlError}
            </p>
          )}

          <ContentAreaLoader
            loading={isAnalyzing}
            phase="Computing semantic score…"
            minHeightClassName="min-h-[300px]"
          >
          {results && !isAnalyzing && (
            <>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResults(null)}
                >
                  ← New Search
                </Button>
              </div>

              {/* Cache badge */}
              {results.from_cache && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Clock className="w-3 h-3" />
                    Cached result (free)
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Analyzed {formatDate(results.analyzed_at)}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Score Gauge */}
                <Card data-testid="card-score">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Overall Score</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center py-4">
                    <ScoreGauge score={results.semantic_score} />
                    {results.primary_keyword && (
                      <p className="mt-4 text-sm font-medium text-center">
                        {results.primary_keyword}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground text-center max-w-[260px]">
                      {interpretation(
                        results.semantic_score,
                        results.primary_keyword
                      )}
                    </p>
                  </CardContent>
                </Card>

                {/* Keyword Scores */}
                <Card className="lg:col-span-2" data-testid="card-keywords">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Keyword Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[450px] overflow-y-auto">
                    {results.keyword_scores.map((ks) => (
                      <KeywordBar
                        key={ks.phrase}
                        item={ks}
                        isPrimary={ks.phrase === results.primary_keyword}
                      />
                    ))}
                    {results.keyword_scores.length === 0 && (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No keyword breakdown available.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
          </ContentAreaLoader>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            For a bookmarkable view with the same API data, open{" "}
            <Link
              href="/page-analysis/history?tool=semantic"
              className="text-primary font-medium underline-offset-2 hover:underline"
            >
              Analysis history → Semantic
            </Link>
            .
          </p>
          <ContentAreaLoader
            loading={isLoadingHistory}
            phase="Loading analysis history…"
            minHeightClassName="min-h-[200px]"
          >
          {history && !isLoadingHistory && (
            <>
              {history.data.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No analysis history yet.
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
                        {history.data.map((item, idx) => {
                          const pct = Math.round(item.semantic_score * 100);
                          return (
                            <>
                              <TableRow
                                key={idx}
                                className="cursor-pointer"
                                onClick={() =>
                                  setExpandedRow(expandedRow === idx ? null : idx)
                                }
                              >
                                <TableCell className="max-w-[220px] truncate text-sm">
                                  {item.source_url}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {item.target_keyword || item.comparison_value || "—"}
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`text-sm font-semibold ${scoreColor(item.semantic_score)}`}
                                  >
                                    {pct}%
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDate(item.analyzed_at)}
                                </TableCell>
                              </TableRow>
                              {expandedRow === idx && (
                                <TableRow key={`${idx}-expanded`}>
                                  <TableCell colSpan={4} className="bg-muted/50 p-4">
                                    <div className="space-y-2">
                                      {item.keyword_scores && item.keyword_scores.length > 0 ? (
                                        item.keyword_scores.map((ks) => (
                                          <KeywordBar
                                            key={ks.phrase}
                                            item={ks}
                                            isPrimary={ks.phrase === (item.target_keyword ?? item.comparison_value)}
                                          />
                                        ))
                                      ) : (
                                        <p className="text-sm text-muted-foreground">
                                          No keyword breakdown available for this analysis.
                                        </p>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          );
                        })}
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
          </ContentAreaLoader>
        </TabsContent>
      </Tabs>
    </div>
  );
}
