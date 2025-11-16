import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { formatNumber, formatCurrency } from "@/utils/formatters";
import { Search, Download, Plus, FileText, ArrowUpDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { registerMockData } from "@/lib/queryClient";
import keywordsData from "@/data/keywords.json";
import { useEffect } from "react";

type Keyword = {
  id: string;
  keyword: string;
  volume: number;
  cpc: number;
  competition: string;
  intent: string;
};

export default function KeywordResearch() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [locale, setLocale] = useState("us");
  const [language, setLanguage] = useState("en");
  const [intentFilter, setIntentFilter] = useState("all");
  const [sortKey, setSortKey] = useState<keyof Keyword | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Register mock data for this endpoint
  useEffect(() => {
    registerMockData("/api/keywords", async () => keywordsData);
  }, []);

  const { data, isLoading } = useQuery<Keyword[]>({
    queryKey: ["/api/keywords"],
  });

  const handleSort = (key: keyof Keyword) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  let filteredData = data || [];

  if (searchTerm) {
    filteredData = filteredData.filter((kw: any) =>
      kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (intentFilter !== "all") {
    filteredData = filteredData.filter((kw: any) =>
      kw.intent.toLowerCase() === intentFilter.toLowerCase()
    );
  }

  if (sortKey) {
    filteredData = [...filteredData].sort((a: any, b: any) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }

  const topKeywords = [...(data || [])]
    .sort((a: any, b: any) => b.volume - a.volume)
    .slice(0, 10);

  const chartData = topKeywords.map((kw: any) => ({
    name: kw.keyword.length > 20 ? kw.keyword.substring(0, 20) + "..." : kw.keyword,
    volume: kw.volume,
  }));

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your keyword data is being exported to CSV...",
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Keyword Research</h1>
        <p className="text-muted-foreground">
          Discover high-impact keywords optimized for AI search engines
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search keywords..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-keyword"
            />
          </div>
        </div>

        <Select value={locale} onValueChange={setLocale}>
          <SelectTrigger data-testid="select-locale">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="ca">Canada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={intentFilter} onValueChange={setIntentFilter}>
          <SelectTrigger data-testid="select-intent">
            <SelectValue placeholder="Filter by intent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Intents</SelectItem>
            <SelectItem value="informational">Informational</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="transactional">Transactional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleExport} variant="outline" data-testid="button-export">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
        <Button variant="outline" data-testid="button-add-cluster">
          <Plus className="w-4 h-4 mr-2" />
          Add to Cluster
        </Button>
        <Button variant="outline" data-testid="button-generate-faq">
          <FileText className="w-4 h-4 mr-2" />
          Generate FAQs
        </Button>
      </div>

      <Card data-testid="card-volume-chart">
        <CardHeader>
          <CardTitle>Top 10 Keywords by Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-keywords-table">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover-elevate"
                    onClick={() => handleSort("keyword")}
                  >
                    <div className="flex items-center gap-1">
                      Keyword
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover-elevate"
                    onClick={() => handleSort("volume")}
                  >
                    <div className="flex items-center gap-1">
                      Volume
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover-elevate"
                    onClick={() => handleSort("cpc")}
                  >
                    <div className="flex items-center gap-1">
                      CPC
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover-elevate"
                    onClick={() => handleSort("competition")}
                  >
                    <div className="flex items-center gap-1">
                      Competition
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover-elevate"
                    onClick={() => handleSort("intent")}
                  >
                    <div className="flex items-center gap-1">
                      Intent
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No keywords found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((keyword: any) => (
                    <TableRow key={keyword.id} data-testid={`row-keyword-${keyword.id}`}>
                      <TableCell className="font-medium">{keyword.keyword}</TableCell>
                      <TableCell>{formatNumber(keyword.volume)}</TableCell>
                      <TableCell>{formatCurrency(keyword.cpc)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            keyword.competition === "High"
                              ? "destructive"
                              : keyword.competition === "Medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {keyword.competition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{keyword.intent}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
