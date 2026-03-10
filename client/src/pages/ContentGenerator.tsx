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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Copy,
  Download,
  Clock,
  Coins,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquareText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, handleApiError } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type {
  ContentOutlineResponse,
  ContentOutlineHistoryItem,
  ContentTone,
  OutlineSection,
  PaginatedResponse,
} from "@/lib/api/types";
import { useQueryClient } from "@tanstack/react-query";

const CREDIT_COST = 4;

const TONE_OPTIONS: { value: ContentTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "academic", label: "Academic" },
  { value: "persuasive", label: "Persuasive" },
  { value: "informative", label: "Informative" },
];

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function outlineToMarkdown(response: ContentOutlineResponse): string {
  const { outline, semantic_keywords, intent, tone } = response;
  let md = `# ${outline.title}\n\n`;
  md += `> Intent: ${intent} | Tone: ${tone} | ~${outline.estimated_word_count} words\n\n`;

  for (const section of outline.sections) {
    md += `## ${section.heading}\n\n`;
    md += `${section.brief}\n\n`;
    if (section.keywords.length) {
      md += `_Keywords: ${section.keywords.join(", ")}_\n\n`;
    }
    for (const sub of section.subsections) {
      md += `### ${sub.heading}\n\n`;
      md += `${sub.brief}\n\n`;
      if (sub.keywords.length) {
        md += `_Keywords: ${sub.keywords.join(", ")}_\n\n`;
      }
    }
  }

  if (outline.faq_suggestions.length) {
    md += `## FAQ\n\n`;
    for (const q of outline.faq_suggestions) {
      md += `- ${q}\n`;
    }
    md += "\n";
  }

  if (semantic_keywords.length) {
    md += `---\n\nSemantic keywords: ${semantic_keywords.join(", ")}\n`;
  }

  return md;
}

function outlineToText(response: ContentOutlineResponse): string {
  const { outline } = response;
  let text = `${outline.title}\n${"=".repeat(outline.title.length)}\n\n`;

  for (const section of outline.sections) {
    text += `${section.heading}\n${"-".repeat(section.heading.length)}\n`;
    text += `${section.brief}\n\n`;
    for (const sub of section.subsections) {
      text += `  ${sub.heading}\n`;
      text += `  ${sub.brief}\n\n`;
    }
  }

  if (outline.faq_suggestions.length) {
    text += `FAQ\n---\n`;
    for (const q of outline.faq_suggestions) {
      text += `• ${q}\n`;
    }
  }

  return text;
}

