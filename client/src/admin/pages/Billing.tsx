import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, CardHeader, CardBody, StatsGrid, Badge, Button,
  Table, Td, FiltersBar, FilterInput, SectionHeader, Grid, Notice,
} from '../components/ui';
import { adminApi } from '@/lib/api/adminClient';
import type { BadgeColor } from '../types';
import type { StatCard } from '../types';

const TX_BADGE: Record<string, BadgeColor> = {
  purchase: 'green',
  usage: 'amber',
  bonus: 'blue',
  refund: 'red',
  adjustment: 'purple',
};

const Billing: React.FC = () => {
  const [txPage, setTxPage] = useState(1);
  const [subPage, setSubPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);

  const txQuery = useMemo(() => {
    const uid = parseInt(userIdFilter, 10);
    return {
      page: txPage,
      per_page: 50,
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(userIdFilter !== '' && Number.isFinite(uid) ? { user_id: uid } : {}),
    };
  }, [txPage, typeFilter, userIdFilter]);

  const txQ = useQuery({
    queryKey: ['admin', 'credit-transactions', txQuery],
    queryFn: () => adminApi.getCreditTransactions(txQuery),
  });

  const subQ = useQuery({
    queryKey: ['admin', 'subscriptions', subPage],
    queryFn: () => adminApi.getSubscriptions({ page: subPage, per_page: 30 }),
  });

  const stats: StatCard[] = useMemo(() => {
    const m = txQ.data?.meta;
    return [
      {
        label: 'Credit tx (total)',
        value: m ? m.total.toLocaleString() : '—',
        delta: 'Filtered list',
        deltaDir: 'neutral',
        color: 'var(--accent)',
      }
    ];
  }, [txQ.data?.meta, subQ.data?.meta]);

  const exportCsv = async () => {
    setExportError(null);
    try {
      const uid = parseInt(userIdFilter, 10);
      await adminApi.exportCreditTransactions({
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(userIdFilter !== '' && Number.isFinite(uid) ? { user_id: uid } : {}),
      });
    } catch (e) {
      setExportError((e as Error).message || 'Export failed');
    }
  };

  const txRows = txQ.data?.data ?? [];
  const txMeta = txQ.data?.meta;
  const subRows = subQ.data?.data ?? [];
  const subMeta = subQ.data?.meta;

  return (
    <div>
      <SectionHeader title="Billing & Credits" subtitle="Credit ledger" />

      {exportError && (
        <div style={{ marginBottom: 12 }}>
          <Notice type="error">{exportError}</Notice>
        </div>
      )}

      {txQ.isError && (
        <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{(txQ.error as Error).message}</div>
      )}

      <StatsGrid stats={stats} />

      <Grid cols="1.5fr 1fr">
        <Card>
          <CardHeader title="Credit transactions"/>
          <FiltersBar>
            <FilterInput
              placeholder="Filter by user_id"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value.replace(/\D/g, ''))}
              style={{ width: 120 }}
            />
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setTxPage(1); }}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r)', padding: '6px 10px', fontSize: 12, color: 'var(--text)',
              }}
            >
              <option value="">All types</option>
              <option value="purchase">purchase</option>
              <option value="usage">usage</option>
              <option value="refund">refund</option>
              <option value="bonus">bonus</option>
              <option value="adjustment">adjustment</option>
            </select>
            <Button size="sm" style={{ marginLeft: 'auto' }} onClick={exportCsv}>
              Export CSV
            </Button>
          </FiltersBar>
          <Table
            cols={['ID', 'User', 'Type', 'Amount', 'Reference', 'Date']}
            rows={txRows}
            renderRow={(t) => (
              <>
                <Td mono>{t.id}</Td>
                <Td mono>{t.user_id}</Td>
                <Td>
                  <Badge color={TX_BADGE[t.type] ?? 'gray'}>{t.type}</Badge>
                </Td>
                <Td mono>{t.amount}</Td>
                <Td mono muted>{t.reference_id || '—'}</Td>
                <Td mono>{new Date(t.created_at).toLocaleString()}</Td>
              </>
            )}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginRight: 'auto' }}>
              {txMeta
                ? `Page ${txMeta.current_page}/${txMeta.last_page} · ${txMeta.total} rows`
                : '—'}
            </span>
            <Button size="sm" disabled={!txMeta || txMeta.current_page <= 1} onClick={() => setTxPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <Button
              size="sm"
              disabled={!txMeta || txMeta.current_page >= txMeta.last_page}
              onClick={() => setTxPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </Card>

        {/*<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>*/}
        {/*  <Card>*/}
        {/*    <CardHeader title="Subscriptions" subtitle="GET /api/admin/subscriptions" />*/}
        {/*    <Table*/}
        {/*      cols={['ID', 'User', 'Plan', 'Status', 'Period end']}*/}
        {/*      rows={subRows}*/}
        {/*      renderRow={(s) => (*/}
        {/*        <>*/}
        {/*          <Td mono>{s.id}</Td>*/}
        {/*          <Td mono>{s.user_id}</Td>*/}
        {/*          <Td mono>{s.plan}</Td>*/}
        {/*          <Td><Badge color={s.status === 'active' ? 'green' : 'gray'}>{s.status}</Badge></Td>*/}
        {/*          <Td mono>{s.current_period_end ? new Date(s.current_period_end).toLocaleString() : '—'}</Td>*/}
        {/*        </>*/}
        {/*      )}*/}
        {/*    />*/}
        {/*    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderTop: '1px solid var(--border)' }}>*/}
        {/*      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginRight: 'auto' }}>*/}
        {/*        {subMeta*/}
        {/*          ? `Page ${subMeta.current_page}/${subMeta.last_page}`*/}
        {/*          : '—'}*/}
        {/*      </span>*/}
        {/*      <Button size="sm" disabled={!subMeta || subMeta.current_page <= 1} onClick={() => setSubPage((p) => Math.max(1, p - 1))}>*/}
        {/*        Prev*/}
        {/*      </Button>*/}
        {/*      <Button*/}
        {/*        size="sm"*/}
        {/*        disabled={!subMeta || subMeta.current_page >= subMeta.last_page}*/}
        {/*        onClick={() => setSubPage((p) => p + 1)}*/}
        {/*      >*/}
        {/*        Next*/}
        {/*      </Button>*/}
        {/*    </div>*/}
        {/*  </Card>*/}

        {/*  <Notice type="info">*/}
        {/*    Feature credit prices, purchase rules, and Stripe webhooks are not exposed on admin routes; manage those in the Laravel app or Stripe dashboard.*/}
        {/*  </Notice>*/}
        {/*</div>*/}
      </Grid>
    </div>
  );
};

export default Billing;
