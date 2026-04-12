import React, { useEffect, useRef, useState } from "react";

interface StatItem {
    value: string;
    label: string;
}

interface FeaturePoint {
    icon: string;
    title: string;
    desc: string;
}

export interface FeatureHeroProps {
    badge?: string;
    accentColor?: string;
    headline: string | React.ReactNode;
    subheadline: string;

    // THE search bar — no duplicate below
    inputPlaceholder?: string;
    inputValue?: string;
    onInputChange?: (val: string) => void;
    ctaLabel?: string;
    onCtaClick?: () => void;
    ctaDisabled?: boolean;

    // Optional second input (keyword, domain, etc.)
    secondaryInputPlaceholder?: string;
    secondaryInputValue?: string;
    onSecondaryInputChange?: (val: string) => void;

    exampleValue?: string;
    exampleLabel?: string;
    tips?: string[];
    stats?: StatItem[];
    featurePoints?: FeaturePoint[];

    // When true, the hero hides itself — results take over
    hasResults?: boolean;

    // Extra form controls rendered inside the hero (dropdowns, toggles etc.)
    formExtras?: React.ReactNode;
}

function useCounter(target: string, active: boolean) {
    const [val, setVal] = useState("0");
    useEffect(() => {
        if (!active) return;
        const m = target.match(/[\d.]+/);
        if (!m) { setVal(target); return; }
        const n = parseFloat(m[0]);
        const suf = target.replace(m[0], "");
        const isF = target.includes(".");
        const STEPS = 36;
        let s = 0;
        const id = setInterval(() => {
            s++;
            const cur = Math.min((n / STEPS) * s, n);
            setVal((isF ? cur.toFixed(1) : Math.round(cur).toString()) + suf);
            if (s >= STEPS) clearInterval(id);
        }, 1100 / STEPS);
        return () => clearInterval(id);
    }, [target, active]);
    return val;
}

function StatCard({ value, label, active, accent }: StatItem & { active: boolean; accent: string }) {
    const disp = useCounter(value, active);
    return (
        <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            padding: "14px 20px",
            background: "var(--color-background-primary)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: 12,
            minWidth: 90,
            position: "relative", overflow: "hidden",
        }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent, opacity: 0.55 }} />
            <span style={{ fontSize: 22, fontWeight: 600, color: "var(--color-text-primary)", letterSpacing: "-0.5px", lineHeight: 1 }}>{disp}</span>
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)", textAlign: "center", lineHeight: 1.3 }}>{label}</span>
        </div>
    );
}

