import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, CardHeader, CardBody, StatsGrid, Table, Td,
  SectionHeader, MetricRow, Grid, Badge, Button, FiltersBar, FilterInput, Notice,
} from '../components/ui';
import { adminApi } from '@/lib/api/adminClient';
import type { StatCard } from '../types';

const ApiCache: React.FC = () => {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);

  const statsQ = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  const uid = parseInt(userId, 10);
  const logsQ = useQuery({
    queryKey: ['admin', 'api-logs', page, userId, endpoint],
    queryFn: () =>
      adminApi.getApiLogs({
        page,
        per_page: 50,
        method: 'POST',
        ...(userId !== '' && Number.isFinite(uid) ? { user_id: uid } : {}),
        ...(endpoint.trim() ? { endpoint: endpoint.trim() } : {}),
      }),
  });

  const statCards: StatCard[] = useMemo(() => {
    const s = statsQ.data;
    if (!s) return [];
    const pct = (s.api_cache_hit_rate * 100).toFixed(1);
    return [
      {
        label: 'API cache hit rate',
        value: `${pct}%`,
        delta: 'From dashboard stats (0–1 ratio)',
        deltaDir: 'neutral',
        color: 'var(--accent)',
      },
      {
        label: 'API calls today',
        value: s.api_calls_today.toLocaleString(),
        delta: 'Same stats payload',
        deltaDir: 'neutral',
        color: 'var(--green)',
      },
    ];
  }, [statsQ.data]);

  const rows = logsQ.data?.data ?? [];
  const meta = logsQ.data?.meta;

  const exportLogs = async () => {
    setExportError(null);
    try {
      await adminApi.exportApiLogs({
        method: 'POST',
        ...(userId !== '' && Number.isFinite(uid) ? { user_id: uid } : {}),
        ...(endpoint.trim() ? { endpoint: endpoint.trim() } : {}),
      });
    } catch (e) {
      setExportError((e as Error).message || 'Export failed');
    }
  };

  return (
    <div>
      <SectionHeader title="API Cache" subtitle="Dashboard hit rate · upstream API logs" />

      {exportError && (
        <div style={{ marginBottom: 12 }}>
          <Notice type="error">{exportError}</Notice>
        </div>
      )}

      {statsQ.isError && (
        <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{(statsQ.error as Error).message}</div>
      )}

      <StatsGrid stats={statCards.length ? statCards : [{ label: 'Loading…', value: '—', color: 'var(--muted)' }]} />

      <Notice type="info">
        Log rows use synthetic paths such as {'/api/upstream/{provider}/{feature}'}. The backend only returns rows for method POST
        (enforced in this UI).
      </Notice>

      <Grid cols="1fr 1fr">
        <Card>
          <CardHeader title="Hit rate context" />
          <CardBody>
            <MetricRow
              name="api_cache_hit_rate (raw)"
              value={statsQ.data != null ? String(statsQ.data.api_cache_hit_rate) : '—'}
              isLast
            />
            <MetricRow
              name="api_calls_today"
              value={statsQ.data != null ? statsQ.data.api_calls_today.toLocaleString() : '—'}
              isLast
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Export" />
          <CardBody>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
              CSV uses the same filters as the table (user_id, endpoint substring).
            </p>
            <Button variant="primary" onClick={exportLogs}>
              Export API logs CSV
            </Button>
          </CardBody>
        </Card>
      </Grid>

      <Card>
        <CardHeader title="API logs" subtitle="GET /api/admin/api-logs" />
        <FiltersBar>
          <FilterInput
            placeholder="user_id"
            value={userId}
            onChange={(e) => setUserId(e.target.value.replace(/\D/g, ''))}
            style={{ width: 100 }}
          />
          <FilterInput
            placeholder="endpoint substring…"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            style={{ width: 220 }}
          />
          <Button size="sm" onClick={() => { setPage(1); logsQ.refetch(); }}>Apply</Button>
        </FiltersBar>
        {logsQ.isError && (
          <div style={{ color: 'var(--red)', fontSize: 12, padding: '0 18px 12px' }}>
            {(logsQ.error as Error).message}
          </div>
        )}
        {logsQ.data?.context?.description && (
          <div style={{ padding: '0 18px 12px', fontSize: 11, color: 'var(--muted)' }}>
            {logsQ.data.context.description}
          </div>
        )}
        <Table
          cols={['ID', 'User', 'Provider', 'Feature', 'Endpoint', 'Summary', 'ms', 'HTTP', 'Cache', 'Time']}
          rows={rows}
          renderRow={(r) => (
            <>
              <Td mono>{r.id}</Td>
              <Td mono>{r.user_id}</Td>
              <Td mono muted>{r.api_provider ?? '—'}</Td>
              <Td mono muted>{r.api_feature ?? '—'}</Td>
              <Td mono style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.endpoint}>
                {r.endpoint}
              </Td>
              <Td mono muted style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.query_summary ?? ''}>
                {r.query_summary ?? '—'}
              </Td>
              <Td mono>{r.response_time_ms}</Td>
              <Td><Badge color={r.status_code >= 200 && r.status_code < 300 ? 'green' : 'red'}>{r.status_code}</Badge></Td>
              <Td><Badge color={r.cache_hit ? 'blue' : 'gray'}>{r.cache_hit ? 'hit' : 'miss'}</Badge></Td>
              <Td mono>{new Date(r.created_at).toLocaleString()}</Td>
            </>
          )}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginRight: 'auto' }}>
            {meta ? `Page ${meta.current_page}/${meta.last_page} · ${meta.total}` : '—'}
          </span>
          <Button size="sm" disabled={!meta || meta.current_page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </Button>
          <Button size="sm" disabled={!meta || meta.current_page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ApiCache;
