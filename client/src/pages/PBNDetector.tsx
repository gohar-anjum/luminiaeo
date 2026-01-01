import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api/client";
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/DataTablePagination";

export default function PBNDetector() {
  const { toast } = useToast();
  const [domain, setDomain] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string | null>(null);

  const [pbnData, setPbnData] = useState<any[]>([]);
  const [pbnSummary, setPbnSummary] = useState<any>(null);
  const [backlinksSummary, setBacklinksSummary] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxPollingTime = 10 * 60 * 1000; // 10 minutes
  const pollingStartTimeRef = useRef<number | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const fetchAndSetResults = useCallback(async (taskId: string) => {
    try {
      const results = await apiClient.getBacklinkResults({ task_id: taskId });
      console.log("Backlink results response:", results);
      
      // The API client's post() method returns data.response, so results is the inner response object
      // Structure: { task_id, status, results: { summary, backlinks: { items: [...] }, pbn_detection: {...} } }
      const overallStatus = (results as any).status;
      const responseData = (results as any).results || results;
      const pbnDetection = responseData?.pbn_detection as any;
      const backlinksData = responseData?.backlinks?.items || [];
      
      console.log("Overall status:", overallStatus);
      console.log("Response data:", responseData);
      console.log("PBN detection:", pbnDetection);
      console.log("Backlinks items count:", backlinksData.length);
      
      // Only process if overall status is completed
      if (overallStatus === "completed") {
        // Check if PBN detection has items (pbn_detection doesn't have a status field, just items and summary)
        if (pbnDetection && pbnDetection.items && Array.isArray(pbnDetection.items) && pbnDetection.items.length > 0) {
          const pbnMappedItems = pbnDetection.items.map((item: any, index: number) => ({
            id: `pbn-${index}`,
            referringDomain: item.source_url || item.domain_from || "",
            ip: item.signals?.ip || item.domain_from_ip || "",
            da: item.signals?.domain_rank || item.domain_rank || 0,
            spam: item.signals?.backlink_spam_score || item.backlink_spam_score || 0,
            risk: item.risk_level || "low",
            pbnProbability: item.pbn_probability || 0,
            domainRank: item.signals?.domain_rank || item.domain_rank || 0,
            registrar: item.signals?.whois_registrar || item.whois_registrar || null,
            domainAge: item.signals?.domain_age_days || item.domain_age_days || null,
            reasons: item.reasons || [],
            safeBrowsingStatus: item.signals?.safe_browsing_status || item.safe_browsing_status || null,
          }));
          
          const riskPriority: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
          const sortedItems = pbnMappedItems.sort((a: any, b: any) => {
            const riskDiff = riskPriority[b.risk] - riskPriority[a.risk];
            if (riskDiff !== 0) return riskDiff;
            return b.pbnProbability - a.pbnProbability;
          });
          
          setPbnData(sortedItems);
          setPbnSummary(pbnDetection.summary || null);
          setBacklinksSummary(responseData.summary || null);
          setShowResults(true);
          setIsAnalyzing(false);
          toast({
            title: "Analysis Complete",
            description: `PBN detection completed successfully. Found ${pbnDetection.items.length} PBN backlinks.`,
          });
        } else if (backlinksData.length > 0) {
          // PBN detection failed or not available, but backlinks are available
          // Map backlinks to display format (without PBN analysis)
          const mappedItems = backlinksData.map((backlink: any, index: number) => ({
            id: `pbn-${index}`,
            referringDomain: backlink.domain_from || backlink.url_from || "",
            ip: backlink.domain_from_ip || "",
            da: backlink.domain_from_rank || 0,
            spam: backlink.backlink_spam_score || 0,
            risk: "low", // Default since PBN detection failed/unavailable
            pbnProbability: 0, // No PBN analysis available
            domainRank: backlink.domain_from_rank || 0,
          }));
          
          setPbnData(mappedItems);
          setPbnSummary(null);
          setBacklinksSummary(responseData.summary || null);
          setShowResults(true);
          setIsAnalyzing(false);
          
          toast({
            title: "Analysis Complete",
            description: `Backlinks retrieved successfully (${backlinksData.length} backlinks). PBN detection data not available.`,
            variant: "default",
          });
        } else {
          // Status completed but PBN detection structure is unexpected
          console.warn("Status completed but PBN detection structure unexpected:", responseData);
          setIsAnalyzing(false);
          toast({
            title: "Warning",
            description: "Analysis completed but PBN detection data is unavailable.",
            variant: "default",
          });
        }
      } else {
        console.warn("Status not completed:", overallStatus);
        setIsAnalyzing(false);
        toast({
          title: "Warning",
          description: "Analysis is still processing. Please wait...",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Error fetching results:", error);
      setIsAnalyzing(false);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch results",
        variant: "destructive",
      });
    }
  }, [toast]);

  const startPolling = useCallback((taskId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingStartTimeRef.current = Date.now();
    
    const poll = async () => {
      if (pollingStartTimeRef.current && Date.now() - pollingStartTimeRef.current > maxPollingTime) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsAnalyzing(false);
        toast({
          title: "Timeout",
          description: "Analysis took too long. Please try again.",
          variant: "destructive",
        });
        return;
      }

      try {
        const status = await apiClient.getBacklinkStatus({ task_id: taskId });
        setTaskStatus(status.status);

        if (status.status === "completed") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          await fetchAndSetResults(taskId);
        } else if (status.status === "failed") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsAnalyzing(false);
          toast({
            title: "Analysis Failed",
            description: status.error_message || "Task failed",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsAnalyzing(false);
        toast({
          title: "Error",
          description: error.message || "Failed to check status",
          variant: "destructive",
        });
      }
    };

    poll();
    pollingIntervalRef.current = setInterval(poll, 5000);
  }, [toast, maxPollingTime, fetchAndSetResults]);

  const handleAnalyze = async () => {
    if (!domain) {
      toast({
        title: "Error",
        description: "Please enter a domain to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setShowResults(false);
    setPbnData([]);
    setPbnSummary(null);
    setBacklinksSummary(null);
    setTaskId(null);
    setTaskStatus(null);

    try {
      const response = await apiClient.submitBacklinkAnalysis({ domain });
      const taskId = response.task_id;
      setTaskId(taskId);
      setTaskStatus(response.status);
      
      // If already completed, fetch results directly
      if (response.status === "completed") {
        await fetchAndSetResults(taskId);
      } else {
        // Start polling for status updates
        startPolling(taskId);
        toast({
          title: "Analysis Started",
          description: "Backlink analysis has been queued. This may take a few minutes.",
        });
      }
    } catch (error: any) {
      setIsAnalyzing(false);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze domain",
        variant: "destructive",
      });
    }
  };

  const handleExportDisavow = async () => {
    if (!domain) {
      toast({
        title: "Error",
        description: "Please analyze a domain first",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      toast({
        title: "Exporting...",
        description: "Generating disavow.txt file...",
      });

      const response = await apiClient.getHarmfulBacklinks({
        domain,
        risk_levels: ["high", "critical"],
      });

      const responseData = (response as any).response || response;
      if (responseData && responseData.backlinks) {
        const backlinks = responseData.backlinks;
        
        if (backlinks.length === 0) {
          toast({
            title: "No harmful backlinks",
            description: "No high or critical risk backlinks found to disavow",
            variant: "default",
          });
          return;
        }

        const domains = new Set<string>();
        backlinks.forEach((backlink: any) => {
          if (backlink.source_domain) {
            domains.add(backlink.source_domain);
          } else if (backlink.source_url) {
            try {
              const url = new URL(backlink.source_url);
              domains.add(url.hostname.replace(/^www\./, ""));
            } catch {
              if (backlink.source_url) {
                domains.add(backlink.source_url);
              }
            }
          }
        });

        const disavowContent = Array.from(domains)
          .sort()
          .map((domain) => `Domain: ${domain}`)
          .join("\n");

        const blob = new Blob([disavowContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "disavow.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: `Disavow file downloaded with ${domains.size} domains`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate disavow file",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export disavow file",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const highRiskCount = pbnSummary?.high_risk_count ?? (pbnData?.filter((d: any) => d.risk === "high").length || 0);
  const mediumRiskCount = pbnSummary?.medium_risk_count ?? (pbnData?.filter((d: any) => d.risk === "medium").length || 0);
  const lowRiskCount = pbnSummary?.low_risk_count ?? (pbnData?.filter((d: any) => d.risk === "low").length || 0);
  const totalBacklinks = backlinksSummary?.backlinks ?? pbnData.length;

  const {
    currentPage,
    totalPages,
    paginatedData: paginatedPbnData,
    goToPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems: totalPbnItems,
  } = usePagination(pbnData, { itemsPerPage: 20 });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-success text-success-foreground";
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">PBN Detector</h1>
        <p className="text-muted-foreground">
          Identify potentially harmful private blog networks in your backlink profile
        </p>
      </div>

      <Card data-testid="card-analyze">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <div className="flex gap-2">
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  data-testid="input-domain"
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

      {(isAnalyzing || (taskStatus && taskStatus !== "completed")) && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {taskStatus === "processing" && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <span className="font-medium">
                  Status: {taskStatus ? taskStatus.charAt(0).toUpperCase() + taskStatus.slice(1) : "Initializing..."}
                </span>
              </div>
              {taskStatus === "processing" && (
                <Progress value={undefined} className="h-2" />
              )}
              <p className="text-sm text-muted-foreground">
                {taskStatus === "processing" 
                  ? "PBN detection is in progress. This may take a few minutes..."
                  : "Please wait while we analyze your backlinks..."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {showResults && pbnData && pbnData.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="card-total">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Backlinks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalBacklinks.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Referring domains analyzed</p>
              </CardContent>
            </Card>

            <Card data-testid="card-high-risk">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High-Risk Domains</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{highRiskCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Require immediate action</p>
              </CardContent>
            </Card>

            <Card data-testid="card-disavow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disavow Candidates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{highRiskCount + mediumRiskCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Recommended for disavow</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleExportDisavow} 
              disabled={isExporting}
              data-testid="button-export-disavow"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export disavow.txt"}
            </Button>
          </div>

          <Card data-testid="card-table">
            <CardHeader>
              <CardTitle>Backlink Analysis</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referring Domain</TableHead>
                      <TableHead>Registrar</TableHead>
                      <TableHead>Domain Age</TableHead>
                      <TableHead>Domain Rank</TableHead>
                      <TableHead>Spam Score</TableHead>
                      <TableHead>PBN Probability</TableHead>
                      <TableHead>PBN Reasons</TableHead>
                      <TableHead>Safe Browsing</TableHead>
                      <TableHead>Risk Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPbnData.map((item: any) => {
                      // Format domain age
                      const formatDomainAge = (days: number | null) => {
                        if (!days) return "N/A";
                        if (days < 365) return `${days} days`;
                        const years = Math.floor(days / 365);
                        const remainingDays = days % 365;
                        if (remainingDays === 0) return `${years} year${years > 1 ? 's' : ''}`;
                        return `${years} year${years > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
                      };

                      // Format reason labels
                      const formatReason = (reason: string) => {
                        return reason
                          .split('_')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                      };

                      return (
                        <TableRow key={item.id} data-testid={`row-pbn-${item.id}`}>
                          <TableCell className="font-medium">
                            <a 
                              href={item.referringDomain.startsWith('http') ? item.referringDomain : `https://${item.referringDomain}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {item.referringDomain.replace(/^https?:\/\//, '')}
                            </a>
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.registrar ? (
                              <span className="text-muted-foreground">{item.registrar}</span>
                            ) : (
                              <span className="text-muted-foreground italic">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDomainAge(item.domainAge)}
                          </TableCell>
                          <TableCell>{item.da || item.domainRank || "N/A"}</TableCell>
                          <TableCell>{item.spam || 0}</TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {(item.pbnProbability * 100).toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            {item.reasons && item.reasons.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item.reasons.slice(0, 2).map((reason: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {formatReason(reason)}
                                  </Badge>
                                ))}
                                {item.reasons.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{item.reasons.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.safeBrowsingStatus ? (
                              <Badge 
                                variant={item.safeBrowsingStatus === "flagged" ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {item.safeBrowsingStatus === "flagged" ? "Flagged" : "Clean"}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getRiskBadgeClass(item.risk)}
                              data-testid={`badge-risk-${item.id}`}
                            >
                              {item.risk.toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalPbnItems}
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
