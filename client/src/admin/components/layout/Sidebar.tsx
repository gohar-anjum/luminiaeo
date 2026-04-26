import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import type { AdminPage } from '../../types';
import { BrandMark } from '@/components/BrandMark';

function userInitials(name: string, email: string): string {
  const n = name.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const e = email.trim();
  return e ? e.slice(0, 2).toUpperCase() : 'AD';
}

interface NavItemDef {
  label: string;
  section: AdminPage;
  icon: string;
}

interface NavGroupDef {
  label: string;
  items: NavItemDef[];
}

const NAV_GROUPS: NavGroupDef[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', section: 'dashboard', icon: '◈' },
    ],
  },
  {
    label: 'Users',
    items: [
      { label: 'All Users',        section: 'users',   icon: '◉' },
      { label: 'Billing & Credits', section: 'billing', icon: '◈' },
    ],
  },
  {
    label: 'SEO Tools',
    items: [
      { label: 'Keyword Research', section: 'keyword-research',  icon: '◎' },
      { label: 'Clusters',         section: 'keyword-clusters',  icon: '⬡' },
      { label: 'Citations',        section: 'citations',         icon: '◩' },
      { label: 'Page Analysis',    section: 'page-analysis',     icon: '◧' },
      { label: 'SEO / Backlinks',  section: 'seo-backlinks',     icon: '⬢' },
      { label: 'FAQs',             section: 'faq',               icon: '◫' },
      { label: 'PBN detections',   section: 'pbn-detections',    icon: '◆' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Health & Logs',      section: 'system-health', icon: '◈' },
      { label: 'API Cache',          section: 'api-cache',     icon: '◎' },
      { label: 'Features & Pricing', section: 'features',      icon: '◩' },
    ],
  },
];

interface SidebarProps {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const displayName = user?.name?.trim() || 'Admin';
  const displayEmail = user?.email?.trim() || '';
  const initials = user ? userInitials(user.name || '', user.email || '') : 'AD';

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  return (
    <nav style={{
      width: 'var(--sidebar)',
      minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 100,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 18px 14px', borderBottom: '1px solid var(--border)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
        <BrandMark size="sm" className="!bg-white !border-[color:var(--border)]" />
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--text)' }}>
          LuminiaEO
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          background: 'var(--accent)', color: '#fff',
          padding: '1px 6px', borderRadius: 20, marginLeft: 6,
          verticalAlign: 'middle', letterSpacing: '0.5px',
        }}>
          ADMIN
        </span>
      </div>

      {/* Nav Groups */}
      {NAV_GROUPS.map((group) => (
        <div key={group.label} style={{ padding: '6px 10px 2px' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '1.2px',
            textTransform: 'uppercase', color: 'var(--muted)', padding: '6px 8px 4px',
          }}>
            {group.label}
          </div>
          {group.items.map((item) => {
            const isActive = activePage === item.section;
            return (
              <div
                key={item.section}
                onClick={() => onNavigate(item.section)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 10px', borderRadius: 'var(--r)', cursor: 'pointer',
                  color: isActive ? 'var(--accent)' : 'var(--muted)',
                  fontSize: 13, fontWeight: isActive ? 500 : 400,
                  transition: 'all 0.15s', marginBottom: 1,
                  background: isActive ? 'var(--accent-subtle-bg)' : 'transparent',
                  border: isActive ? '1px solid var(--accent-subtle-border)' : '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = 'var(--card)';
                    (e.currentTarget as HTMLDivElement).style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    (e.currentTarget as HTMLDivElement).style.color = 'var(--muted)';
                  }
                }}
              >
                <span style={{ width: 16, textAlign: 'center', fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </div>
            );
          })}
        </div>
      ))}

      {/* Footer — signed-in admin + logout */}
      <div style={{ marginTop: 'auto', padding: '12px 10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
          borderRadius: 'var(--r)', background: 'var(--card)', border: '1px solid var(--border)',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            {displayEmail ? (
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayEmail}</div>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 'var(--r)',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--muted)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-head)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.35)';
            (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)';
          }}
        >
          Log out
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
