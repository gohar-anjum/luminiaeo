import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { AdminPage } from '../../types';

const PAGE_META: Record<AdminPage, { title: string; crumb: string }> = {
  dashboard:        { title: 'Dashboard',          crumb: 'Overview' },
  users:            { title: 'Users',               crumb: 'Users' },
  billing:          { title: 'Billing & Credits',   crumb: 'Billing' },
  'keyword-research': { title: 'Keyword Research', crumb: 'SEO Tools' },
  'keyword-clusters': { title: 'Clusters',         crumb: 'SEO Tools' },
  citations:        { title: 'Citations',           crumb: 'SEO Tools' },
  'page-analysis':  { title: 'Page Analysis',       crumb: 'SEO Tools' },
  'seo-backlinks':  { title: 'SEO & Backlinks',     crumb: 'SEO Tools' },
  faq:              { title: 'FAQ Generation',       crumb: 'SEO Tools' },
  'pbn-detections': { title: 'PBN detections',       crumb: 'SEO Tools' },
  'system-health':  { title: 'Health & Logs',        crumb: 'System' },
  'api-cache':      { title: 'API Cache',            crumb: 'System' },
  features:         { title: 'Features & Pricing',   crumb: 'System' },
};

interface TopbarProps {
  activePage: AdminPage;
}

const Topbar: React.FC<TopbarProps> = ({ activePage }) => {
  const { theme, toggleTheme } = useTheme();
  const meta = PAGE_META[activePage];
  return (
    <div style={{
      height: 56,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 28px', gap: 16,
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.2px' }}>
          {meta.title}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
          <span style={{ color: 'var(--accent)' }}>{meta.crumb}</span>
        </div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)', animation: 'pulse 2.5s ease-in-out infinite' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)' }}>HEALTHY</span>
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to night mode' : 'Switch to day mode'}
          aria-label={theme === 'light' ? 'Switch to night mode' : 'Switch to day mode'}
          style={{
            width: 32, height: 32, borderRadius: 'var(--r)',
            background: 'var(--card)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text)', transition: 'all 0.15s',
          }}
        >
          {theme === 'light' ? <Moon size={16} strokeWidth={2} /> : <Sun size={16} strokeWidth={2} />}
        </button>
        <div
          title="Refresh"
          onClick={() => window.location.reload()}
          style={{
            width: 32, height: 32, borderRadius: 'var(--r)',
            background: 'var(--card)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--muted)', fontSize: 14,
            transition: 'all 0.15s',
          }}
        >
          ↺
        </div>
      </div>
    </div>
  );
};

export default Topbar;
