import React, { useMemo } from 'react';

interface JobVolumeChartProps {
  days?: number;
  /** `YYYY-MM-DD` → count (e.g. from `/api/admin/dashboard/charts`). */
  series?: Record<string, number>;
}

const JobVolumeChart: React.FC<JobVolumeChartProps> = ({ days = 30, series }) => {
  const data = useMemo(() => {
    if (series && Object.keys(series).length > 0) {
      const keys = Object.keys(series).sort();
      return keys.map((k) => ({ day: k, value: series[k] ?? 0 }));
    }
    const base = 280;
    return Array.from({ length: days }, (_, i) => ({
      day: String(i + 1),
      value: Math.floor(base + Math.sin(i * 0.4) * 80 + Math.random() * 60 + i * 2),
    }));
  }, [days, series]);

  const max = Math.max(1, ...data.map((d) => d.value));
  const weekCount = Math.max(1, Math.ceil(data.length / 7));
  const labels = Array.from({ length: weekCount }, (_, i) => `W${i + 1}`);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, padding: '0 2px' }}>
        {data.map((d, i) => (
          <div
            key={i}
            title={`${d.day}: ${d.value}`}
            style={{
              flex: 1,
              height: `${(d.value / max) * 100}%`,
              minHeight: d.value > 0 ? 2 : 0,
              borderRadius: '3px 3px 0 0',
              background: `linear-gradient(to top, var(--accent), var(--accent2))`,
              opacity: 0.75,
              transition: 'opacity 0.15s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.75'; }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '6px 2px 0' }}>
        {labels.map((l, i) => (
          <div key={i} style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textAlign: 'center' }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobVolumeChart;
