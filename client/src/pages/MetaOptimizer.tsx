import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentAreaLoader } from "@/components/ContentAreaLoader";
import {
  Copy,
  ClipboardCopy,
  Lightbulb,
  Clock,
} from "lucide-react";
import { FeatureHero } from "@/components/FeatureHero";
import { META_OPTIMIZER_HERO } from "@/config/featureHeroConfigs";
import { useToast } from "@/hooks/use-toast";
import { apiClient, handleApiError, validateUrl, normalizeUrl } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { MetaOptimizeResponse } from "@/lib/api/types";
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

  return (
    <div className="p-8 space-y-6">
      <FeatureHero
        {...META_OPTIMIZER_HERO}
        inputValue={url}
        onInputChange={(v) => {
          setUrl(v);
          if (urlError) setUrlError(null);
        }}
        onCtaClick={handleScan}
        ctaDisabled={isScanning || !url.trim()}
        hasResults={results !== null || isScanning}
        secondaryInputPlaceholder="Target keyword (optional but recommended)"
        secondaryInputValue={keyword}
        onSecondaryInputChange={setKeyword}
      />

      <div className="space-y-6 mt-4">
          {urlError && (
            <p className="text-sm text-destructive" data-testid="text-url-error">
              {urlError}
            </p>
          )}

          <ContentAreaLoader
            loading={isScanning}
            phase="Analyzing page meta tags…"
            minHeightClassName="min-h-[320px]"
          >
          {results && !isScanning && (
            <>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setResults(null);
                    setAnalyzedUrl("");
                  }}
                >
                  ← New Search
                </Button>
              </div>

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
          </ContentAreaLoader>
      </div>
    </div>
  );
}
