import React, { useEffect, useState } from "react";

interface StatItem {
  value: string;
  label: string;
}

interface FeaturePoint {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

export interface FeatureHeroProps {
  badge?: string;
  headline: string;
  subheadline: string;
  gradient?: string;
  accentColor?: string;
  stats?: StatItem[];
  featurePoints?: FeaturePoint[];
  inputPlaceholder?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  inputValue?: string;
  onInputChange?: (val: string) => void;
  illustration?: React.ReactNode;
  exampleValue?: string;
  exampleLabel?: string;
  ctaDisabled?: boolean;
}

function AnimatedStat({ value, label }: StatItem) {
  const [displayed, setDisplayed] = useState("0");

  useEffect(() => {
    const numericMatch = value.match(/[\d.]+/);
    if (!numericMatch) {
      setDisplayed(value);
      return;
    }
    const target = parseFloat(numericMatch[0]);
    const suffix = value.replace(numericMatch[0], "");
    const duration = 1200;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, target);
      const isFloat = target % 1 !== 0;
      setDisplayed(
        (isFloat ? current.toFixed(1) : Math.round(current).toString()) + suffix
      );
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div
      style={{
        textAlign: "center",
        padding: "1rem 1.5rem",
        background: "var(--color-background-primary)",
        borderRadius: "var(--border-radius-lg)",
        border: "0.5px solid var(--color-border-tertiary)",
        minWidth: 100,
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 500,
          color: "var(--color-text-primary)",
          letterSpacing: "-0.5px",
        }}
      >
        {displayed}
      </div>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

export function FeatureHero({
  badge,
  headline,
  subheadline,
  stats,
  featurePoints,
  inputPlaceholder,
  ctaLabel,
  onCtaClick,
  inputValue,
  onInputChange,
  illustration,
  exampleValue,
  exampleLabel,
  accentColor = "#6366f1",
  ctaDisabled = false,
}: FeatureHeroProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const showActionRow = Boolean(inputPlaceholder || ctaLabel);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "3rem 1.5rem 2rem",
          maxWidth: 680,
          margin: "0 auto",
        }}
      >
        {badge && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: `${accentColor}18`,
              color: accentColor,
              border: `1px solid ${accentColor}35`,
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 500,
              marginBottom: "1.25rem",
              letterSpacing: "0.01em",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: accentColor,
                display: "inline-block",
              }}
            />
            {badge}
          </div>
        )}

        <h1
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 500,
            lineHeight: 1.2,
            color: "var(--color-text-primary)",
            margin: "0 0 1rem",
            letterSpacing: "-0.02em",
          }}
        >
          {headline}
        </h1>

        <p
          style={{
            fontSize: 16,
            color: "var(--color-text-secondary)",
            lineHeight: 1.7,
            margin: "0 0 2rem",
            maxWidth: 520,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {subheadline}
        </p>

        {showActionRow && (
          <div
            style={{
              display: "flex",
              gap: 8,
              maxWidth: 520,
              margin: "0 auto 1.25rem",
              background: "var(--color-background-primary)",
              border: `1.5px solid ${focused ? accentColor : "var(--color-border-secondary)"}`,
              borderRadius: "var(--border-radius-lg)",
              padding: "6px 6px 6px 14px",
              transition: "border-color 0.2s ease",
              boxShadow: focused ? `0 0 0 3px ${accentColor}18` : "none",
            }}
          >
            {inputPlaceholder && (
              <input
                type="text"
                placeholder={inputPlaceholder}
                value={inputValue ?? ""}
                onChange={(e) => onInputChange?.(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                disabled={ctaDisabled}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 15,
                  color: "var(--color-text-primary)",
                  minWidth: 0,
                }}
              />
            )}
            {ctaLabel && (
              <button
                type="button"
                onClick={onCtaClick}
                disabled={ctaDisabled}
                style={{
                  background: accentColor,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: ctaDisabled ? "not-allowed" : "pointer",
                  opacity: ctaDisabled ? 0.55 : 1,
                  whiteSpace: "nowrap",
                  transition: "opacity 0.15s ease, transform 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  if (!ctaDisabled) (e.target as HTMLButtonElement).style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.opacity = ctaDisabled ? "0.55" : "1";
                }}
                onMouseDown={(e) => {
                  if (!ctaDisabled) (e.target as HTMLButtonElement).style.transform = "scale(0.97)";
                }}
                onMouseUp={(e) => {
                  (e.target as HTMLButtonElement).style.transform = "scale(1)";
                }}
              >
                {ctaLabel}
              </button>
            )}
          </div>
        )}

        {exampleValue && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: 13,
            }}
          >
            <span
              style={{
                background: "var(--color-background-secondary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: 8,
                padding: "4px 10px",
                color: "var(--color-text-secondary)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
              }}
            >
              {exampleValue}
            </span>
            {exampleLabel && (
              <button
                type="button"
                disabled={ctaDisabled}
                onClick={() => {
                  onInputChange?.(exampleValue);
                  onCtaClick?.();
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: accentColor,
                  fontSize: 13,
                  cursor: ctaDisabled ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-sans)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  opacity: ctaDisabled ? 0.5 : 1,
                }}
              >
                {exampleLabel} →
              </button>
            )}
          </div>
        )}
      </div>

      {stats && stats.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            padding: "0 1rem 2rem",
            maxWidth: 680,
            margin: "0 auto",
          }}
        >
          {stats.map((s, i) => (
            <AnimatedStat key={i} value={s.value} label={s.label} />
          ))}
        </div>
      )}

      {featurePoints && featurePoints.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            padding: "0 1rem 2rem",
            maxWidth: 760,
            margin: "0 auto",
          }}
        >
          {featurePoints.map((fp, i) => (
            <div
              key={i}
              style={{
                background: "var(--color-background-secondary)",
                borderRadius: "var(--border-radius-lg)",
                border: "0.5px solid var(--color-border-tertiary)",
                padding: "1rem 1.1rem",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(12px)",
                transition: `opacity 0.4s ease ${i * 0.07 + 0.2}s, transform 0.4s ease ${i * 0.07 + 0.2}s`,
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>{fp.icon}</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                  marginBottom: 4,
                }}
              >
                {fp.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                {fp.desc}
              </div>
            </div>
          ))}
        </div>
      )}

      {illustration && (
        <div style={{ maxWidth: 760, margin: "0 auto 2rem", padding: "0 1rem" }}>{illustration}</div>
      )}

      <div
        style={{
          borderTop: "0.5px solid var(--color-border-tertiary)",
          maxWidth: 760,
          margin: "0 auto",
        }}
      />
    </div>
  );
}
