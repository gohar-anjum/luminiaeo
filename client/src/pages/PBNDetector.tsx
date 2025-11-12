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
import { useQuery } from "@tanstack/react-query";
import { mockFetch } from "@/utils/mockFetch";
import pbnData from "@/data/pbn.json";
import { Search, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PBNDetector() {
  const { toast } = useToast();
  const [domain, setDomain] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/pbn"],
    queryFn: () => mockFetch(pbnData),
    enabled: showResults,
  });

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
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsAnalyzing(false);
    setShowResults(true);
  };

  const handleExportDisavow = () => {
    toast({
      title: "Export started",
      description: "Downloading disavow.txt file...",
    });
  };

  const highRiskCount = data?.filter((d: any) => d.risk === "high").length || 0;
  const mediumRiskCount = data?.filter((d: any) => d.risk === "medium").length || 0;

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

      {showResults && !isLoading && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="card-total">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Backlinks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.length}</div>
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
            <Button onClick={handleExportDisavow} data-testid="button-export-disavow">
              <Download className="w-4 h-4 mr-2" />
              Export disavow.txt
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
                      <TableHead>DA</TableHead>
                      <TableHead>Spam Score</TableHead>
                      <TableHead>Risk Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item: any) => (
                      <TableRow key={item.id} data-testid={`row-pbn-${item.id}`}>
                        <TableCell className="font-medium">{item.referringDomain}</TableCell>
                        <TableCell className="font-mono text-sm">{item.ip}</TableCell>
                        <TableCell>{item.da}</TableCell>
                        <TableCell>{item.spam}%</TableCell>
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
