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

const Faq: React.FC = () => {
  const [pageTasks, setPageTasks] = useState(1);
  const [pageStored, setPageStored] = useState(1);
  const [userIdTasks, setUserIdTasks] = useState('');
  const [userIdStored, setUserIdStored] = useState('');
  const [status, setStatus] = useState('');
  const [statusDraft, setStatusDraft] = useState('');

  const uidT = parseInt(userIdTasks, 10);
  const uidS = parseInt(userIdStored, 10);

  const qTasks = useMemo(
    () => ({
      page: pageTasks,
      per_page: 50,
      ...(userIdTasks !== '' && Number.isFinite(uidT) ? { user_id: uidT } : {}),
      ...(status.trim() ? { status: status.trim() } : {}),
    }),
    [pageTasks, userIdTasks, status, uidT],
  );

  const qStored = useMemo(
    () => ({
      page: pageStored,
      per_page: 50,
      ...(userIdStored !== '' && Number.isFinite(uidS) ? { user_id: uidS } : {}),
    }),
    [pageStored, userIdStored, uidS],
  );

  const tasksQ = useQuery({
    queryKey: ['admin', 'activity', 'faq-tasks', qTasks],
    queryFn: () => adminApi.getActivityFaqTasks(qTasks),
  });

  const storedQ = useQuery({
    queryKey: ['admin', 'activity', 'faqs', qStored],
    queryFn: () => adminApi.getActivityFaqs(qStored),
  });

  return (
    <div>
      <SectionHeader title="FAQ activity" subtitle="Async tasks · stored FAQ documents" />

      {(tasksQ.isError || storedQ.isError) && (
        <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>
          {(tasksQ.error as Error | undefined)?.message ??
            (storedQ.error as Error | undefined)?.message}
        </div>
      )}

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="FAQ tasks" subtitle="GET /api/admin/activity/faq-tasks" />
        <FiltersBar>
          <FilterInput
            placeholder="user_id"
            value={userIdTasks}
            onChange={(e) => setUserIdTasks(e.target.value.replace(/\D/g, ''))}
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
              setPageTasks(1);
            }}
          >
            Apply
          </Button>
        </FiltersBar>
        <Table
          cols={['ID', 'Task', 'User', 'URL', 'Status', 'FAQ id', 'Created']}
          rows={tasksQ.data?.data ?? []}
          renderRow={(r) => (
            <>
              <Td mono>{r.id}</Td>
              <Td mono style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.task_id}>
                {r.task_id}
              </Td>
              <Td mono muted>
                #{r.user_id} {r.user_email}
              </Td>
              <Td mono style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.url}>
                {r.url}
              </Td>
              <Td>
                <Badge color={STATUS_COLORS[r.status] ?? 'gray'}>{r.status}</Badge>
              </Td>
              <Td mono>{r.faq_id ?? '—'}</Td>
              <Td mono>{new Date(r.created_at).toLocaleString()}</Td>
            </>
          )}
        />
        <ActivityPager meta={tasksQ.data?.meta} page={pageTasks} setPage={setPageTasks} />
      </Card>

      <Card>
        <CardHeader title="Stored FAQs" subtitle="GET /api/admin/activity/faqs" />
        <FiltersBar>
          <FilterInput
            placeholder="user_id"
            value={userIdStored}
            onChange={(e) => setUserIdStored(e.target.value.replace(/\D/g, ''))}
            style={{ width: 100 }}
          />
          <Button size="sm" onClick={() => setPageStored(1)}>
            Apply
          </Button>
        </FiltersBar>
        <Table
          cols={['ID', 'User', 'URL', 'Topic', 'Items', 'API saved', 'Updated']}
          rows={storedQ.data?.data ?? []}
          renderRow={(r) => (
            <>
              <Td mono>{r.id}</Td>
              <Td mono muted>
                #{r.user_id} {r.user_email}
              </Td>
              <Td mono style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.url}>
                {r.url}
              </Td>
              <Td>{r.topic ?? '—'}</Td>
              <Td mono>{r.faq_items_count ?? '—'}</Td>
              <Td mono>{r.api_calls_saved ?? '—'}</Td>
              <Td mono>
                {r.updated_at ? new Date(r.updated_at).toLocaleString() : new Date(r.created_at).toLocaleString()}
              </Td>
            </>
          )}
        />
        <ActivityPager meta={storedQ.data?.meta} page={pageStored} setPage={setPageStored} />
      </Card>
    </div>
  );
};

export default Faq;
