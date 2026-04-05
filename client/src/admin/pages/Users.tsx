import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, CardHeader, StatsGrid, Badge, Button, Table, Td,
  FiltersBar, FilterInput, SectionHeader, UserAvatar,
} from '../components/ui';
import { adminApi } from '@/lib/api/adminClient';
import type { AdminUserRow } from '@/lib/api/adminTypes';
import type { StatCard } from '../types';

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

const GRADS = ['#5b7fff', '#a78bfa', '#34d399', '#f87171', '#fbbf24'];

const Users: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [suspended, setSuspended] = useState<'any' | 'yes' | 'no'>('any');
  const [detailUserId, setDetailUserId] = useState<number | null>(null);

  const query = useMemo(
    () => ({
      page,
      per_page: 20,
      ...(search ? { search } : {}),
      ...(suspended === 'yes' ? { suspended: true } : suspended === 'no' ? { suspended: false } : {}),
    }),
    [page, search, suspended],
  );

  const listQ = useQuery({
    queryKey: ['admin', 'users', query],
    queryFn: () => adminApi.getUsers(query),
  });

  const detailQ = useQuery({
    queryKey: ['admin', 'users', detailUserId, 'activity'],
    queryFn: () => adminApi.getUser(detailUserId!, { include_product_activity: true }),
    enabled: detailUserId != null,
  });

  const stats: StatCard[] = useMemo(() => {
    const m = listQ.data?.meta;
    const total = m?.total ?? 0;
    return [
      { label: 'Total (filtered)', value: total.toLocaleString(), delta: 'From API meta.total', deltaDir: 'neutral', color: 'var(--accent)' },
      { label: 'This page', value: String(listQ.data?.data.length ?? 0), delta: `Page ${m?.current_page ?? 1}`, deltaDir: 'neutral', color: 'var(--green)' },
    ];
  }, [listQ.data]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'users'] });

  const suspendM = useMutation({
    mutationFn: (id: number) => adminApi.suspendUser(id),
    onSuccess: invalidate,
  });
  const unsuspendM = useMutation({
    mutationFn: (id: number) => adminApi.unsuspendUser(id),
    onSuccess: invalidate,
  });
  const creditsM = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => adminApi.adjustCredits(id, amount),
    onSuccess: invalidate,
  });

  const runCredits = (u: AdminUserRow) => {
    const raw = window.prompt(`Adjust credits for ${u.email} (negative to deduct):`, '0');
    if (raw === null) return;
    const amount = parseInt(raw, 10);
    if (Number.isNaN(amount) || amount === 0) {
      window.alert('Enter a non-zero integer.');
      return;
    }
    creditsM.mutate({ id: u.id, amount });
  };

  const rows = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;

  return (
    <div>
      <SectionHeader title="Users" subtitle="GET /api/admin/users · product activity on detail" />

      {listQ.isError && (
        <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>
          {(listQ.error as Error)?.message}
        </div>
      )}

      <StatsGrid stats={stats} />

      <Card>
        <FiltersBar>
          <FilterInput
            placeholder="Search name or email…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearch(searchDraft);
                setPage(1);
              }
            }}
            style={{ width: 220 }}
          />
          <Button size="sm" onClick={() => { setSearch(searchDraft); setPage(1); }}>Search</Button>
          <select
            value={suspended}
            onChange={(e) => { setSuspended(e.target.value as typeof suspended); setPage(1); }}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r)', padding: '6px 10px', color: 'var(--text)', fontSize: 12,
            }}
          >
            <option value="any">Any status</option>
            <option value="no">Active (not suspended)</option>
            <option value="yes">Suspended</option>
          </select>
        </FiltersBar>

        <Table
          cols={['User', 'Email', 'Credits', 'Role', 'Suspended', 'Created', 'Actions', 'Detail']}
          rows={rows}
          renderRow={(u) => {
            const g = GRADS[u.id % GRADS.length];
            return (
              <>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserAvatar initials={initials(u.name)} gradA={g} gradB={g} />
                    {u.name}
                  </div>
                </Td>
                <Td mono>{u.email}</Td>
                <Td><strong>{u.credits_balance.toLocaleString()}</strong></Td>
                <Td>
                  {u.is_admin ? <Badge color="purple">admin</Badge> : <Badge color="gray">user</Badge>}
                </Td>
                <Td>
                  {u.suspended_at
                    ? <Badge color="red">suspended</Badge>
                    : <Badge color="green">active</Badge>}
                </Td>
                <Td mono>{new Date(u.created_at).toLocaleString()}</Td>
                <Td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Button size="sm" onClick={() => runCredits(u)} disabled={creditsM.isPending}>
                      Credits
                    </Button>
                    {!u.suspended_at ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => suspendM.mutate(u.id)}
                        disabled={suspendM.isPending || u.is_admin}
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => unsuspendM.mutate(u.id)}
                        disabled={unsuspendM.isPending}
                      >
                        Unsuspend
                      </Button>
                    )}
                  </div>
                </Td>
                <Td>
                  <Button
                    size="sm"
                    variant={detailUserId === u.id ? 'primary' : 'ghost'}
                    onClick={() => setDetailUserId(detailUserId === u.id ? null : u.id)}
                  >
                    {detailUserId === u.id ? 'Hide' : 'Activity'}
                  </Button>
                </Td>
              </>
            );
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginRight: 'auto' }}>
            {meta
              ? `Page ${meta.current_page} / ${meta.last_page} · ${meta.total} users`
              : '—'}
          </span>
          <Button size="sm" disabled={!meta || meta.current_page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <Button
            size="sm"
            disabled={!meta || meta.current_page >= meta.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </Card>

      {detailUserId != null && (
        <Card style={{ marginTop: 16 }}>
          <CardHeader
            title={`User #${detailUserId} — product activity`}
            subtitle="GET /api/admin/users/{id}?include_product_activity=1"
          />
          <div style={{ padding: '16px 18px' }}>
            {detailQ.isLoading && (
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Loading…</div>
            )}
            {detailQ.isError && (
              <div style={{ color: 'var(--red)', fontSize: 12 }}>{(detailQ.error as Error).message}</div>
            )}
            {detailQ.data?.product_activity_counts && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 10,
                }}
              >
                {Object.entries(detailQ.data.product_activity_counts).map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--r)',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                    }}
                  >
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{k}</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{v ?? 0}</div>
                  </div>
                ))}
              </div>
            )}
            {detailQ.data && !detailQ.data.product_activity_counts && !detailQ.isLoading && (
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>No product_activity_counts in response.</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Users;
