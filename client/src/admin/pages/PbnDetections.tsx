import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, CardHeader, Badge, Table, Td,
  SectionHeader, FiltersBar, FilterInput, Button,
} from '../components/ui';
import { ActivityPager } from '../components/ActivityPager';
import { adminApi } from '@/lib/api/adminClient';
import type { BadgeColor } from '../types';

const STATUS_COLORS: Record<string, BadgeColor> = {
  completed: 'green',
  processing: 'amber',
  failed: 'red',
  pending: 'blue',
};

const PbnDetections: React.FC = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [domain, setDomain] = useState('');
  const [statusDraft, setStatusDraft] = useState('');
  const [domainDraft, setDomainDraft] = useState('');

  const q = useMemo(
    () => ({
      page,
      per_page: 50,
      ...(status.trim() ? { status: status.trim() } : {}),
      ...(domain.trim() ? { domain: domain.trim() } : {}),
    }),
    [page, status, domain],
  );

  const listQ = useQuery({
    queryKey: ['admin', 'activity', 'pbn-detections', q],
    queryFn: () => adminApi.getActivityPbnDetections(q),
  });

  const rows = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;

  return (
    <div>
      <SectionHeader title="PBN detections" subtitle="GET /api/admin/activity/pbn-detections (no user_id filter)" />

      {listQ.isError && (
        <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>
          {(listQ.error as Error).message}
        </div>
      )}

      <Card>
        <CardHeader title="Runs" />
        <FiltersBar>
          <FilterInput
            placeholder="status (exact)"
            value={statusDraft}
            onChange={(e) => setStatusDraft(e.target.value)}
            style={{ width: 160 }}
          />
          <FilterInput
            placeholder="domain substring…"
            value={domainDraft}
            onChange={(e) => setDomainDraft(e.target.value)}
            style={{ width: 200 }}
          />
          <Button
            size="sm"
            onClick={() => {
              setStatus(statusDraft);
              setDomain(domainDraft);
              setPage(1);
            }}
          >
            Apply
          </Button>
        </FiltersBar>
        <Table
          cols={['ID', 'Task', 'Domain', 'Status', 'H/M/L risk', 'Completed']}
          rows={rows}
          renderRow={(r) => (
            <>
              <Td mono>{r.id}</Td>
              <Td mono style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.task_id}>
                {r.task_id}
              </Td>
              <Td mono>{r.domain}</Td>
              <Td>
                <Badge color={STATUS_COLORS[r.status] ?? 'gray'}>{r.status}</Badge>
              </Td>
              <Td mono>
                {r.high_risk_count ?? 0}/{r.medium_risk_count ?? 0}/{r.low_risk_count ?? 0}
              </Td>
              <Td mono>
                {r.analysis_completed_at
                  ? new Date(r.analysis_completed_at).toLocaleString()
                  : '—'}
              </Td>
            </>
          )}
        />
        <ActivityPager meta={meta} page={page} setPage={setPage} />
      </Card>
    </div>
  );
};

export default PbnDetections;
