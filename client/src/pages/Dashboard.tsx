import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { formatNumber, formatRelativeTime } from "@/utils/formatters";
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer } from "recharts";
import { TrendingUp, BarChart3, Eye, Tag } from "lucide-react";
import { Link } from "wouter";
import { registerMockData } from "@/lib/queryClient";
import dashboardData from "@/data/dashboard.json";
import { useEffect } from "react";

export default function Dashboard() {
  // Register mock data for this endpoint
  useEffect(() => {
    registerMockData("/api/dashboard", async () => dashboardData);
  }, []);

  const { data, isLoading } = useQuery<typeof dashboardData>({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const trendData = metrics?.queriesAnalyzed.trend.map((value: number, index: number) => ({
    index,
    value,
  })) || [];

  const citationData = metrics?.aiCitationShare.breakdown.map((item: { name: string; value: number }) => ({
    name: item.name,
    value: item.value,
  })) || [];

  const metaData = metrics?.metaHealth.breakdown.map((item: { name: string; value: number }) => ({
    name: item.name,
    value: item.value,
  })) || [];

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your AI optimization performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Queries Analyzed */}
        <Card data-testid="card-metric-queries">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queries Analyzed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics?.queriesAnalyzed.value || 0)}</div>
            <div className="h-12 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        {/* Avg Semantic Score */}
        <Card data-testid="card-metric-semantic">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Semantic Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgSemanticScore.value}</div>
            <div className="flex items-center justify-center h-12 mt-2">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full" viewBox="0 0 36 36">
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
                    strokeDasharray={`${metrics?.avgSemanticScore.value}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                  {metrics?.avgSemanticScore.value}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-success">+{metrics?.avgSemanticScore.change}%</span> from last month
            </p>
          </CardContent>
        </Card>

        {/* AI Citation Share */}
        <Card data-testid="card-metric-citations">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Citation Share</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.aiCitationShare.value}%</div>
            <div className="h-12 mt-2 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={citationData}
                    dataKey="value"
                    innerRadius={15}
                    outerRadius={24}
                    paddingAngle={2}
                  >
                    {citationData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across major AI platforms
            </p>
          </CardContent>
        </Card>

        {/* Meta Health */}
        <Card data-testid="card-metric-meta">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Health</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.metaHealth.value}%</div>
            <div className="h-12 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metaData}>
                  <Bar dataKey="value" stackId="a" fill="hsl(var(--success))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pages optimized
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2" data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.recentActivity.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                  data-testid={`activity-${activity.id}`}
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm">{activity.type}</div>
                        <div className="text-sm text-muted-foreground">
                          {activity.description}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pinned Reports */}
        <Card data-testid="card-pinned-reports">
          <CardHeader>
            <CardTitle>Pinned Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.pinnedReports.map((report: any) => (
                <Link key={report.id} href="#">
                  <div
                    className="p-3 rounded-md border hover-elevate cursor-pointer transition-all"
                    data-testid={`report-${report.id}`}
                  >
                    <div className="font-medium text-sm">{report.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{report.date}</div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
