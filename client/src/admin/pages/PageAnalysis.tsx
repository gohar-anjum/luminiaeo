import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, CardHeader, Table, Td,
  SectionHeader, FiltersBar, FilterInput, Button,
} from '../components/ui';
import { ActivityPager } from '../components/ActivityPager';
import { adminApi } from '@/lib/api/adminClient';

type Tab = 'meta' | 'semantic' | 'outlines';

const PageAnalysis: React.FC = () => {
  const [tab, setTab] = useState<Tab>('meta');
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState('');

  const uid = parseInt(userId, 10);
  const q = useMemo(
    () => ({
      page,
      per_page: 50,
      ...(userId !== '' && Number.isFinite(uid) ? { user_id: uid } : {}),
    }),
    [page, userId, uid],
  );

  const metaQ = useQuery({
    queryKey: ['admin', 'activity', 'meta-analyses', q],
    queryFn: () => adminApi.getActivityMetaAnalyses(q),
    enabled: tab === 'meta',
  });

  const semQ = useQuery({
    queryKey: ['admin', 'activity', 'semantic-analyses', q],
    queryFn: () => adminApi.getActivitySemanticAnalyses(q),
    enabled: tab === 'semantic',
  });

  const outQ = useQuery({
    queryKey: ['admin', 'activity', 'content-outlines', q],
    queryFn: () => adminApi.getActivityContentOutlines(q),
    enabled: tab === 'outlines',
  });

  const activeQ = tab === 'meta' ? metaQ : tab === 'semantic' ? semQ : outQ;

  return (
    <div>
      <SectionHeader
        title="Page analysis activity"
        subtitle="Meta · semantic · content outlines (no status filter on API)"
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['meta', 'semantic', 'outlines'] as const).map((t) => (
          <Button
            key={t}
            variant={tab === t ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => {
              setTab(t);
              setPage(1);
            }}
          >
            {t === 'meta' ? 'Meta analyses' : t === 'semantic' ? 'Semantic analyses' : 'Content outlines'}
          </Button>
        ))}
      </div>

      {activeQ.isError && (
        <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>
          {(activeQ.error as Error).message}
        </div>
      )}

      <Card>
        <CardHeader
          title={
            tab === 'meta'
              ? 'Meta tag analyses'
              : tab === 'semantic'
                ? 'Semantic scores'
                : 'Content outlines'
          }
          subtitle={
            tab === 'meta'
              ? 'GET /api/admin/activity/meta-analyses'
              : tab === 'semantic'
                ? 'GET /api/admin/activity/semantic-analyses'
                : 'GET /api/admin/activity/content-outlines'
          }
        />
        <FiltersBar>
          <FilterInput
            placeholder="user_id"
            value={userId}
            onChange={(e) => setUserId(e.target.value.replace(/\D/g, ''))}
            style={{ width: 100 }}
          />
          <Button size="sm" onClick={() => setPage(1)}>
            Apply
          </Button>
        </FiltersBar>

        {tab === 'meta' && (
          <>
            <Table
              cols={['ID', 'User', 'URL', 'Keyword', 'Intent', 'Analyzed']}
              rows={metaQ.data?.data ?? []}
              renderRow={(r) => (
                <>
                  <Td mono>{r.id}</Td>
                  <Td mono muted>
                    #{r.user_id} {r.user_email}
                  </Td>
                  <Td mono style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.url}>
                    {r.url}
                  </Td>
                  <Td mono>{r.target_keyword}</Td>
                  <Td>{r.intent ?? '—'}</Td>
                  <Td mono>
                    {r.analyzed_at ? new Date(r.analyzed_at).toLocaleString() : '—'}
                  </Td>
                </>
              )}
            />
            <ActivityPager meta={metaQ.data?.meta} page={page} setPage={setPage} />
          </>
        )}

        {tab === 'semantic' && (
          <>
            <Table
              cols={['ID', 'User', 'Source', 'Keyword', 'Score', 'Analyzed']}
              rows={semQ.data?.data ?? []}
              renderRow={(r) => (
                <>
                  <Td mono>{r.id}</Td>
                  <Td mono muted>
                    #{r.user_id} {r.user_email}
                  </Td>
                  <Td mono style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.source_url}>
                    {r.source_url}
                  </Td>
                  <Td mono>{r.target_keyword}</Td>
                  <Td mono>{r.semantic_score}</Td>
                  <Td mono>
                    {r.analyzed_at ? new Date(r.analyzed_at).toLocaleString() : '—'}
                  </Td>
                </>
              )}
            />
            <ActivityPager meta={semQ.data?.meta} page={page} setPage={setPage} />
          </>
        )}

        {tab === 'outlines' && (
          <>
            <Table
              cols={['ID', 'User', 'Keyword', 'Tone', 'Intent', 'Sections', 'Generated']}
              rows={outQ.data?.data ?? []}
              renderRow={(r) => (
                <>
                  <Td mono>{r.id}</Td>
                  <Td mono muted>
                    #{r.user_id} {r.user_email}
                  </Td>
                  <Td mono>{r.keyword}</Td>
                  <Td>{r.tone ?? '—'}</Td>
                  <Td>{r.intent ?? '—'}</Td>
                  <Td mono>{r.outline_sections_count ?? '—'}</Td>
                  <Td mono>
                    {r.generated_at ? new Date(r.generated_at).toLocaleString() : '—'}
                  </Td>
                </>
              )}
            />
            <ActivityPager meta={outQ.data?.meta} page={page} setPage={setPage} />
          </>
        )}
      </Card>
    </div>
  );
};

export default PageAnalysis;
