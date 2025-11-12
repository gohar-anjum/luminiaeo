import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";

export default function SemanticScore() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a URL to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setResults({
      url,
      score: 78,
      metaTitle: "Best Practices for AI Search Optimization | LUMINI AEO",
      metaDescription: "Learn proven strategies to optimize your content for AI search engines like ChatGPT, Gemini, and Perplexity.",
      entities: ["AI Search", "ChatGPT", "Gemini", "Perplexity", "SEO", "Content Optimization"],
      topics: [
        { name: "AI Optimization", coverage: 85 },
        { name: "Search Engines", coverage: 72 },
        { name: "Content Strategy", coverage: 68 },
        { name: "Technical SEO", coverage: 45 },
      ],
      missingTopics: [
        { name: "Entity-based SEO", suggestion: "Add section about entity relationships and knowledge graphs" },
        { name: "Structured Data", suggestion: "Include schema markup examples and implementation guide" },
        { name: "Citation Strategies", suggestion: "Discuss how to become a citeable source for AI models" },
      ],
    });

    setIsAnalyzing(false);
  };

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Generating semantic score report...",
    });
  };

  const chartData = results?.topics.map((topic: any) => ({
    name: topic.name,
    value: topic.coverage,
  })) || [];

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Semantic Score Checker</h1>
        <p className="text-muted-foreground">
          Analyze and improve your content's semantic relevance
        </p>
      </div>

      <Card data-testid="card-analyze">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL to Analyze</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  placeholder="https://example.com/your-page"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  data-testid="input-url"
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  data-testid="button-analyze"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAnalyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-96 lg:col-span-3" />
        </div>
      )}

      {results && !isAnalyzing && (
        <>
          <div className="flex justify-end">
            <Button onClick={handleExport} variant="outline" data-testid="button-export">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Gauge */}
            <Card data-testid="card-score">
              <CardHeader>
                <CardTitle>Semantic Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeDasharray={`${results.score}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-4xl font-bold" data-testid="text-score">{results.score}</div>
                      <div className="text-xs text-muted-foreground">out of 100</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium">Overall Assessment</div>
                  <Badge variant={results.score >= 70 ? "default" : "secondary"}>
                    {results.score >= 80 ? "Excellent" : results.score >= 70 ? "Good" : "Needs Improvement"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Meta Data */}
            <Card className="lg:col-span-2" data-testid="card-meta">
              <CardHeader>
                <CardTitle>Meta Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-1">Meta Title</div>
                  <div className="text-sm text-muted-foreground">{results.metaTitle}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Meta Description</div>
                  <div className="text-sm text-muted-foreground">{results.metaDescription}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Key Entities</div>
                  <div className="flex flex-wrap gap-2">
                    {results.entities.map((entity: string, index: number) => (
                      <Badge key={index} variant="outline">{entity}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Topic Coverage Chart */}
            <Card data-testid="card-coverage">
              <CardHeader>
                <CardTitle>Topic Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {chartData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Missing Topics */}
            <Card data-testid="card-missing-topics">
              <CardHeader>
                <CardTitle>Missing Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Suggestion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.missingTopics.map((topic: any, index: number) => (
                      <TableRow key={index} data-testid={`row-topic-${index}`}>
                        <TableCell className="font-medium">{topic.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {topic.suggestion}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
