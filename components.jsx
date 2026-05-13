/* ============================================
   랭크파이브 — 공유 컴포넌트
   ============================================ */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---------- 아이콘 (인라인 SVG) ---------- */
const Icon = ({ name, size = 18, stroke = 1.6, ...rest }) => {
  const s = stroke;
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    spark:  <><path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4"/></>,
    bolt:   <><path d="M13 2 4.5 13.5h6L10 22l8.5-11.5h-6L13 2Z"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>,
    chart:  <><path d="M3 21h18"/><path d="M6 17V10"/><path d="M11 17V6"/><path d="M16 17v-8"/><path d="M21 17v-4"/></>,
    map:    <><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></>,
    shield: <><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></>,
    user:   <><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></>,
    lock:   <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
    mail:   <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    star:   <><path d="m12 3 2.6 5.7 6.2.6-4.7 4.3 1.4 6.2L12 16.8 6.5 19.8l1.4-6.2L3.2 9.3l6.2-.6L12 3Z"/></>,
    starF:  <><path d="m12 3 2.6 5.7 6.2.6-4.7 4.3 1.4 6.2L12 16.8 6.5 19.8l1.4-6.2L3.2 9.3l6.2-.6L12 3Z" fill="currentColor"/></>,
    check:  <><path d="m4.5 12.5 5 5 10-11"/></>,
    checkC: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
    x:      <><path d="m6 6 12 12M18 6 6 18"/></>,
    arrowR: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    arrowU: <><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/></>,
    arrowD: <><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></>,
    plus:   <><path d="M12 5v14M5 12h14"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06A2 2 0 1 1 4.13 16.92l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 7.08 4.13l.06.06a1.7 1.7 0 0 0 1.87.34h.04a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.04a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.03Z"/></>,
    folder: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></>,
    bookmark: <><path d="M6 3h12v18l-6-4-6 4V3Z"/></>,
    download: <><path d="M12 3v12"/><path d="m6 9 6 6 6-6"/><path d="M5 21h14"/></>,
    share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9Z"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
    eye:  <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff: <><path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0 1 22 12s-1.4 2.7-4.1 4.6"/><path d="M6.7 6.7C3.7 8.3 2 12 2 12s3.5 7 10 7c2 0 3.7-.6 5.2-1.5"/><path d="M9.5 9.5A3 3 0 0 0 12 15a3 3 0 0 0 2.5-1.4"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></>,
    refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="0.5" fill="currentColor"/><circle cx="4" cy="12" r="0.5" fill="currentColor"/><circle cx="4" cy="18" r="0.5" fill="currentColor"/></>,
    crown: <><path d="m3 7 4 4 5-7 5 7 4-4-2 12H5L3 7Z"/></>,
    flame: <><path d="M12 22c5 0 8-3.5 8-8 0-3-2-5-3-7-1 2-3 3-3 1-1-3-2-5-4-6-1 4-4 6-4 11 0 5 2 9 6 9Z"/></>,
    trend: <><path d="M3 17 9 11l4 4 8-9"/><path d="M14 6h7v7"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></>,
    link: <><path d="M10 14a4 4 0 0 1 0-5.7l3-3a4 4 0 1 1 5.7 5.7l-1.5 1.5"/><path d="M14 10a4 4 0 0 1 0 5.7l-3 3a4 4 0 1 1-5.7-5.7l1.5-1.5"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></>,
    kakao: <><path d="M12 4C7 4 3 7.4 3 11.5c0 2.6 1.6 4.8 4 6.1l-1 4 4.5-3c.5 0 1 .1 1.5.1 5 0 9-3.4 9-7.6S17 4 12 4Z" fill="currentColor"/></>,
    naverN: <><rect x="3" y="3" width="18" height="18" rx="3.5" fill="currentColor"/><path d="M9 8v8M15 16V8M9 8l6 8" stroke="white" strokeWidth="2.4" fill="none"/></>,
    google: <><path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4c-.2 1.3-1 2.4-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.6Z" fill="#4285F4"/><path d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3v2.6C4.7 19.7 8.1 22 12 22Z" fill="#34A853"/><path d="M6.4 13.9c-.2-.6-.3-1.3-.3-1.9s.1-1.3.3-1.9V7.5H3a10 10 0 0 0 0 9l3.4-2.6Z" fill="#FBBC05"/><path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3 14.7 2 12 2 8.1 2 4.7 4.3 3 7.5l3.4 2.6C7.2 7.7 9.4 6 12 6Z" fill="#EA4335"/></>,
    chevron: <><path d="m9 6 6 6-6 6"/></>,
    chevronD: <><path d="m6 9 6 6 6-6"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    play: <><path d="M6 4v16l14-8L6 4Z" fill="currentColor"/></>,
    pause: <><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></>,
    dot: <><circle cx="12" cy="12" r="3.5" fill="currentColor"/></>,
    filter: <><path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z"/></>,
    medal: <><circle cx="12" cy="14" r="6"/><path d="m8 4 4 6 4-6"/><path d="M9 14h6M12 11v6"/></>,
    sparkle: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {paths[name] || null}
    </svg>
  );
};

