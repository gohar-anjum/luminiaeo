import React from 'react';
import { Button } from './ui';
import type { AdminPaginationMeta } from '@/lib/api/adminTypes';

export function ActivityPager({
  meta,
  page,
  setPage,
}: {
  meta?: AdminPaginationMeta;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 18px',
        borderTop: '1px solid var(--border)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--muted)',
          marginRight: 'auto',
        }}
      >
        {meta ? `Page ${meta.current_page}/${meta.last_page} · ${meta.total}` : '—'}
      </span>
      <Button
        size="sm"
        disabled={!meta || meta.current_page <= 1}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
      >
        Prev
      </Button>
      <Button
        size="sm"
        disabled={!meta || meta.current_page >= meta.last_page}
        onClick={() => setPage((p) => p + 1)}
      >
        Next
      </Button>
    </div>
  );
}
