import React, { CSSProperties, ReactNode } from 'react';
import type { BadgeColor, StatCard } from '../../types';

// ── Badge ──────────────────────────────────────────────
const BADGE_STYLES: Record<BadgeColor, CSSProperties> = {
  green:  { background: 'rgba(52,211,153,0.12)',  color: 'var(--green)',   border: '1px solid rgba(52,211,153,0.25)' },
  amber:  { background: 'rgba(251,191,36,0.12)',  color: 'var(--amber)',   border: '1px solid rgba(251,191,36,0.25)' },
  red:    { background: 'rgba(248,113,113,0.12)', color: 'var(--red)',     border: '1px solid rgba(248,113,113,0.25)' },
  blue:   { background: 'rgba(91,127,255,0.12)',  color: 'var(--accent)',  border: '1px solid rgba(91,127,255,0.25)' },
  purple: { background: 'rgba(167,139,250,0.12)', color: 'var(--accent2)', border: '1px solid rgba(167,139,250,0.25)' },
  teal:   { background: 'rgba(45,212,191,0.12)',  color: 'var(--teal)',    border: '1px solid rgba(45,212,191,0.25)' },
  gray:   { background: 'rgba(122,130,153,0.12)', color: 'var(--muted)',   border: '1px solid rgba(122,130,153,0.2)' },
  pink:   { background: 'rgba(244,114,182,0.12)', color: 'var(--pink)',    border: '1px solid rgba(244,114,182,0.25)' },
};

interface BadgeProps {
  color?: BadgeColor;
  children: ReactNode;
  style?: CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ color = 'gray', children, style }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', borderRadius: 20,
    fontFamily: 'var(--font-mono)', fontSize: 10,
    fontWeight: 500, letterSpacing: '0.3px', whiteSpace: 'nowrap',
    ...BADGE_STYLES[color],
    ...style,
  }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0, display: 'inline-block' }} />
    {children}
  </span>
);

// ── Button ─────────────────────────────────────────────
interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  onClick?: () => void;
  style?: CSSProperties;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children, variant = 'ghost', size = 'md', onClick, style, type = 'button', disabled,
}) => {
  const base: CSSProperties = {
    padding: size === 'sm' ? '4px 10px' : '6px 14px',
    borderRadius: 'var(--r)',
    fontSize: size === 'sm' ? 11 : 12,
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    fontFamily: 'var(--font-body)', transition: 'all 0.15s',
    display: 'inline-flex', alignItems: 'center', gap: 4,
  };
  const variants: Record<string, CSSProperties> = {
    primary: { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' },
    ghost:   { background: 'var(--card)',   color: 'var(--text)', border: '1px solid var(--border)' },
    danger:  { background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)' },
  };
  return (
    <button type={type} onClick={disabled ? undefined : onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
};

// ── Card ───────────────────────────────────────────────
interface CardProps { children: ReactNode; style?: CSSProperties; }
export const Card: React.FC<CardProps> = ({ children, style }) => (
  <div style={{
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)', overflow: 'hidden', ...style,
  }}>
    {children}
  </div>
);

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}
export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, children }) => (
  <div style={{
    padding: '14px 18px 13px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 10,
  }}>
    <span style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.1px' }}>
      {title}
    </span>
    {subtitle && (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>
        {subtitle}
      </span>
    )}
    {children}
  </div>
);

interface CardBodyProps { children: ReactNode; style?: CSSProperties; }
export const CardBody: React.FC<CardBodyProps> = ({ children, style }) => (
  <div style={{ padding: '16px 18px', ...style }}>{children}</div>
);

// ── Stats Grid ─────────────────────────────────────────
interface StatsGridProps { stats: StatCard[]; }
export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
    {stats.map((s, i) => (
      <div key={i} style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: '18px 20px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: s.color || 'var(--accent)' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
          {s.label}
        </div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-1px', lineHeight: 1, marginBottom: 6 }}>
          {s.value}
        </div>
        {s.delta && (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4,
            color: s.deltaDir === 'up' ? 'var(--green)' : s.deltaDir === 'down' ? 'var(--red)' : 'var(--muted)',
          }}>
            {s.delta}
          </div>
        )}
      </div>
    ))}
  </div>
);

// ── Grid ───────────────────────────────────────────────
interface GridProps { children: ReactNode; cols?: string; style?: CSSProperties; }
export const Grid: React.FC<GridProps> = ({ children, cols = '1fr 1fr', style }) => (
  <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 14, marginBottom: 14, ...style }}>
    {children}
  </div>
);

