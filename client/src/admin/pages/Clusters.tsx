import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, CardHeader, CardBody, StatsGrid, Badge, Table, Td,
  SectionHeader, Grid, Button, FiltersBar, FilterInput,
} from '../components/ui';
import { ActivityPager } from '../components/ActivityPager';
import { adminApi } from '@/lib/api/adminClient';
import type { BadgeColor } from '../types';
import type { StatCard } from '../types';

const SNAP_BADGE: Record<string, BadgeColor> = { valid: 'green', expiring: 'amber', expired: 'red' };

const JOB_STATUS: Record<string, BadgeColor> = {
  completed: 'green',
  processing: 'amber',
  failed: 'red',
  pending: 'blue',
};

type MainTab = 'snapshots' | 'jobs';

const Clusters: React.FC = () => {
  const [mainTab, setMainTab] = useState<MainTab>('snapshots');
  const [page, setPage] = useState(1);
  const [jobPage, setJobPage] = useState(1);
  const [jobUserId, setJobUserId] = useState('');
  const [jobStatus, setJobStatus] = useState('');
  const [jobStatusDraft, setJobStatusDraft] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const jobUid = parseInt(jobUserId, 10);
  const jobQuery = useMemo(
    () => ({
      page: jobPage,
      per_page: 50,
      ...(jobUserId !== '' && Number.isFinite(jobUid) ? { user_id: jobUid } : {}),
      ...(jobStatus.trim() ? { status: jobStatus.trim() } : {}),
    }),
    [jobPage, jobUserId, jobStatus, jobUid],
  );

  const listQ = useQuery({
    queryKey: ['admin', 'clusters', page],
    queryFn: () => adminApi.getClusters({ page, per_page: 30 }),
  });

  const jobsQ = useQuery({
    queryKey: ['admin', 'activity', 'cluster-jobs', jobQuery],
    queryFn: () => adminApi.getActivityClusterJobs(jobQuery),
    enabled: mainTab === 'jobs',
  });

  const snapQ = useQuery({
    queryKey: ['admin', 'clusters', selectedId, 'snapshots'],
    queryFn: () => adminApi.getClusterSnapshots(selectedId!),
    enabled: selectedId != null && mainTab === 'snapshots',
  });

  const stats: StatCard[] = useMemo(() => {
    const m = listQ.data?.meta;
    return [
      {
        label: 'Cluster rows',
        value: m ? m.total.toLocaleString() : '—',
        delta: 'GET /api/admin/clusters',
        deltaDir: 'neutral',
        color: 'var(--accent)',
      },
    ];
  }, [listQ.data?.meta]);

  const rows = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;
  const snapshots = snapQ.data?.data ?? [];

  return (
    <div>
      <SectionHeader title="Keyword Clusters" subtitle="Snapshot cache · activity cluster jobs" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button size="sm" variant={mainTab === 'snapshots' ? 'primary' : 'ghost'} onClick={() => setMainTab('snapshots')}>
          Snapshots
        </Button>
        <Button size="sm" variant={mainTab === 'jobs' ? 'primary' : 'ghost'} onClick={() => setMainTab('jobs')}>
          Cluster jobs
        </Button>
      </div>

      {listQ.isError && mainTab === 'snapshots' && (
        <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{(listQ.error as Error).message}</div>
      )}
      {jobsQ.isError && mainTab === 'jobs' && (
        <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{(jobsQ.error as Error).message}</div>
      )}

      <StatsGrid stats={stats} />

      {mainTab === 'jobs' ? (
        <Card>
          <CardHeader title="Cluster jobs" subtitle="GET /api/admin/activity/cluster-jobs" />
          <FiltersBar>
            <FilterInput
              placeholder="user_id"
              value={jobUserId}
              onChange={(e) => setJobUserId(e.target.value.replace(/\D/g, ''))}
              style={{ width: 100 }}
            />
            <FilterInput
              placeholder="status (exact)"
              value={jobStatusDraft}
              onChange={(e) => setJobStatusDraft(e.target.value)}
              style={{ width: 160 }}
            />
            <Button
              size="sm"
              onClick={() => {
                setJobStatus(jobStatusDraft);
                setJobPage(1);
              }}
            >
              Apply
            </Button>
          </FiltersBar>
          <Table
            cols={['ID', 'User', 'Keyword', 'Lang', 'Loc', 'Status', 'Snapshot', 'Completed']}
            rows={jobsQ.data?.data ?? []}
            renderRow={(r) => (
              <>
                <Td mono>{r.id}</Td>
                <Td mono muted>
                  #{r.user_id} {r.user_email}
                </Td>
                <Td mono>{r.keyword}</Td>
                <Td mono>{r.language_code}</Td>
                <Td mono>{r.location_code}</Td>
                <Td>
                  <Badge color={JOB_STATUS[r.status] ?? 'gray'}>{r.status}</Badge>
                </Td>
                <Td mono>{r.snapshot_id ?? '—'}</Td>
                <Td mono>
                  {r.completed_at ? new Date(r.completed_at).toLocaleString() : '—'}
                </Td>
              </>
            )}
          />
          <ActivityPager meta={jobsQ.data?.meta} page={jobPage} setPage={setJobPage} />
        </Card>
      ) : (
      <Grid cols="1.5fr 1fr">
        <Card>
          <CardHeader title="Clusters" subtitle="Click a row to load snapshots" />
          <Table
            cols={['ID', 'Keyword', 'Lang', 'Loc', 'Status', 'Expires']}
            rows={rows}
            getRowProps={(c) => ({
              onClick: () => setSelectedId(c.id),
              style: {
                cursor: 'pointer',
                background: selectedId === c.id ? 'rgba(91,127,255,0.08)' : undefined,
              },
            })}
            renderRow={(c) => (
              <>
                <Td mono>{c.id}</Td>
                <Td><strong>{c.keyword}</strong></Td>
                <Td mono>{c.language_code}</Td>
                <Td mono>{c.location_code}</Td>
                <Td><Badge color={SNAP_BADGE[c.status] ?? 'gray'}>{c.status}</Badge></Td>
                <Td mono>{new Date(c.expires_at).toLocaleString()}</Td>
              </>
            )}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginRight: 'auto' }}>
              {meta ? `Page ${meta.current_page}/${meta.last_page}` : '—'}
            </span>
            <button
              type="button"
              style={{
                padding: '4px 10px', borderRadius: 'var(--r)', fontSize: 11, border: '1px solid var(--border)',
                background: 'var(--card)', cursor: meta && meta.current_page > 1 ? 'pointer' : 'not-allowed',
              }}
              disabled={!meta || meta.current_page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              style={{
                padding: '4px 10px', borderRadius: 'var(--r)', fontSize: 11, border: '1px solid var(--border)',
                background: 'var(--card)', cursor: meta && meta.current_page < meta.last_page ? 'pointer' : 'not-allowed',
              }}
              disabled={!meta || meta.current_page >= meta.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Snapshots" subtitle={selectedId != null ? `cluster ${selectedId}` : 'Select a cluster'} />
          <CardBody>
            {selectedId == null && (
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Select a row on the left.</div>
            )}
            {selectedId != null && snapQ.isLoading && (
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Loading…</div>
            )}
            {selectedId != null && snapQ.isError && (
              <div style={{ color: 'var(--red)', fontSize: 12 }}>{(snapQ.error as Error).message}</div>
            )}
            {snapshots.map((s, i) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 0',
                  borderBottom: i < snapshots.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', flex: 1 }}>
                  #{s.id} · cluster_id {s.cluster_id}
                </span>
                <Badge color={SNAP_BADGE[s.status] ?? 'gray'}>{s.status}</Badge>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                  {new Date(s.expires_at).toLocaleString()}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      </Grid>
      )}
    </div>
  );
};

export default Clusters;
