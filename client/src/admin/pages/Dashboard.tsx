import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardBody, StatsGrid, Button, MetricRow, Grid, Notice } from '../components/ui';
import JobVolumeChart from '../components/charts/JobVolumeChart';
import { adminApi } from '@/lib/api/adminClient';
import type { StatCard } from '../types';

function fmt(n: number): string {
  return n.toLocaleString();
}

const Dashboard: React.FC = () => {
  const statsQ = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => adminApi.getDashboardStats(),
  });
  const chartsQ = useQuery({
    queryKey: ['admin', 'dashboard', 'charts'],
    queryFn: () => adminApi.getDashboardCharts(),
  });
  const catalogQ = useQuery({
    queryKey: ['admin', 'activity', 'catalog'],
    queryFn: () => adminApi.getActivityCatalog(),
  });

  const statCards: StatCard[] = useMemo(() => {
    const s = statsQ.data;
    if (!s) return [];
    const hitPct = `${(s.api_cache_hit_rate * 100).toFixed(1)}%`;
    return [
      { label: 'Total users', value: fmt(s.total_users), delta: `+${fmt(s.new_users_today)} today`, deltaDir: 'up', color: 'var(--accent)' },
      { label: 'Total backlinks', value: fmt(s.total_backlinks), delta: `+${fmt(s.new_backlinks_today)} today`, deltaDir: 'up', color: 'var(--green)' },
      { label: 'API calls today', value: fmt(s.api_calls_today), delta: `Cache hit ${hitPct}`, deltaDir: 'neutral', color: 'var(--amber)' },
      { label: 'Credits sold (total)', value: fmt(s.total_credits_sold), delta: `${fmt(s.credits_used_today)} used today`, deltaDir: 'neutral', color: 'var(--accent2)' },
      { label: 'Active subscriptions', value: fmt(s.active_subscriptions), delta: 'Stripe / Cashier', deltaDir: 'neutral', color: 'var(--teal)' },
    ];
  }, [statsQ.data]);

  const creditsByDay = chartsQ.data?.credits_used_by_date ?? {};
  const creditsRows = useMemo(() => {
    const entries = Object.entries(creditsByDay).sort(([a], [b]) => a.localeCompare(b));
    const last = entries.slice(-6);
    const max = Math.max(1, ...last.map(([, v]) => v));
    return last.map(([date, val]) => ({
      name: date,
      value: fmt(val),
      pct: Math.round((val / max) * 100),
      color: 'var(--accent)',
    }));
  }, [creditsByDay]);

  const productTotals = statsQ.data?.product_activity?.totals;
  const productToday = statsQ.data?.product_activity?.today;
  const upstream = statsQ.data?.upstream_api_cache;

  if (statsQ.isError) {
    return (
      <Notice type="warn">
        Could not load dashboard stats: {(statsQ.error as Error)?.message ?? 'Unknown error'}
      </Notice>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Platform overview — charts are last ~30 days (API)</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button
            variant="ghost"
            onClick={() => {
              statsQ.refetch();
              chartsQ.refetch();
              catalogQ.refetch();
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {statCards.length > 0 ? (
        <StatsGrid stats={statCards} />
      ) : (
        <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>Loading stats…</div>
      )}

      {productTotals && productToday && (
        <Grid cols="1fr 1fr" style={{ marginBottom: 14 }}>
          <Card>
            <CardHeader title="Product activity (totals)" subtitle="dashboard/stats → product_activity.totals" />
            <CardBody>
              {Object.entries(productTotals).map(([k, v], i, arr) => (
                <MetricRow key={k} name={k} value={fmt(v)} isLast={i === arr.length - 1} />
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Product activity (today)" subtitle="product_activity.today" />
            <CardBody>
              {Object.entries(productToday).map(([k, v], i, arr) => (
                <MetricRow key={k} name={k} value={fmt(v)} isLast={i === arr.length - 1} />
              ))}
            </CardBody>
          </Card>
        </Grid>
      )}

      {upstream && (
        <Card style={{ marginBottom: 14 }}>
          <CardHeader title="Upstream API cache (stats payload)" />
          <CardBody>
            <MetricRow name="calls_today" value={fmt(upstream.calls_today)} />
            <MetricRow name="cache_hit_rate" value={String(upstream.cache_hit_rate)} />
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, marginBottom: 0 }}>{upstream.description}</p>
          </CardBody>
        </Card>
      )}

      <Card style={{ marginBottom: 14 }}>
        <CardHeader title="Activity catalog" subtitle="GET /api/admin/activity/catalog" />
        <CardBody>
          {catalogQ.isLoading && <div style={{ color: 'var(--muted)', fontSize: 12 }}>Loading catalog…</div>}
          {catalogQ.isError && (
            <div style={{ color: 'var(--red)', fontSize: 12 }}>{(catalogQ.error as Error).message}</div>
          )}
          {catalogQ.data?.product_features?.map((f, i, arr) => (
            <MetricRow
              key={f.id}
              name={`${f.label} (${f.counts.total} total · ${f.counts.created_today} today)`}
              value={f.list.path}
              isLast={i === arr.length - 1}
            />
          ))}
          {catalogQ.data?.other_admin_lists?.length ? (
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              Other lists: {catalogQ.data.other_admin_lists.map((o) => o.label).join(' · ')}
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Grid cols="1.5fr 1fr">
        <Card>
          <CardHeader title="New users by day" subtitle="admin/dashboard/charts → users_by_date" />
          <CardBody>
            {chartsQ.isLoading ? (
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Loading chart…</div>
            ) : (
              <JobVolumeChart days={30} series={chartsQ.data?.users_by_date} />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Credits used by day" subtitle="credits_used_by_date (recent buckets)" />
          <CardBody>
            {creditsRows.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>No data</div>
            ) : (
              creditsRows.map((f, i) => (
                <MetricRow
                  key={f.name}
                  name={f.name}
                  value={f.value}
                  pct={f.pct}
                  color={f.color}
                  isLast={i === creditsRows.length - 1}
                />
              ))
            )}
          </CardBody>
        </Card>
      </Grid>

      <Grid cols="1fr 1fr">
        <Card>
          <CardHeader title="API calls by day" subtitle="api_calls_by_date" />
          <CardBody>
            {chartsQ.isLoading ? (
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Loading…</div>
            ) : (
              <JobVolumeChart days={30} series={chartsQ.data?.api_calls_by_date} />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Backlinks by day" subtitle="backlinks_by_date" />
          <CardBody>
            {chartsQ.isLoading ? (
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Loading…</div>
            ) : (
              <JobVolumeChart days={30} series={chartsQ.data?.backlinks_by_date} />
            )}
          </CardBody>
        </Card>
      </Grid>

      {(chartsQ.data?.faq_tasks_by_date || chartsQ.data?.citation_tasks_by_date) && (
        <Grid cols="1fr 1fr">
          {chartsQ.data?.faq_tasks_by_date ? (
            <Card>
              <CardHeader title="FAQ tasks by day" subtitle="faq_tasks_by_date" />
              <CardBody>
                <JobVolumeChart days={30} series={chartsQ.data.faq_tasks_by_date} />
              </CardBody>
            </Card>
          ) : (
            <div />
          )}
          {chartsQ.data?.citation_tasks_by_date ? (
            <Card>
              <CardHeader title="Citation tasks by day" subtitle="citation_tasks_by_date" />
              <CardBody>
                <JobVolumeChart days={30} series={chartsQ.data.citation_tasks_by_date} />
              </CardBody>
            </Card>
          ) : (
            <div />
          )}
        </Grid>
      )}

      <Notice type="info">
        Use the sidebar SEO Tools entries for paginated activity lists (FAQ, citations, keyword research, page analysis, PBN, cluster jobs). API cache log: API Cache page. Credits: Billing.
      </Notice>
    </div>
  );
};

export default Dashboard;
