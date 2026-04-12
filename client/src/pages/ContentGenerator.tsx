import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentAreaLoader } from "@/components/ContentAreaLoader";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Copy,
  Download,
  Clock,
  ChevronDown,
  FileText,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, handleApiError } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { ContentOutlineResponse, ContentTone, OutlineSection } from "@/lib/api/types";
import { useQueryClient } from "@tanstack/react-query";
import { FeatureHero } from "@/components/FeatureHero";
import { CONTENT_GENERATOR_HERO } from "@/config/featureHeroConfigs";
import { cn } from "@/lib/utils";

const CREDIT_COST = 4;

const TONE_OPTIONS: { value: ContentTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "academic", label: "Academic" },
  { value: "persuasive", label: "Persuasive" },
  { value: "informative", label: "Informative" },
];

function TonePicker({
  tone,
  setTone,
}: {
  tone: ContentTone;
  setTone: (t: ContentTone) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-center mt-2.5 items-center">
      <span className="text-xs text-muted-foreground shrink-0 mr-0.5">Tone:</span>
      {TONE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setTone(opt.value)}
          data-testid={`button-tone-${opt.value}`}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors",
            tone === opt.value
              ? "border-[#8b5cf6] bg-[#8b5cf6]/10 text-[#8b5cf6]"
              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
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
      <FeatureHero
        {...CONTENT_GENERATOR_HERO}
        inputValue={keyword}
        onInputChange={setKeyword}
        onCtaClick={handleGenerate}
        ctaDisabled={isGenerating || !keyword.trim()}
        hasResults={results !== null || isGenerating}
        formExtras={<TonePicker tone={tone} setTone={setTone} />}
      />

      {(results !== null || isGenerating) && (
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Content Generator</h1>
      )}

      <div className="space-y-6 mt-4">
          <ContentAreaLoader
            loading={isGenerating}
            phase="Generating content outline…"
            minHeightClassName="min-h-[360px]"
          >
          {results && !isGenerating && (
            <>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => setResults(null)}>
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
          </ContentAreaLoader>
      </div>
    </div>
  );
}
