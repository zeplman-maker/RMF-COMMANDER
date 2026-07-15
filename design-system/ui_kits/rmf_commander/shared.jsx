/* global React */
const { useState, useMemo, useEffect } = React;

/* ===================================================
   ICON — inline Lucide-style 1.5px strokes
   currentColor; size prop sets w/h.
   =================================================== */
function Icon({ name, size = 16, className = "" }) {
  const s = size;
  const paths = ICONS[name] || ICONS["square"];
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.5"
         strokeLinecap="round" strokeLinejoin="round"
         className={className} aria-hidden="true">
      {paths}
    </svg>
  );
}

const ICONS = {
  square: <rect x="3" y="3" width="18" height="18" rx="2"/>,
  "shield-check": <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></>,
  "shield-alert": <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4M12 16h.01"/></>,
  clipboard: <><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/></>,
  bug: <><path d="M21 10.5h-1.5a8.5 8.5 0 0 0-17 0H1m20 3h-1.5a8.5 8.5 0 0 1-17 0H1"/><path d="M12 2v20"/></>,
  sparkles: <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  "key-round": <><circle cx="9" cy="11" r="3"/><path d="M21 13h-7m4-3 3 3-3 3"/></>,
  "lock-keyhole": <><path d="M15 12V8a3 3 0 0 0-6 0v4"/><rect x="7" y="12" width="10" height="8" rx="1.5"/></>,
  "id-card": <><rect x="2" y="6" width="20" height="14" rx="2"/><circle cx="9" cy="13" r="2.5"/><path d="M14 12h5M14 16h3"/></>,
  layout: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8m8 4H8m3-8H8"/></>,
  presentation: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 17v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2M12 17v4"/></>,
  scroll: <><path d="M19 17V5a2 2 0 0 0-2-2H5"/><path d="M3 21h15a2 2 0 0 0 2-2v-2H6a2 2 0 0 0-2 2v2"/><path d="M3 21h-1V5a2 2 0 0 1 2-2h11"/></>,
  "alert-triangle": <><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></>,
  "alert-circle": <><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></>,
  check: <path d="M20 6 9 17l-5-5"/>,
  x: <><path d="M18 6 6 18M6 6l12 12"/></>,
  "chevron-right": <path d="m9 6 6 6-6 6"/>,
  "chevron-down": <path d="m6 9 6 6 6-6"/>,
  "chevron-left": <path d="m15 18-6-6 6-6"/>,
  "arrow-up-right": <path d="M7 17 17 7M7 7h10v10"/>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></>,
  filter: <path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></>,
  "cloud-cog": <><path d="M17.5 19a4.5 4.5 0 1 0-3-7.9 6 6 0 1 0-10.5 2.4"/><circle cx="17" cy="14" r="2"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 14 0v1"/></>,
  "more-horizontal": <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  command: <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>,
  "external-link": <><path d="M15 3h6v6M14 10l7-7M10 14H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/></>,
};

/* ===================================================
   BUTTON
   =================================================== */
function Button({ children, variant = "primary", size = "md", icon, iconRight, onClick, disabled, type = "button", className = "" }) {
  const base = "rmf-btn rmf-btn-" + variant + " rmf-btn-" + size;
  return (
    <button type={type} className={base + " " + className}
            onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={size === "sm" ? 13 : 14} />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 13 : 14} />}
    </button>
  );
}

/* ===================================================
   BADGE / PILL / SEVERITY TAG / AI LABEL
   =================================================== */
function Badge({ tone = "neutral", children, dot = true }) {
  return (
    <span className={"rmf-badge rmf-badge-" + tone + (dot ? "" : " rmf-badge-nodot")}>
      {children}
    </span>
  );
}

function SeverityTag({ cat }) {
  const map = { 1: "rmf-sev-cat1", 2: "rmf-sev-cat2", 3: "rmf-sev-cat3" };
  return <span className={"rmf-sev " + (map[cat] || "")}>CAT {romanCat(cat)}</span>;
}
function romanCat(c) { return c === 1 ? "I" : c === 2 ? "II" : "III"; }

function AiLabel() {
  return (
    <span className="rmf-ailabel">
      <Icon name="sparkles" size={10} />
      AI-DRAFTED
    </span>
  );
}

function Chip({ children }) { return <span className="rmf-chip">{children}</span>; }

/* ===================================================
   CARD
   =================================================== */
function Card({ children, className = "", active = false, padding = 16, style = {} }) {
  return (
    <div className={"rmf-card " + (active ? "rmf-card-active " : "") + className}
         style={{ padding, ...style }}>
      {children}
    </div>
  );
}

/* ===================================================
   KPI — stat-pair primitive
   =================================================== */
function Kpi({ value, label, tone = "default", trend }) {
  return (
    <div className={"rmf-kpi rmf-kpi-" + tone}>
      <div className="rmf-kpi-val">{value}</div>
      <div className="rmf-kpi-lab">{label}</div>
      {trend && <div className="rmf-kpi-trend">{trend}</div>}
    </div>
  );
}

/* Expose to window for cross-script use */
Object.assign(window, { Icon, Button, Badge, Chip, SeverityTag, AiLabel, Card, Kpi });