function SectionItem({
  section,
  toast,
}: {
  section: OutlineSection;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border-l-2 border-primary/30 pl-4 py-2">
        <CollapsibleTrigger className="flex items-start gap-2 w-full text-left group">
          <ChevronDown
            className={`w-4 h-4 mt-1 shrink-0 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`}
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm group-hover:text-primary transition-colors">
              {section.heading}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {section.brief}
            </p>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {section.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 ml-6">
              {section.keywords.map((kw) => (
                <Badge
                  key={kw}
                  variant="secondary"
                  className="text-[10px] cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(kw);
                    toast({ title: "Copied!", description: `"${kw}" copied.` });
                  }}
                >
                  {kw}
                </Badge>
              ))}
            </div>
          )}
          {section.subsections.length > 0 && (
            <div className="ml-6 mt-2 space-y-2">
              {section.subsections.map((sub, si) => (
                <div key={si} className="border-l border-muted-foreground/20 pl-3 py-1">
                  <div className="text-sm font-medium">{sub.heading}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sub.brief}
                  </p>
                  {sub.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sub.keywords.map((kw) => (
                        <Badge
                          key={kw}
                          variant="outline"
                          className="text-[10px] cursor-pointer"
                          onClick={() => {
                            navigator.clipboard.writeText(kw);
                            toast({ title: "Copied!", description: `"${kw}" copied.` });
                          }}
                        >
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function ContentGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState("");
  const [tone, setTone] = useState<ContentTone>("professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<ContentOutlineResponse | null>(null);

  // History
  const [history, setHistory] = useState<PaginatedResponse<ContentOutlineHistoryItem> | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const handleGenerate = async () => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      toast({
        title: "Error",
        description: "Please enter a keyword to generate an outline",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setResults(null);

    try {
      const response = await apiClient.generateContentOutline({
        keyword: trimmed,
        tone,
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
            description: `You need ${CREDIT_COST} credits for this feature. Visit the Billing page to purchase more.`,
            variant: "destructive",
          });
        } else if (error.status === 422) {
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
      setIsGenerating(false);
    }
  };

  const loadHistory = useCallback(
    async (page: number) => {
      setIsLoadingHistory(true);
      try {
        const data = await apiClient.getContentOutlineHistory(page, 10);
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

  const handleDownloadJSON = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `outline-${results.keyword.replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Semantic Content Generator</h1>
        <p className="text-muted-foreground">
          Generate AI-powered, semantically optimized content outlines for any keyword
        </p>
      </div>

      <Tabs
        defaultValue="generate"
        onValueChange={(v) => {
          if (v === "history" && !history) loadHistory(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6 mt-4">
          <Card data-testid="card-generator">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyword" className="text-base font-medium">
                  Target Keyword
                </Label>
                <Input
                  id="keyword"
                  placeholder="e.g. remote work productivity tips"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="text-base h-11"
                  data-testid="input-keyword"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Tone</Label>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTone(opt.value)}
                      className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        tone === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                      }`}
                      data-testid={`button-tone-${opt.value}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
                data-testid="button-generate"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating outline...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Outline
                    <Badge variant="secondary" className="ml-2 text-xs">
                      <Coins className="w-3 h-3 mr-1" />
                      {CREDIT_COST} credits
                    </Badge>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {isGenerating && (
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-48" />
              <div className="space-y-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          )}

          {results && !isGenerating && (
            <>
              {/* Cache badge */}
              {results.from_cache && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Clock className="w-3 h-3" />
                    Cached result (free)
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Generated {formatDate(results.generated_at)}
                  </span>
                </div>
              )}

              {/* Title */}
              <h2 className="text-2xl font-bold" data-testid="text-outline-title">
                {results.outline.title}
              </h2>

              {/* Meta bar */}
              <div className="flex flex-wrap items-center gap-2">
                <IntentBadge intent={results.intent} />
                <Badge variant="outline" className="text-xs capitalize">
                  {results.tone}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  ~{results.outline.estimated_word_count.toLocaleString()} words
                </Badge>
              </div>

              {/* Outline tree */}
              <Card data-testid="card-outline">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Content Outline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {results.outline.sections.map((section, i) => (
                    <SectionItem key={i} section={section} toast={toast} />
                  ))}
                </CardContent>
              </Card>

              {/* Semantic Keywords */}
              {results.semantic_keywords.length > 0 && (
                <Card data-testid="card-semantic-keywords">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Semantic Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {results.semantic_keywords.map((kw) => (
                        <Badge
                          key={kw}
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(kw);
                            toast({ title: "Copied!", description: `"${kw}" copied.` });
                          }}
                        >
                          {kw}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Click any keyword to copy it to your clipboard
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* FAQ Suggestions */}
              {results.outline.faq_suggestions.length > 0 && (
                <Card data-testid="card-faq">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquareText className="w-4 h-4" />
                      FAQ Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {results.outline.faq_suggestions.map((q, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-md border bg-muted/30"
                      >
                        <span className="text-sm">{q}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(q);
                            toast({ title: "Copied!", description: "Question copied." });
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Export actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(outlineToMarkdown(results));
                    toast({ title: "Copied!", description: "Markdown outline copied." });
                  }}
                  data-testid="button-copy-markdown"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy as Markdown
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(outlineToText(results));
                    toast({ title: "Copied!", description: "Plain text outline copied." });
                  }}
                  data-testid="button-copy-text"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy as Text
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadJSON}
                  data-testid="button-download-json"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
              </div>
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
                    No generation history yet.
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
                        {history.data.map((item, idx) => (
                          <>
                            <TableRow
                              key={idx}
                              className="cursor-pointer"
                              onClick={() =>
                                setExpandedRow(expandedRow === idx ? null : idx)
                              }
                            >
                              <TableCell className="text-sm font-medium">
                                {item.keyword}
                              </TableCell>
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
                            {expandedRow === idx && (
                              <TableRow key={`${idx}-expanded`}>
                                <TableCell colSpan={4} className="bg-muted/50 p-4">
                                  <h4 className="font-semibold mb-2">
                                    Outline for &quot;{item.keyword}&quot;
                                  </h4>
                                  <div className="space-y-1 text-sm">
                                    {(Array.isArray(item.outline) ? item.outline : []).map((s, si) => (
                                      <div key={si} className="ml-2">
                                        <div className="font-medium">
                                          {s.heading}
                                        </div>
                                        {(s.subsections ?? []).map((sub, ssi) => (
                                          <div
                                            key={ssi}
                                            className="ml-4 text-muted-foreground"
                                          >
                                            {sub.heading}
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                  {item.semantic_keywords && item.semantic_keywords.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-3">
                                      {item.semantic_keywords.map((kw) => (
                                        <Badge
                                          key={kw}
                                          variant="secondary"
                                          className="text-[10px]"
                                        >
                                          {kw}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
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
