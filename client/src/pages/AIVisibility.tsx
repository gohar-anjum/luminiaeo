import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useQuery } from "@tanstack/react-query";
import { Search, CheckCircle2, XCircle } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { registerMockData } from "@/lib/queryClient";
import visibilityData from "@/data/visibility.json";
import { useEffect } from "react";

export default function AIVisibility() {
  const { toast } = useToast();
  const [domain, setDomain] = useState("");
  const [selectedModels, setSelectedModels] = useState(["chatgpt", "gemini", "perplexity"]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Register mock data for this endpoint
  useEffect(() => {
    registerMockData("/api/visibility", async () => visibilityData);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/visibility"],
    enabled: showResults,
  });

  const toggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  const handleAnalyze = async () => {
    if (!domain) {
      toast({
        title: "Error",
        description: "Please enter a domain to analyze",
        variant: "destructive",
      });
      return;
    }

    if (selectedModels.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one AI model",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsAnalyzing(false);
    setShowResults(true);
  };

  const citedQueries = data?.filter((q: any) => q.cited).length || 0;
  const totalQueries = data?.length || 0;
  const citationRate = totalQueries > 0 ? Math.round((citedQueries / totalQueries) * 100) : 0;

  const citationShareData = [
    { name: "ChatGPT", value: 45 },
    { name: "Gemini", value: 32 },
    { name: "Perplexity", value: 23 },
  ];

  const competitorData = [
    { name: "Your Domain", citations: 12 },
    { name: "semrush.com", citations: 18 },
    { name: "moz.com", citations: 15 },
    { name: "ahrefs.com", citations: 14 },
  ];

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Indexability & Citations</h1>
        <p className="text-muted-foreground">
          Track your visibility across AI search platforms
        </p>
      </div>

      <Card data-testid="card-analyze">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                data-testid="input-domain"
              />
            </div>

            <div className="space-y-2">
              <Label>AI Models</Label>
              <div className="flex flex-wrap gap-4">
                {[
                  { id: "chatgpt", label: "ChatGPT" },
                  { id: "gemini", label: "Google Gemini" },
                  { id: "perplexity", label: "Perplexity AI" },
                ].map((model) => (
                  <div key={model.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={model.id}
                      checked={selectedModels.includes(model.id)}
                      onCheckedChange={() => toggleModel(model.id)}
                      data-testid={`checkbox-${model.id}`}
                    />
                    <Label htmlFor={model.id} className="font-normal cursor-pointer">
                      {model.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full"
              data-testid="button-analyze"
            >
              <Search className="w-4 h-4 mr-2" />
              {isAnalyzing ? "Analyzing..." : "Analyze Visibility"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isAnalyzing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {showResults && !isLoading && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="card-queries">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Queries Checked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalQueries}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {selectedModels.length} AI models
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-cited">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Citations Found</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{citedQueries}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {citationRate}% citation rate
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-competitors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Competitors Found</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12</div>
                <p className="text-xs text-muted-foreground mt-1">
                  In your niche
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-citation-share">
              <CardHeader>
                <CardTitle>Citation Share by Model</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={citationShareData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {citationShareData.map((_, index) => (
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

            <Card data-testid="card-competitor-comparison">
              <CardHeader>
                <CardTitle>Competitor Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={competitorData}>
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="citations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-queries-table">
            <CardHeader>
              <CardTitle>Query Analysis</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead>Cited?</TableHead>
                      <TableHead>Cited By</TableHead>
                      <TableHead>Top Competitors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((query: any, index: number) => (
                      <TableRow key={index} data-testid={`row-query-${index}`}>
                        <TableCell className="font-medium">{query.query}</TableCell>
                        <TableCell>
                          {query.cited ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {query.citedBy.length > 0
                              ? query.citedBy.map((model: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {model}
                                  </Badge>
                                ))
                              : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {query.topCompetitors.slice(0, 2).join(", ")}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
