import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { Copy, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { registerMockData } from "@/lib/queryClient";
import faqsData from "@/data/faqs.json";
import { useEffect } from "react";

export default function FAQGenerator() {
  const { toast } = useToast();
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    registerMockData("/api/faqs", async () => faqsData);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/faqs"],
  });

  const toggleQuestion = (id: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]
    );
    if (!answers[id] && data) {
      const faq = data.find((f: any) => f.id === id);
      if (faq) {
        setAnswers((prev) => ({ ...prev, [id]: faq.answer }));
      }
    }
  };

  const handleCopyAll = () => {
    const text = selectedQuestions
      .map((id) => {
        const faq = data?.find((f: any) => f.id === id);
        return `Q: ${faq?.question}\nA: ${answers[id] || faq?.answer}\n`;
      })
      .join("\n");

    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "FAQ content copied to clipboard",
    });
  };

  const handleDownload = () => {
    toast({
      title: "Download started",
      description: "Downloading FAQ data as JSON...",
    });
  };

  const handleRegenerate = (id: string) => {
    toast({
      title: "Regenerating...",
      description: "Creating new answer for this question",
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">FAQ / Facts Generator</h1>
        <p className="text-muted-foreground">
          Generate and customize answers to common questions
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleCopyAll}
          disabled={selectedQuestions.length === 0}
          data-testid="button-copy-all"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy All
        </Button>
        <Button
          onClick={handleDownload}
          variant="outline"
          disabled={selectedQuestions.length === 0}
          data-testid="button-download"
        >
          <Download className="w-4 h-4 mr-2" />
          Download JSON
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-questions">
          <CardHeader>
            <CardTitle>Selected Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.map((faq: any) => (
                <div
                  key={faq.id}
                  className="flex items-start gap-3 p-4 border rounded-md hover-elevate transition-all"
                  data-testid={`faq-${faq.id}`}
                >
                  <Checkbox
                    checked={selectedQuestions.includes(faq.id)}
                    onCheckedChange={() => toggleQuestion(faq.id)}
                    data-testid={`checkbox-${faq.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm">{faq.question}</div>
                      <Badge
                        variant={faq.status === "ready" ? "default" : "secondary"}
                        data-testid={`status-${faq.id}`}
                      >
                        {faq.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-answers">
          <CardHeader>
            <CardTitle>Generated Answers</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedQuestions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Select questions from the left to view and edit answers
              </div>
            ) : (
              <div className="space-y-6">
                {selectedQuestions.map((id) => {
                  const faq = data?.find((f: any) => f.id === id);
                  return (
                    <div key={id} className="space-y-3" data-testid={`answer-${id}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm">{faq?.question}</div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRegenerate(id)}
                          data-testid={`button-regenerate-${id}`}
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      </div>
                      <Textarea
                        value={answers[id] || faq?.answer}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [id]: e.target.value }))
                        }
                        rows={4}
                        className="resize-none"
                        data-testid={`textarea-${id}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
