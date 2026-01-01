import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  AlertCircle, 
  X, 
  Sparkles, 
  Copy,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api/client";
import type { FAQQuestion } from "@/lib/api/types";
import { LocationSelector } from "@/components/LocationSelector";
import { useLocation } from "wouter";

export default function FAQGenerator() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [input, setInput] = useState("");
  const [locationCode, setLocationCode] = useState<number>(2840); // Default to US
  const [questions, setQuestions] = useState<FAQQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<"idle" | "pending" | "processing" | "completed" | "failed">("idle");
  const [progress, setProgress] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitializedFromParams = useRef(false);

  const normalizeInput = useCallback((value: string): string => {
    const trimmed = value.trim();
    // Auto-detect and add https:// if it looks like a URL but missing protocol
    if (trimmed && !trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      // Check if it looks like a domain (contains dots and no spaces)
      if (trimmed.includes(".") && !trimmed.includes(" ")) {
        return `https://${trimmed}`;
      }
    }
    return trimmed;
  }, []);

  // Read query parameters on mount and set input and location code
  useEffect(() => {
    if (hasInitializedFromParams.current) return;
    
    try {
      const url = new URL(window.location.href);
      const urlParam = url.searchParams.get("url");
      const locationCodeParam = url.searchParams.get("location_code");
      
      if (urlParam) {
        setInput(urlParam);
        hasInitializedFromParams.current = true;
      }
      
      if (locationCodeParam) {
        const parsedLocationCode = parseInt(locationCodeParam, 10);
        if (!isNaN(parsedLocationCode)) {
          setLocationCode(parsedLocationCode);
          hasInitializedFromParams.current = true;
        }
      }
    } catch (error) {
      console.error("Error reading query parameters:", error);
    }
  }, [location]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  const pollTaskStatus = useCallback(async (taskId: string) => {
    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearTimeout(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    const poll = async () => {
      try {
        const response = await apiClient.getFaqTaskStatus(taskId);
        
        // Update status and progress
        setTaskStatus(response.status);
        setProgress(response.progress || 0);
        
        // Update questions - show them immediately when available
        if (response.questions && Array.isArray(response.questions)) {
          setQuestions(response.questions);
        }

        // Check if completed or failed
        if (response.status === "completed") {
          if (pollIntervalRef.current) {
            clearTimeout(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setLoading(false);
          toast({
            title: "Success",
            description: `Generated ${response.total_questions || response.questions.length} FAQs successfully`,
          });
        } else if (response.status === "failed") {
          if (pollIntervalRef.current) {
            clearTimeout(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setLoading(false);
          const errorMsg = response.error || "Task failed";
          setError(errorMsg);
          toast({
            title: "Error",
            description: errorMsg,
            variant: "destructive",
          });
        } else {
          // Continue polling for pending/processing
          pollIntervalRef.current = setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (err: any) {
        if (pollIntervalRef.current) {
          clearTimeout(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setLoading(false);
        const errorMsg = err.message || "Failed to get task status";
        setError(errorMsg);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    };

    // Start polling immediately
    poll();
  }, [toast]);

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError("Please enter a URL or topic");
      return;
    }

    if (input.length > 2048) {
      setError("Input must be 2048 characters or less");
      return;
    }

    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearTimeout(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    setLoading(true);
    setError(null);
    setQuestions([]);
    setTaskStatus("idle");
    setProgress(0);
    setTaskId(null);

    try {
      const normalizedInput = normalizeInput(input);
      const response = await apiClient.createFaqTask({
        input: normalizedInput,
        options: { 
          temperature: 0.9,
          location_code: locationCode,
        },
      });

      // Get task_id from response
      const newTaskId = response.task_id;
      if (!newTaskId) {
        throw new Error("Invalid response from server: missing task_id");
      }

      setTaskId(newTaskId);
      setTaskStatus(response.status || "pending");
      setProgress(response.progress || 0);

      // Show success toast for task creation
      toast({
        title: "Task Created",
        description: "FAQ generation started",
      });

      // Start polling for status
      pollTaskStatus(newTaskId).catch((pollError: any) => {
        console.error("Polling error:", pollError);
      });
    } catch (err: any) {
      setLoading(false);
      let errorMessage = "Failed to create FAQ task";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      setError(errorMessage);
      
      // Handle specific error cases
      if (errorMessage.includes("422") || errorMessage.includes("Validation")) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid URL or topic",
          variant: "destructive",
        });
      } else if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
        toast({
          title: "Rate Limit Exceeded",
          description: "Too many requests. Please wait a minute before trying again.",
          variant: "destructive",
        });
      } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const handleClear = () => {
    // Clear polling if active
    if (pollIntervalRef.current) {
      clearTimeout(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setInput("");
    setQuestions([]);
    setError(null);
    setTaskStatus("idle");
    setProgress(0);
    setTaskId(null);
    setLoading(false);
    setCopiedIndex(null);
  };

  const handleCopyFAQ = async (question: FAQQuestion, index: number) => {
    if (!question.has_answer || !question.answer) return;
    
    const text = `Q: ${question.question}\n\nA: ${question.answer}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast({
        title: "Copied!",
        description: "FAQ copied to clipboard",
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopyAll = async () => {
    const faqsWithAnswers = questions.filter(q => q.has_answer && q.answer);
    if (faqsWithAnswers.length === 0) return;
    
    const text = faqsWithAnswers
      .map((faq, index) => `${index + 1}. Q: ${faq.question}\n\nA: ${faq.answer}`)
      .join("\n\n---\n\n");
    
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "All FAQs copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const remainingChars = 2048 - input.length;
  const isInputValid = input.trim().length > 0 && input.length <= 2048;
  const faqsWithAnswers = questions.filter(q => q.has_answer && q.answer);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">FAQ Generator</h1>
        <p className="text-muted-foreground">
          Generate high-quality, SEO-optimized FAQs based on a URL or topic
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <LocationSelector
              value={locationCode}
              onChange={setLocationCode}
              label="Target Location"
              showSearch={true}
              disabled={loading}
            />
            <div className="space-y-2">
              <Label htmlFor="faq-input">URL or Topic</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    id="faq-input"
                    type="text"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter a URL (e.g., https://example.com) or topic (e.g., digital marketing)"
                    maxLength={2048}
                    disabled={loading}
                    className="pr-20"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && isInputValid && !loading) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                  />
                  {input && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      onClick={handleClear}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={loading || !isInputValid}
                  data-testid="button-generate"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {loading ? "Generating..." : "Generate FAQs"}
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {input.length > 0 && (
                    <span className={remainingChars < 0 ? "text-destructive" : ""}>
                      {remainingChars} characters remaining
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            {loading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {loading && questions.length === 0 && (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Questions ({questions.length})
                {faqsWithAnswers.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    {faqsWithAnswers.length} with answers
                  </span>
                )}
              </CardTitle>
              {faqsWithAnswers.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAll}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {questions.map((questionItem, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-3 flex-1 pr-4">
                      <span className="text-sm font-medium text-muted-foreground min-w-[2rem]">
                        {index + 1}.
                      </span>
                      <span className="font-medium flex-1">{questionItem.question}</span>
                      <span className="text-xs text-muted-foreground">
                        {questionItem.has_answer ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pl-11">
                      {questionItem.has_answer && questionItem.answer ? (
                        <>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {questionItem.answer}
                            </p>
                          </div>

                          {/* Keyword Focused Section */}
                          {questionItem.keywords && questionItem.keywords.length > 0 && (
                            <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 text-white">
                              <h4 className="text-sm font-semibold uppercase tracking-wide mb-3 opacity-90">
                                Keyword Focused
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {questionItem.keywords.map((keyword, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block px-3 py-1.5 text-xs font-medium bg-white/20 backdrop-blur-sm rounded-full border border-white/30 hover:bg-white/30 hover:-translate-y-0.5 transition-all duration-200"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyFAQ(questionItem, index)}
                            className="gap-2"
                          >
                            {copiedIndex === index ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <div className="py-5 text-center text-muted-foreground italic">
                          <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                          Preparing answers while targeting keywords...
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {!loading && questions.length === 0 && !error && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-2">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Enter a URL or topic above to generate FAQs
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
