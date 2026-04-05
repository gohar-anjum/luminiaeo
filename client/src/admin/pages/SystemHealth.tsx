import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, CardHeader, CardBody, StatsGrid, Button, SectionHeader, Grid, Notice,
} from '../components/ui';
import { adminApi } from '@/lib/api/adminClient';
import type { StatCard } from '../types';

const SystemHealth: React.FC = () => {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const healthQ = useQuery({
    queryKey: ['admin', 'system', 'health'],
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 60_000,
  });

  const clearQ = useMutation({
    mutationFn: () => adminApi.clearCache(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const announceQ = useMutation({
    mutationFn: () => adminApi.createAnnouncement({ title: title.trim(), body: body.trim() }),
    onSuccess: () => {
      setTitle('');
      setBody('');
    },
  });

  const h = healthQ.data;
  const stats: StatCard[] = h
    ? [
        {
          label: 'App status',
          value: h.status,
          delta: h.timestamp,
          deltaDir: h.status === 'healthy' ? 'up' : 'down',
          color: h.status === 'healthy' ? 'var(--green)' : 'var(--amber)',
        },
        {
          label: 'Database',
          value: h.database,
          delta: 'check',
          deltaDir: h.database === 'ok' ? 'up' : 'down',
          color: 'var(--accent)',
        },
        {
          label: 'Redis',
          value: h.redis,
          delta: 'check',
          deltaDir: h.redis === 'ok' ? 'up' : 'down',
          color: 'var(--accent2)',
        },
      ]
    : [];

  return (
    <div>
      <SectionHeader title="Health & Logs" subtitle="GET /api/admin/system/health · POST cache/clear · announcements">
        <Button variant="ghost" onClick={() => healthQ.refetch()}>
          Refresh
        </Button>
        <Button variant="primary" onClick={() => clearQ.mutate()} disabled={clearQ.isPending}>
          {clearQ.isPending ? 'Clearing…' : 'Clear app cache'}
        </Button>
      </SectionHeader>

      {healthQ.isError && (
        <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{(healthQ.error as Error).message}</div>
      )}

      <StatsGrid stats={stats.length ? stats : [{ label: 'Health', value: '…', color: 'var(--muted)' }]} />

      <Grid cols="1fr 1fr">
        <Card>
          <CardHeader title="Raw health payload" />
          <CardBody>
            {h ? (
              <pre style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', margin: 0, whiteSpace: 'pre-wrap',
              }}>
                {JSON.stringify(h, null, 2)}
              </pre>
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Loading…</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Create announcement" subtitle="POST /api/admin/announcements" />
          <CardBody>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              style={{
                width: '100%', marginBottom: 12, padding: '8px 10px', borderRadius: 'var(--r)',
                border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13,
              }}
            />
            <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={65535}
              rows={5}
              style={{
                width: '100%', marginBottom: 12, padding: '8px 10px', borderRadius: 'var(--r)',
                border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13,
                resize: 'vertical',
              }}
            />
            <Button
              variant="primary"
              disabled={announceQ.isPending || !title.trim() || !body.trim()}
              onClick={() => announceQ.mutate()}
            >
              {announceQ.isPending ? 'Publishing…' : 'Publish'}
            </Button>
            {announceQ.isSuccess && announceQ.data && (
              <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--green)' }}>
                Created #{announceQ.data.id}
              </span>
            )}
            {announceQ.isError && (
              <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--red)' }}>
                {(announceQ.error as Error).message}
              </span>
            )}
          </CardBody>
        </Card>
      </Grid>

      <Notice type="info">
        Queue depth, rate limits, and full request logs are not on admin health routes. Use API Cache for upstream logs and CSV export.
      </Notice>
    </div>
  );
};

export default SystemHealth;
