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
  Database,
  Copy,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api/client";
import type { FAQTaskResponse } from "@/lib/api/types";
import { LocationSelector } from "@/components/LocationSelector";

interface FAQ {
  question: string;
  answer: string;
}

export default function FAQGenerator() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [locationCode, setLocationCode] = useState<number>(2840); // Default to US
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<"idle" | "pending" | "processing" | "completed" | "failed">("idle");
  const [progress, setProgress] = useState<{
    serpQuestionsCount?: number;
    alsoAskedSearchId?: string;
  } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  const pollTaskStatus = useCallback(async (
    taskId: string,
    maxAttempts: number = 120,
    pollInterval: number = 5000
  ) => {
    let attempts = 0;
    let isPolling = true;

    const poll = async () => {
      if (!isPolling) return;

      if (attempts >= maxAttempts) {
        isPolling = false;
        if (pollIntervalRef.current) {
          clearTimeout(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setLoading(false);
        setError("Task polling timeout - task took too long to complete");
        toast({
          title: "Timeout",
          description: "FAQ generation took too long. Please try again.",
          variant: "destructive",
        });
        return;
      }

      try {
        const response = await apiClient.getFaqTaskStatus(taskId);
        const taskData = response.data;

        setTaskStatus(taskData.status);

        if (taskData.status === "pending" || taskData.status === "processing") {
          setProgress({
            serpQuestionsCount: taskData.serp_questions_count,
            alsoAskedSearchId: taskData.alsoasked_search_id,
          });
          // Continue polling
          attempts++;
          if (isPolling) {
            pollIntervalRef.current = setTimeout(poll, pollInterval);
          }
        } else if (taskData.status === "completed") {
          isPolling = false;
          if (pollIntervalRef.current) {
            clearTimeout(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setLoading(false);
          if (taskData.faqs) {
            setFaqs(taskData.faqs);
            toast({
              title: "Success",
              description: `Generated ${taskData.faqs.length} FAQs successfully`,
            });
          }
        } else if (taskData.status === "failed") {
          isPolling = false;
          if (pollIntervalRef.current) {
            clearTimeout(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setLoading(false);
          const errorMsg = taskData.error_message || "Task failed";
          setError(errorMsg);
          toast({
            title: "Error",
            description: errorMsg,
            variant: "destructive",
          });
        }
      } catch (err: any) {
        isPolling = false;
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

    // Poll immediately, then continue with recursive setTimeout
    await poll();
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
    setFaqs([]);
    setTaskStatus("idle");
    setProgress(null);
    setTaskId(null);

    try {
      const normalizedInput = normalizeInput(input);
      const response = await apiClient.createFaqTask({
        input: normalizedInput,
        location_code: locationCode,
        options: { temperature: 0.9 },
      });

      // Validate response structure
      if (!response || !response.data || !response.data.task_id) {
        throw new Error("Invalid response from server: missing task_id");
      }

      const newTaskId = response.data.task_id;
      setTaskId(newTaskId);
      setTaskStatus(response.data.status || "pending");

      // Show success toast for task creation
      toast({
        title: "Task Created",
        description: "FAQ generation task started. Polling for status...",
      });

      // Start polling for status (don't await - let it run in background)
      pollTaskStatus(newTaskId).catch((pollError: any) => {
        // Polling errors are handled within pollTaskStatus, but catch here to prevent unhandled promise rejection
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
    setFaqs([]);
    setError(null);
    setTaskStatus("idle");
    setProgress(null);
    setTaskId(null);
    setLoading(false);
    setCopiedIndex(null);
  };

  const handleCopyFAQ = async (faq: FAQ, index: number) => {
    const text = `Q: ${faq.question}\n\nA: ${faq.answer}`;
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
    if (faqs.length === 0) return;
    
    const text = faqs
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

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">FAQ Generator</h1>
        <p className="text-muted-foreground">
          Generate 10 high-quality, SEO-optimized FAQs based on a URL or topic
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
                <span>Processing may take up to 10 minutes</span>
              </div>
            </div>

            {loading && (
              <div className="space-y-3">
                {taskStatus === "pending" && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Waiting for AlsoAsked API to complete...</span>
                    </div>
                    {progress?.alsoAskedSearchId && (
                      <div className="text-xs text-muted-foreground pl-6">
                        Search ID: {progress.alsoAskedSearchId}
                      </div>
                    )}
                    <Progress value={undefined} className="h-2" />
                  </>
                )}
                {taskStatus === "processing" && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>Generating FAQs with Gemini...</span>
                    </div>
                    {progress?.serpQuestionsCount !== undefined && (
                      <div className="text-xs text-muted-foreground pl-6">
                        Processing {progress.serpQuestionsCount} SERP questions
                      </div>
                    )}
                    <Progress value={undefined} className="h-2" />
                  </>
                )}
                {taskStatus === "idle" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating task...</span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {taskId && (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono text-xs">
                  Task: {taskId.substring(0, 16)}...
                </Badge>
                {taskStatus === "pending" && (
                  <Badge variant="secondary" className="gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Waiting for AlsoAsked
                  </Badge>
                )}
                {taskStatus === "processing" && (
                  <Badge variant="default" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    Generating FAQs
                  </Badge>
                )}
                {taskStatus === "completed" && (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {loading && !faqs.length && (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {faqs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated FAQs ({faqs.length})</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAll}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-3 flex-1 pr-4">
                      <span className="text-sm font-medium text-muted-foreground min-w-[2rem]">
                        {index + 1}.
                      </span>
                      <span className="font-medium">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-11">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {faq.answer}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyFAQ(faq, index)}
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {!loading && !faqs.length && !error && (
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
