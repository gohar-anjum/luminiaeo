import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentAreaLoader } from "@/components/ContentAreaLoader";
import { Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, handleApiError, validateUrl, normalizeUrl } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { SemanticScoreResponse, KeywordScore } from "@/lib/api/types";
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

      {(results !== null || isAnalyzing) && (
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Semantic Score Checker</h1>
      )}

      <div className="space-y-6 mt-4">
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
      </div>
    </div>
  );
}
