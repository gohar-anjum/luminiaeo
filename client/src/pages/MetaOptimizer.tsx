import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Download, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, ApiError, handleApiError, validateUrl, normalizeUrl } from "@/lib/api";

function formatRelativeTime(isoDate?: string | null): string | null {
  if (!isoDate) return null;
  const analyzedTime = new Date(isoDate).getTime();
  if (Number.isNaN(analyzedTime)) return null;
  const now = Date.now();
  const diffMs = now - analyzedTime;
  const diffSeconds = Math.round(diffMs / 1000);
  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export default function MetaOptimizer() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleScan = async () => {
    const trimmed = url.trim();

    if (!trimmed) {
      setUrlError("Please enter a URL to scan");
      toast({
        title: "Error",
        description: "Please enter a URL to scan",
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

    setIsScanning(true);
    setUrlError(null);

    try {
      const normalizedUrl = normalizeUrl(trimmed);
      const response = await apiClient.optimizeMetaTags({ url: normalizedUrl });

      setResults({
        url: normalizedUrl,
        suggested: {
          title: response.title,
          description: response.description,
        },
        primary_keyword: (response as any).primary_keyword ?? null,
        intent: (response as any).intent ?? null,
        from_cache: response.from_cache,
        analyzed_at: response.analyzed_at ?? null,
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
      setIsScanning(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const handleDownload = () => {
    toast({
      title: "Download started",
      description: "Downloading meta tag data as JSON...",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "long":
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case "missing":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return <Badge className="bg-success text-success-foreground">OK</Badge>;
      case "long":
        return <Badge className="bg-warning text-warning-foreground">Too Long</Badge>;
      case "missing":
        return <Badge variant="destructive">Missing</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Meta Tag Optimizer</h1>
        <p className="text-muted-foreground">
          Optimize your meta tags for better AI visibility
        </p>
      </div>

      <Card data-testid="card-scan">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL to Scan</Label>
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
                  onClick={handleScan}
                  disabled={isScanning}
                  data-testid="button-scan"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isScanning ? "Scanning..." : "Scan"}
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

      {results && (
        <>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              {results.primary_keyword && (
                <Badge variant="outline" className="text-xs">
                  Primary keyword: {results.primary_keyword}
                </Badge>
              )}
              {results.intent && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {results.intent === "commercial"
                    ? "Commercial intent"
                    : results.intent === "informational"
                      ? "Informational intent"
                      : results.intent === "comparative"
                        ? "Comparative intent"
                        : results.intent}
                </Badge>
              )}
              {results.from_cache && (
                <Badge variant="outline" className="text-xs">
                  Using last 24h result
                </Badge>
              )}
            </div>
            {results.analyzed_at && (
              <p className="text-[11px] text-muted-foreground">
                {results.from_cache
                  ? (() => {
                      const rel = formatRelativeTime(results.analyzed_at);
                      return rel
                        ? `Using analysis from ${rel} (no additional credits used).`
                        : "Using cached analysis (no additional credits used).";
                    })()
                  : "New analysis just run."}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleDownload} variant="outline" data-testid="button-download">
              <Download className="w-4 h-4 mr-2" />
              Download JSON
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Meta Tags */}
            <Card data-testid="card-current">
              <CardHeader>
                <CardTitle>Current Meta Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {results.current ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Meta Title</div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(results.current.titleStatus)}
                          {getStatusBadge(results.current.titleStatus)}
                        </div>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <div className="text-sm">{results.current.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {results.current.title.length} / 60 characters
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Meta Description</div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(results.current.descriptionStatus)}
                          {getStatusBadge(results.current.descriptionStatus)}
                        </div>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <div className="text-sm">{results.current.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {results.current.description.length} / 160 characters
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Current meta tags will appear here when available.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Suggested Meta Tags */}
            <Card data-testid="card-suggested">
              <CardHeader>
                <CardTitle>Suggested Meta Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Suggested Title</div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(results.suggested.title)}
                      data-testid="button-copy-title"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <Textarea
                    value={results.suggested.title}
                    onChange={(e) =>
                      setResults({
                        ...results,
                        suggested: { ...results.suggested, title: e.target.value },
                      })
                    }
                    rows={2}
                    className="resize-none"
                    data-testid="textarea-title"
                  />
                  <div className="text-xs text-muted-foreground">
                    {results.suggested.title.length} / 60 characters
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Suggested Description</div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(results.suggested.description)}
                      data-testid="button-copy-description"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <Textarea
                    value={results.suggested.description}
                    onChange={(e) =>
                      setResults({
                        ...results,
                        suggested: { ...results.suggested, description: e.target.value },
                      })
                    }
                    rows={3}
                    className="resize-none"
                    data-testid="textarea-description"
                  />
                  <div className="text-xs text-muted-foreground">
                    {results.suggested.description.length} / 160 characters
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Google Snippet Preview */}
          <Card data-testid="card-preview">
            <CardHeader>
              <CardTitle>Google Snippet Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-md space-y-2">
                <div className="text-sm text-muted-foreground">{url}</div>
                <div className="text-xl text-primary hover:underline cursor-pointer">
                  {results.suggested.title}
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {results.suggested.description}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