/* ---------- 로고 ---------- */
const Logo = ({ size = 26, color = "var(--green-500)", wordmark = true }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.28,
      background: color,
      display: "grid", placeItems: "center",
      boxShadow: `0 2px 8px ${color}40`,
      position: "relative",
    }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <path d="M12 3 14.2 8.6 20.2 9.1 15.6 13l1.5 5.9L12 15.7 6.9 18.9 8.4 13 3.8 9.1l6-.5L12 3Z"
              fill="white"/>
      </svg>
    </div>
    {wordmark && (
      <span style={{
        fontSize: size * 0.62, fontWeight: 800, letterSpacing: "-0.04em",
        color: "var(--ink-900)",
      }}>
        랭크<span style={{ color: color }}>파이브</span>
      </span>
    )}
  </div>
);

/* ---------- 작은 헬퍼들 ---------- */
const Avatar = ({ name = "김민지", size = 32, bg }) => {
  const initial = (name || "?").slice(0, 1);
  const colors = ["#03C75A", "#4F6BED", "#F4A52B", "#EF5C5C", "#0EAEA0"];
  const seed = (name || "").charCodeAt(0) % colors.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg || colors[seed],
      color: "white", display: "grid", placeItems: "center",
      fontWeight: 700, fontSize: size * 0.42, letterSpacing: 0,
      flexShrink: 0,
    }}>{initial}</div>
  );
};

const Tag = ({ children, tone = "gray", icon, size = "sm" }) => {
  const tones = {
    green:  { bg: "var(--green-50)",  fg: "var(--green-700)" },
    gray:   { bg: "var(--ink-100)",   fg: "var(--ink-700)" },
    warn:   { bg: "#FFF4DA",          fg: "#92660B" },
    danger: { bg: "#FFE9E9",          fg: "#B43232" },
    info:   { bg: "#E8EFFF",          fg: "#2952C5" },
    dark:   { bg: "var(--ink-900)",   fg: "white" },
    outline:{ bg: "transparent",      fg: "var(--ink-700)", border: "1px solid var(--border)" },
  };
  const t = tones[tone] || tones.gray;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: size === "lg" ? "5px 10px" : "3px 8px",
      borderRadius: 999,
      fontSize: size === "lg" ? 13 : 11.5,
      fontWeight: 600,
      background: t.bg, color: t.fg,
      border: t.border || "0",
      whiteSpace: "nowrap",
      letterSpacing: "-0.005em",
    }}>
      {icon && <Icon name={icon} size={size === "lg" ? 13 : 11} stroke={2}/>}
      {children}
    </span>
  );
};

/* ---------- 그리드 배경 (랜딩용) ---------- */
const DotsBg = ({ opacity = 0.5, color = "#9CA3AF" }) => (
  <div aria-hidden style={{
    position: "absolute", inset: 0, zIndex: 0,
    backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
    backgroundSize: "22px 22px",
    opacity,
    maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
    WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
  }}/>
);

/* ---------- 미니 막대그래프 (랭킹 분포) ---------- */
const SparkBars = ({ data, color = "var(--green-500)", h = 28 }) => {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: h }}>
      {data.map((v, i) => (
        <div key={i} style={{
          width: 6, height: `${(v / max) * 100}%`,
          background: color, borderRadius: 2, opacity: 0.4 + (v / max) * 0.6,
        }}/>
      ))}
    </div>
  );
};

/* ---------- 도넛 게이지 (대시보드용) ---------- */
const Donut = ({ value = 70, size = 88, stroke = 10, color = "var(--green-500)", label }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--ink-150)" strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke}
                strokeLinecap="round" fill="none"
                strokeDasharray={c} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}/>
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "grid", placeItems: "center",
        fontSize: size * 0.22, fontWeight: 800, color: "var(--ink-900)",
        letterSpacing: "-0.03em", flexDirection: "column",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
          <div>{value}{label && <span style={{ fontSize: size * 0.13, marginLeft: 1 }}>{label}</span>}</div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Skeleton ---------- */
const Skeleton = ({ w, h = 16, r = 6, style }) => (
  <div style={{
    width: w, height: h, borderRadius: r,
    background: "linear-gradient(90deg, #EEF1F4 0%, #F6F8FA 50%, #EEF1F4 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s linear infinite",
    ...style,
  }}/>
);

/* ---------- 글로벌 노출 ---------- */
Object.assign(window, {
  Icon, Logo, Avatar, Tag, DotsBg, SparkBars, Donut, Skeleton,
});