// ── Table ──────────────────────────────────────────────
interface TableProps<T> {
  cols: string[];
  rows: T[];
  renderRow: (row: T, index: number) => ReactNode;
  getRowProps?: (row: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
}
export function Table<T>({ cols, rows, renderRow, getRowProps }: TableProps<T>) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            {cols.map((c) => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} {...(getRowProps?.(row, i) ?? {})}>{renderRow(row, i)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface TdProps {
  children?: ReactNode;
  mono?: boolean;
  muted?: boolean;
  style?: CSSProperties;
  title?: string;
}
export const Td: React.FC<TdProps> = ({ children, mono, muted, style, title }) => (
  <td
    title={title}
    style={{
      fontFamily: mono ? 'var(--font-mono)' : undefined,
      fontSize: mono ? 11 : undefined,
      color: muted ? 'var(--muted)' : undefined,
      ...style,
    }}
  >
    {children}
  </td>
);

// ── Pagination ─────────────────────────────────────────
interface PaginationProps { info: string; pages: (number | string)[]; }
export const Pagination: React.FC<PaginationProps> = ({ info, pages }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 16px', borderTop: '1px solid var(--border)', justifyContent: 'flex-end' }}>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginRight: 'auto' }}>{info}</span>
    {pages.map((p, i) => (
      <div key={i} style={{
        width: 28, height: 28, borderRadius: 6,
        background: i === 0 ? 'var(--accent)' : 'var(--surface)',
        border: `1px solid ${i === 0 ? 'var(--accent)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color: i === 0 ? '#fff' : 'var(--muted)', cursor: 'pointer',
      }}>
        {p}
      </div>
    ))}
  </div>
);

// ── Filters Bar ────────────────────────────────────────
interface FiltersBarProps { children: ReactNode; }
export const FiltersBar: React.FC<FiltersBarProps> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
    {children}
  </div>
);

interface FilterInputProps {
  placeholder?: string;
  style?: CSSProperties;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}
export const FilterInput: React.FC<FilterInputProps> = ({ placeholder, style, value, onChange, onKeyDown }) => (
  <input
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onKeyDown={onKeyDown}
    style={{
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--r)', padding: '6px 10px', color: 'var(--text)',
    fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', width: 200, ...style,
  }} />
);

interface FilterSelectProps {
  options: string[];
  style?: CSSProperties;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}
export const FilterSelect: React.FC<FilterSelectProps> = ({ options, style, value, onChange }) => (
  <select
    value={value}
    onChange={onChange}
    style={{
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--r)', padding: '6px 10px', color: 'var(--text)',
    fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer', ...style,
  }}>
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>
);

// ── Section Header ─────────────────────────────────────
interface SectionHeaderProps { title: string; subtitle?: string; children?: ReactNode; }
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
    <div>
      <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)' }}>
        {title}
      </h1>
      {subtitle && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</p>}
    </div>
    {children && <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>{children}</div>}
  </div>
);

// ── Metric Row ─────────────────────────────────────────
interface MetricRowProps {
  name: string;
  value: ReactNode;
  pct?: number;
  color?: string;
  isLast?: boolean;
}
export const MetricRow: React.FC<MetricRowProps> = ({ name, value, pct, color, isLast }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
    <span style={{ fontSize: '12.5px', color: 'var(--text)', flex: 1 }}>{name}</span>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', minWidth: 60, textAlign: 'right' }}>{value}</span>
    {pct !== undefined && (
      <div style={{ width: 80 }}>
        <div style={{ background: 'var(--surface)', borderRadius: 20, height: 5, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 20, background: color || 'var(--accent)', transition: 'width 0.5s' }} />
        </div>
      </div>
    )}
  </div>
);

// ── Progress Bar ───────────────────────────────────────
interface ProgressBarProps { pct: number; color?: string; width?: number; }
export const ProgressBar: React.FC<ProgressBarProps> = ({ pct, color = 'var(--accent)', width }) => (
  <div style={{ background: 'var(--surface)', borderRadius: 20, height: 5, overflow: 'hidden', width: width || '100%' }}>
    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 20, background: color, transition: 'width 0.5s' }} />
  </div>
);

// ── User Avatar ────────────────────────────────────────
interface UserAvatarProps { initials: string; gradA: string; gradB: string; }
export const UserAvatar: React.FC<UserAvatarProps> = ({ initials, gradA, gradB }) => (
  <div style={{
    width: 28, height: 28, borderRadius: '50%',
    background: `linear-gradient(135deg, ${gradA}, ${gradB})`,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
  }}>
    {initials}
  </div>
);

// ── Notice ─────────────────────────────────────────────
interface NoticeProps { type?: 'info' | 'warn'; children: ReactNode; }
export const Notice: React.FC<NoticeProps> = ({ type = 'info', children }) => {
  const styles: Record<string, CSSProperties> = {
    info: { background: 'rgba(91,127,255,0.08)', border: '1px solid rgba(91,127,255,0.2)', color: 'var(--accent)' },
    warn: { background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: 'var(--amber)' },
  };
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 'var(--r)', fontSize: '12.5px', marginBottom: 16, ...styles[type] }}>
      {children}
    </div>
  );
};