export function FeatureHero({
                                badge, accentColor = "#6366f1", headline, subheadline,
                                inputPlaceholder, inputValue = "", onInputChange,
                                ctaLabel, onCtaClick, ctaDisabled = false,
                                secondaryInputPlaceholder, secondaryInputValue = "", onSecondaryInputChange,
                                exampleValue, exampleLabel, tips, stats, featurePoints,
                                hasResults = false, formExtras,
                            }: FeatureHeroProps) {
    const [mounted, setMounted] = useState(false);
    const [inFocus, setInFocus] = useState(false);
    const [secFocus, setSecFocus] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

    if (hasResults) return null;

    return (
        <div style={{
            width: "100%",
            paddingBottom: 48,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 0.45s ease, transform 0.45s ease",
        }}>
            {/* HEADER */}
            <div style={{ textAlign: "center", padding: "56px 24px 36px", maxWidth: 700, margin: "0 auto" }}>
                {badge && (
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 7,
                        background: `${accentColor}14`, color: accentColor,
                        border: `1px solid ${accentColor}2e`, borderRadius: 100,
                        padding: "5px 14px", fontSize: 12, fontWeight: 500, marginBottom: 20, letterSpacing: "0.01em",
                    }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: accentColor, display: "inline-block" }} />
                        {badge}
                    </div>
                )}
                <h1 style={{
                    fontSize: "clamp(1.9rem, 4.5vw, 2.8rem)", fontWeight: 700, lineHeight: 1.15,
                    color: "var(--color-text-primary)", margin: "0 0 16px", letterSpacing: "-0.03em",
                }}>{headline}</h1>
                <p style={{
                    fontSize: 16, color: "var(--color-text-secondary)", lineHeight: 1.7,
                    margin: "0 0 36px", maxWidth: 520, marginLeft: "auto", marginRight: "auto",
                }}>{subheadline}</p>

                {/* SEARCH FORM — unified, no duplicate below */}
                <div style={{ maxWidth: 560, margin: "0 auto" }}>
                    {(inputPlaceholder || ctaLabel) && (
                        <div style={{
                            display: "flex", gap: 8, alignItems: "center",
                            background: "var(--color-background-primary)",
                            border: `1.5px solid ${inFocus ? accentColor : "var(--color-border-primary)"}`,
                            borderRadius: 14, padding: "7px 7px 7px 18px",
                            boxShadow: inFocus ? `0 0 0 3px ${accentColor}1a, 0 4px 20px ${accentColor}0d` : "0 2px 12px rgba(0,0,0,0.06)",
                            transition: "border-color 0.2s, box-shadow 0.2s",
                            marginBottom: (secondaryInputPlaceholder || formExtras) ? 10 : 0,
                        }}>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={inputPlaceholder}
                                value={inputValue}
                                onChange={(e) => onInputChange?.(e.target.value)}
                                onFocus={() => setInFocus(true)}
                                onBlur={() => setInFocus(false)}
                                onKeyDown={(e) => e.key === "Enter" && !ctaDisabled && onCtaClick?.()}
                                style={{
                                    flex: 1, border: "none", outline: "none", background: "transparent",
                                    fontSize: 15, color: "var(--color-text-primary)", minWidth: 0, lineHeight: 1.5,
                                }}
                            />
                            {ctaLabel && (
                                <button
                                    onClick={onCtaClick}
                                    disabled={ctaDisabled}
                                    style={{
                                        background: ctaDisabled ? "var(--color-border-secondary)" : accentColor,
                                        color: "#fff", border: "none", borderRadius: 10,
                                        padding: "10px 22px", fontSize: 14, fontWeight: 600,
                                        cursor: ctaDisabled ? "not-allowed" : "pointer",
                                        whiteSpace: "nowrap", letterSpacing: "-0.01em",
                                        opacity: ctaDisabled ? 0.5 : 1,
                                        transition: "background 0.2s, transform 0.1s, opacity 0.15s",
                                    }}
                                    onMouseEnter={(e) => { if (!ctaDisabled) (e.currentTarget.style.opacity = "0.87"); }}
                                    onMouseLeave={(e) => { e.currentTarget.style.opacity = ctaDisabled ? "0.5" : "1"; }}
                                    onMouseDown={(e) => { if (!ctaDisabled) e.currentTarget.style.transform = "scale(0.97)"; }}
                                    onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                                >{ctaLabel}</button>
                            )}
                        </div>
                    )}

                    {secondaryInputPlaceholder && (
                        <div style={{
                            display: "flex",
                            background: "var(--color-background-primary)",
                            border: `1.5px solid ${secFocus ? accentColor : "var(--color-border-primary)"}`,
                            borderRadius: 14, padding: "7px 7px 7px 18px",
                            boxShadow: secFocus ? `0 0 0 3px ${accentColor}1a` : "0 2px 8px rgba(0,0,0,0.04)",
                            transition: "border-color 0.2s, box-shadow 0.2s",
                            marginBottom: formExtras ? 10 : 0,
                        }}>
                            <input
                                type="text"
                                placeholder={secondaryInputPlaceholder}
                                value={secondaryInputValue}
                                onChange={(e) => onSecondaryInputChange?.(e.target.value)}
                                onFocus={() => setSecFocus(true)}
                                onBlur={() => setSecFocus(false)}
                                style={{
                                    flex: 1, border: "none", outline: "none", background: "transparent",
                                    fontSize: 15, color: "var(--color-text-primary)", minWidth: 0,
                                }}
                            />
                        </div>
                    )}

                    {/* Extra form controls inside hero (dropdowns, tone pickers, location) */}
                    {formExtras && <div style={{ marginTop: 4 }}>{formExtras}</div>}

                    {/* Example hint */}
                    {exampleValue && (
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            gap: 10, marginTop: 14, fontSize: 13, color: "var(--color-text-secondary)",
                        }}>
                            <span style={{ opacity: 0.5, fontSize: 12 }}>e.g.</span>
                            <code style={{
                                background: "var(--color-background-secondary)",
                                border: "0.5px solid var(--color-border-tertiary)",
                                borderRadius: 7, padding: "3px 10px", fontSize: 12,
                                color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)",
                            }}>{exampleValue}</code>
                            {exampleLabel && (
                                <button
                                    onClick={() => { onInputChange?.(exampleValue); setTimeout(() => inputRef.current?.focus(), 40); }}
                                    style={{
                                        background: "none", border: "none", color: accentColor,
                                        fontSize: 12, cursor: "pointer", padding: 0, fontWeight: 500,
                                    }}
                                >{exampleLabel} →</button>
                            )}
                        </div>
                    )}

                    {tips && tips.length > 0 && (
                        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                            {tips.map((tip, i) => (
                                <span key={i} style={{
                                    fontSize: 11, color: "var(--color-text-secondary)",
                                    background: "var(--color-background-secondary)",
                                    border: "0.5px solid var(--color-border-tertiary)",
                                    borderRadius: 6, padding: "3px 9px",
                                }}>{tip}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* STATS */}
            {stats && stats.length > 0 && (
                <div style={{
                    display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap",
                    padding: "0 24px 36px", maxWidth: 700, margin: "0 auto",
                }}>
                    {stats.map((s, i) => <StatCard key={i} {...s} active={mounted} accent={accentColor} />)}
                </div>
            )}

            {/* FEATURE GRID */}
            {featurePoints && featurePoints.length > 0 && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(195px, 1fr))",
                    gap: 10, maxWidth: 860, margin: "0 auto", padding: "0 24px",
                }}>
                    {featurePoints.map((fp, i) => (
                        <div key={i} style={{
                            background: "var(--color-background-primary)",
                            border: "0.5px solid var(--color-border-tertiary)",
                            borderRadius: 14, padding: "18px 18px 18px 20px",
                            position: "relative", overflow: "hidden",
                            opacity: mounted ? 1 : 0,
                            transform: mounted ? "translateY(0)" : "translateY(10px)",
                            transition: `opacity 0.4s ease ${i * 0.06 + 0.2}s, transform 0.4s ease ${i * 0.06 + 0.2}s`,
                        }}>
                            <div style={{
                                position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                                background: `linear-gradient(to bottom, ${accentColor}70, ${accentColor}15)`,
                                borderRadius: "14px 0 0 14px",
                            }} />
                            <div style={{ fontSize: 20, marginBottom: 9 }}>{fp.icon}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4, letterSpacing: "-0.01em" }}>{fp.title}</div>
                            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.55 }}>{fp.desc}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}