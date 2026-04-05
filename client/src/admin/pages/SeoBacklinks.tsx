import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, CardHeader, StatsGrid, Badge, Table, Td,
  SectionHeader, FiltersBar, FilterInput, Button,
} from '../components/ui';
import { adminApi } from '@/lib/api/adminClient';
import type { BadgeColor } from '../types';
import type { StatCard } from '../types';

const STATUS_BADGE: Record<string, BadgeColor> = {
  pending: 'amber',
  verified: 'green',
  failed: 'red',
};

const SeoBacklinks: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'pending' | 'verified' | 'failed' | ''>('');
  const [domain, setDomain] = useState('');
  const [domainDraft, setDomainDraft] = useState('');

  const query = useMemo(
    () => ({
      page,
      per_page: 50,
      ...(status ? { status } : {}),
      ...(domain ? { domain } : {}),
    }),
    [page, status, domain],
  );

  const q = useQuery({
    queryKey: ['admin', 'backlinks', query],
    queryFn: () => adminApi.getBacklinks(query),
  });

  const stats: StatCard[] = useMemo(() => {
    const m = q.data?.meta;
    return [
      {
        label: 'Backlinks (filtered)',
        value: m ? m.total.toLocaleString() : '—',
        delta: 'GET /api/admin/backlinks',
        deltaDir: 'neutral',
        color: 'var(--accent)',
      },
    ];
  }, [q.data?.meta]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'backlinks'] });

  const delM = useMutation({
    mutationFn: (id: number) => adminApi.deleteBacklink(id),
    onSuccess: invalidate,
  });
  const verM = useMutation({
    mutationFn: (id: number) => adminApi.verifyBacklink(id),
    onSuccess: invalidate,
  });

  const rows = q.data?.data ?? [];
  const meta = q.data?.meta;

  return (
    <div>
      <SectionHeader title="SEO & Backlinks" subtitle="GET/DELETE/POST /api/admin/backlinks" />

      {q.isError && (
        <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{(q.error as Error).message}</div>
      )}

      <StatsGrid stats={stats} />

      <Card>
        <CardHeader title="Backlinks" />
        <FiltersBar>
          <FilterInput
            placeholder="Domain substring…"
            value={domainDraft}
            onChange={(e) => setDomainDraft(e.target.value)}
            style={{ width: 200 }}
          />
          <Button size="sm" onClick={() => { setDomain(domainDraft); setPage(1); }}>Apply</Button>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r)', padding: '6px 10px', fontSize: 12, color: 'var(--text)',
            }}
          >
            <option value="">All statuses</option>
            <option value="pending">pending</option>
            <option value="verified">verified</option>
            <option value="failed">failed</option>
          </select>
        </FiltersBar>
        <Table
          cols={['ID', 'Target', 'Source', 'Status', 'User', 'Verified', 'Actions']}
          rows={rows}
          renderRow={(b) => (
            <>
              <Td mono>{b.id}</Td>
              <Td mono style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} title={b.target_url}>
                {b.target_url}
              </Td>
              <Td mono style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }} title={b.source_url}>
                {b.source_url}
              </Td>
              <Td><Badge color={STATUS_BADGE[b.status] ?? 'gray'}>{b.status}</Badge></Td>
              <Td>{b.user ? `${b.user.name} (#${b.user.id})` : '—'}</Td>
              <Td mono>{b.verified_at ? new Date(b.verified_at).toLocaleString() : '—'}</Td>
              <Td>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Button size="sm" onClick={() => verM.mutate(b.id)} disabled={verM.isPending}>
                    Re-verify
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (window.confirm(`Delete backlink #${b.id}?`)) delM.mutate(b.id);
                    }}
                    disabled={delM.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </Td>
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

export default SeoBacklinks;
