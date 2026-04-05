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

const Citations: React.FC = () => {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState('');
  const [statusDraft, setStatusDraft] = useState('');

  const uid = parseInt(userId, 10);
  const q = useMemo(
    () => ({
      page,
      per_page: 50,
      ...(userId !== '' && Number.isFinite(uid) ? { user_id: uid } : {}),
      ...(status.trim() ? { status: status.trim() } : {}),
    }),
    [page, userId, status, uid],
  );

  const listQ = useQuery({
    queryKey: ['admin', 'activity', 'citation-tasks', q],
    queryFn: () => adminApi.getActivityCitationTasks(q),
  });

  const rows = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;

  return (
    <div>
      <SectionHeader title="Citation Tasks" subtitle="GET /api/admin/activity/citation-tasks" />

      {listQ.isError && (
        <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>
          {(listQ.error as Error).message}
        </div>
      )}

      <Card>
        <CardHeader title="Tasks" />
        <FiltersBar>
          <FilterInput
            placeholder="user_id"
            value={userId}
            onChange={(e) => setUserId(e.target.value.replace(/\D/g, ''))}
            style={{ width: 100 }}
          />
          <FilterInput
            placeholder="status (exact)"
            value={statusDraft}
            onChange={(e) => setStatusDraft(e.target.value)}
            style={{ width: 160 }}
          />
          <Button
            size="sm"
            onClick={() => {
              setStatus(statusDraft);
              setPage(1);
            }}
          >
            Apply
          </Button>
        </FiltersBar>
        <Table
          cols={['ID', 'User', 'URL', 'Status', 'Queries', 'Created']}
          rows={rows}
          renderRow={(r) => (
            <>
              <Td mono>{r.id}</Td>
              <Td mono muted>
                #{r.user_id} {r.user_email}
              </Td>
              <Td mono style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.url}>
                {r.url}
              </Td>
              <Td>
                <Badge color={STATUS_COLORS[r.status] ?? 'gray'}>{r.status}</Badge>
              </Td>
              <Td mono>{r.queries_count ?? '—'}</Td>
              <Td mono>{new Date(r.created_at).toLocaleString()}</Td>
            </>
          )}
        />
        <ActivityPager meta={meta} page={page} setPage={setPage} />
      </Card>
    </div>
  );
};

export default Citations;
