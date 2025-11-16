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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/apiConfig";

export default function PBNDetector() {
  const { toast } = useToast();
  const [domain, setDomain] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [pbnData, setPbnData] = useState<any[]>([]);
  const [pbnSummary, setPbnSummary] = useState<any>(null);
  const [backlinksSummary, setBacklinksSummary] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

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
    try {
      const res = await apiRequest("POST", getApiUrl("/api/seo/backlinks/submit"), { domain });
      const response = await res.json();
      
      if (response.response && response.response.pbn_detection) {
        const pbnDetection = response.response.pbn_detection;
        
        const mappedItems = (pbnDetection.items || []).map((item: any, index: number) => ({
          id: `pbn-${index}`,
          referringDomain: item.source_url || "",
          ip: item.signals?.ip || "",
          da: item.signals?.domain_rank || 0,
          spam: item.signals?.backlink_spam_score || 0,
          risk: item.risk_level || "low",
          pbnProbability: item.pbn_probability || 0,
          domainRank: item.signals?.domain_rank || 0,
        }));
        
        const riskPriority: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
        const sortedItems = mappedItems.sort((a: any, b: any) => {
          const riskDiff = riskPriority[b.risk] - riskPriority[a.risk];
          if (riskDiff !== 0) return riskDiff;
          return b.pbnProbability - a.pbnProbability;
        });
        
        setPbnData(sortedItems);
        setPbnSummary(pbnDetection.summary || null);
        setBacklinksSummary(response.response.summary || null);
        setShowResults(true);
      } else {
        setPbnData(Array.isArray(response) ? response : []);
        setPbnSummary(null);
        setBacklinksSummary(null);
        setShowResults(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze domain",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
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

      const res = await apiRequest("POST", getApiUrl("/api/seo/backlinks/harmful"), {
        domain,
        risk_levels: ["high", "critical"],
      });

      const response = await res.json();

      if (response.response && response.response.backlinks) {
        const backlinks = response.response.backlinks;
        
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

      {isAnalyzing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
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
                      <TableHead>IP Address</TableHead>
                      <TableHead>Domain Rank</TableHead>
                      <TableHead>Spam Score</TableHead>
                      <TableHead>PBN Probability</TableHead>
                      <TableHead>Risk Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pbnData.map((item: any) => (
                      <TableRow key={item.id} data-testid={`row-pbn-${item.id}`}>
                        <TableCell className="font-medium">
                          <a 
                            href={item.referringDomain} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {item.referringDomain}
                          </a>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.ip || "N/A"}</TableCell>
                        <TableCell>{item.da || item.domainRank || "N/A"}</TableCell>
                        <TableCell>{item.spam || 0}</TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {(item.pbnProbability * 100).toFixed(1)}%
                          </span>
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
