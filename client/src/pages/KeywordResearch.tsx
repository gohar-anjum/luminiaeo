import { useState, useCallback, useRef, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { formatNumber, formatCurrency } from "@/utils/formatters";
import { Search, Download, Plus, FileText, ArrowUpDown, Loader2, Database } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { registerMockData } from "@/lib/queryClient";
import keywordsData from "@/data/keywords.json";
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import { apiClient } from "@/lib/api/client";
import type { KeywordResearchRequest, KeywordResearchStatus, KeywordResearchResults } from "@/lib/api/types";
import { LocationSelector } from "@/components/LocationSelector";
import { useLocation } from "wouter";

type Keyword = {
  id: string;
  keyword: string;
  volume: number;
  cpc: number;
  competition: string;
  intent: string;
  source?: string; // Add source field to show provider
};

export default function KeywordResearch() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [locationCode, setLocationCode] = useState<number>(2840); // Default to US
  const [language, setLanguage] = useState("en");
  const [sortKey, setSortKey] = useState<keyof Keyword | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Job Status State
  const [isCreating, setIsCreating] = useState(false);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [jobStatus, setJobStatus] = useState<KeywordResearchStatus | null>(null);
  const [jobResults, setJobResults] = useState<KeywordResearchResults | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Selection State
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());

  // Register mock data for this endpoint (fallback)
  useEffect(() => {
    registerMockData("/api/keywords", async () => keywordsData);
  }, []);

  // Use job results if available, otherwise use mock data
  const keywordsFromResults = jobResults?.keywords?.map((kw) => ({
    id: String(kw.keyword),
    keyword: kw.keyword,
    volume: kw.search_volume,
    cpc: kw.cpc,
    competition: typeof kw.competition === 'string' ? kw.competition : (kw.competition > 0.7 ? 'High' : kw.competition > 0.4 ? 'Medium' : 'Low'),
    intent: kw.intent || 'unknown',
    source: kw.source,
  })) || [];

  const { data: mockData, isLoading: isLoadingMock } = useQuery<Keyword[]>({
    queryKey: ["/api/keywords"],
    enabled: !jobResults, // Only fetch mock data if no job results
  });

  const data = jobResults ? keywordsFromResults : mockData;
  const isLoading = jobResults ? false : isLoadingMock;

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

  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
  } = usePagination(filteredData, { itemsPerPage: 20 });

  const topKeywords = [...(data || [])]
    .sort((a: any, b: any) => b.volume - a.volume)
    .slice(0, 10);

  const chartData = topKeywords.map((kw: any) => ({
    name: kw.keyword.length > 20 ? kw.keyword.substring(0, 20) + "..." : kw.keyword,
    volume: kw.volume,
  }));

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: number) => {
    try {
      const status = await apiClient.getKeywordResearchStatus(jobId);
      setJobStatus(status);

      if (status.status === "completed") {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        // Fetch results
        const results = await apiClient.getKeywordResearchResults(jobId);
        setJobResults(results);
        setIsCreating(false);
        
        toast({
          title: "Research Complete",
          description: `Found ${results.keywords?.length || 0} keywords`,
        });
      } else if (status.status === "failed") {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsCreating(false);
        toast({
          title: "Research Failed",
          description: "Keyword research job failed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error polling job status:", error);
    }
  }, [toast]);

  // Start polling when job is created
  useEffect(() => {
    if (activeJobId && !pollingIntervalRef.current) {
      // Poll immediately, then every 5 seconds
      pollJobStatus(activeJobId);
      pollingIntervalRef.current = setInterval(() => {
        pollJobStatus(activeJobId);
      }, 5000);
    }
  }, [activeJobId, pollJobStatus]);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    setJobResults(null);
    setJobStatus(null);
    setSelectedKeywords(new Set()); // Reset selections when starting new search

    try {
      const request: KeywordResearchRequest = {
        query: query.trim(),
        max_keywords: 100,
        geo_target_id: locationCode,
      };

      const job = await apiClient.createKeywordResearch(request);
      setActiveJobId(job.id);
      setJobStatus({
        id: job.id,
        status: job.status,
        progress: 0,
        created_at: new Date().toISOString(),
      });

      toast({
        title: "Research Started",
        description: "Keyword research job created. Polling for results...",
      });
    } catch (error: any) {
      setIsCreating(false);
      toast({
        title: "Error",
        description: error.message || "Failed to create keyword research job",
        variant: "destructive",
      });
    }
  };

  const handleToggleSelect = (keywordId: string) => {
    setSelectedKeywords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keywordId)) {
        newSet.delete(keywordId);
      } else {
        newSet.add(keywordId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      // Select all items on current page
      const currentPageIds = new Set(paginatedData.map((kw: any) => kw.id));
      setSelectedKeywords((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    } else {
      // Deselect all items on current page
      const currentPageIds = new Set(paginatedData.map((kw: any) => kw.id));
      setSelectedKeywords((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }
  };

  const handleExport = () => {
    if (selectedKeywords.size === 0) {
      toast({
        title: "No keywords selected",
        description: "Please select keywords to export",
        variant: "destructive",
      });
      return;
    }

    const keywordsToExport = filteredData.filter((kw: any) => selectedKeywords.has(kw.id));

    if (keywordsToExport.length === 0) {
      toast({
        title: "No keywords to export",
        description: "Selected keywords are not available in the current view",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = ["Keyword", "Volume", "CPC", "Competition"];
    const rows = keywordsToExport.map((kw: any) => [
      kw.keyword,
      kw.volume,
      kw.cpc ?? 0,
      kw.competition,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `keywords-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `Exported ${keywordsToExport.length} keyword${keywordsToExport.length > 1 ? "s" : ""} to CSV`,
    });
  };

  const handleGenerateFAQ = () => {
    if (!data || data.length === 0) {
      toast({
        title: "Error",
        description: "No keywords available to generate FAQs",
        variant: "destructive",
      });
      return;
    }

    // Use selected location code, or default to 2840 if none selected
    const selectedLocationCode = locationCode || 2840;

    // Navigate to FAQ page with location code and URL as query parameters
    const params = new URLSearchParams({
      location_code: selectedLocationCode.toString(),
      url: query.trim() || "",
    });
    setLocation(`/faq?${params.toString()}`);
  };

  // Get provider badge info from source
  const getProviderBadge = (source?: string) => {
    if (!source) return null;
    
    if (source.includes('dataforseo')) {
      return <Badge variant="secondary" className="text-xs">DataForSEO</Badge>;
    } else if (source.includes('google')) {
      return <Badge variant="outline" className="text-xs">Google</Badge>;
    } else if (source.includes('scraper')) {
      return <Badge variant="outline" className="text-xs">Scraper</Badge>;
    } else if (source.includes('answerthepublic')) {
      return <Badge variant="outline" className="text-xs">AnswerThePublic</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{source}</Badge>;
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

      {/* Query Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter keyword or topic to research..."
                className="pl-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreating) {
                    handleSearch();
                  }
                }}
                disabled={isCreating}
                data-testid="input-query"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isCreating || !query.trim()}
              data-testid="button-search"
              className="sm:w-auto w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="relative">
          <Input
            placeholder="Search keywords..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-keyword"
          />
        </div>

        <LocationSelector
          value={locationCode}
          onChange={setLocationCode}
          label=""
          showSearch={true}
          disabled={isCreating}
        />
      </div>

      {data && data.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleExport} 
            variant="outline" 
            data-testid="button-export"
            disabled={selectedKeywords.size === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV {selectedKeywords.size > 0 ? `(${selectedKeywords.size})` : ""}
          </Button>
        {/* <Button variant="outline" data-testid="button-add-cluster">
          <Plus className="w-4 h-4 mr-2" />
          Add to Cluster
        </Button> */}
          <Button 
            onClick={handleGenerateFAQ} 
            variant="outline" 
            data-testid="button-generate-faq"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate FAQs
          </Button>
        </div>
      )}

      {/* Job Status Card - Only show when creating or processing */}
      {(isCreating || (jobStatus && jobStatus.status === "processing")) && (
        <Card>
          <CardHeader>
            <CardTitle>Research Status</CardTitle>
          </CardHeader>
          <CardContent>
            {jobStatus && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {jobStatus.status === "processing" && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    <span className="font-medium">
                      Status: {jobStatus.status.charAt(0).toUpperCase() + jobStatus.status.slice(1)}
                    </span>
                  </div>
                  {jobStatus.progress !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      {jobStatus.progress}%
                    </span>
                  )}
                </div>
                {jobStatus.progress !== undefined && (
                  <Progress value={jobStatus.progress} className="h-2" />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {data && data.length > 0 && (
        <>
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
            <CardHeader>
              <CardTitle>Keywords</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        paginatedData.length > 0 && 
                        paginatedData.every((kw: any) => selectedKeywords.has(kw.id))
                          ? true
                          : paginatedData.some((kw: any) => selectedKeywords.has(kw.id))
                          ? "indeterminate"
                          : false
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {jobStatus?.status === "processing" ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Research in progress...</span>
                        </div>
                      ) : (
                        "No keywords found"
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((keyword: any) => (
                    <TableRow key={keyword.id} data-testid={`row-keyword-${keyword.id}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedKeywords.has(keyword.id)}
                          onCheckedChange={() => handleToggleSelect(keyword.id)}
                          aria-label={`Select ${keyword.keyword}`}
                        />
                      </TableCell>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={goToPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
