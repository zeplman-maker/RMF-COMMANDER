/* global React */
const { useState, useEffect } = React;

/* ===================================================
   SHARED: Mobile Icon (Lucide 1.5px inline)
   =================================================== */
const M_ICONS = {
  "shield-check":  <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></>,
  "shield-alert":  <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4M12 16h.01"/></>,
  "shield":        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>,
  sparkles:        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>,
  bell:            <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  search:          <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  layout:          <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>,
  presentation:    <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 17v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2M12 17v4"/></>,
  clipboard:       <><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/></>,
  "alert-triangle":<><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></>,
  "alert-circle":  <><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></>,
  check:           <path d="M20 6 9 17l-5-5"/>,
  "check-circle":  <><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></>,
  x:               <><path d="M18 6 6 18M6 6l12 12"/></>,
  "chevron-right": <path d="m9 6 6 6-6 6"/>,
  "chevron-left":  <path d="m15 18-6-6 6-6"/>,
  "chevron-down":  <path d="m6 9 6 6 6-6"/>,
  "more-horizontal": <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  "key-round":     <><circle cx="9" cy="11" r="3"/><path d="M21 13h-7m4-3 3 3-3 3"/></>,
  "lock-keyhole":  <><path d="M15 12V8a3 3 0 0 0-6 0v4"/><rect x="7" y="12" width="10" height="8" rx="1.5"/></>,
  "id-card":       <><rect x="2" y="6" width="20" height="14" rx="2"/><circle cx="9" cy="13" r="2.5"/><path d="M14 12h5M14 16h3"/></>,
  user:            <><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 14 0v1"/></>,
  "cloud-cog":     <><path d="M17.5 19a4.5 4.5 0 1 0-3-7.9 6 6 0 1 0-10.5 2.4"/><circle cx="17" cy="14" r="2"/></>,
  "smartphone":    <><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></>,
  filter:          <path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>,
  refresh:         <><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></>,
  "log-out":       <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
  "file-text":     <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8m8 4H8m3-8H8"/></>,
  scroll:          <><path d="M19 17V5a2 2 0 0 0-2-2H5"/><path d="M3 21h15a2 2 0 0 0 2-2v-2H6a2 2 0 0 0-2 2v2"/><path d="M3 21h-1V5a2 2 0 0 1 2-2h11"/></>,
  download:        <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></>,
  eye:             <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
  "arrow-right":   <path d="M5 12h14M13 5l7 7-7 7"/>,
  "globe":         <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
  "info":          <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>,
};
function MIcon({ name, size = 18, color, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color || "currentColor"} strokeWidth="1.5"
         strokeLinecap="round" strokeLinejoin="round"
         className={className} aria-hidden="true">
      {M_ICONS[name] || M_ICONS.shield}
    </svg>
  );
}

function MMonogram({ size = 36, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <path d="M32 4 L56 18 L56 46 L32 60 L8 46 L8 18 Z"
            fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M32 12 L49 22 L49 42 L32 52 L15 42 L15 22 Z"
            fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.35" strokeLinejoin="round"/>
      <text x="32" y="42" textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace" fontSize="24" fontWeight="700"
            fill={color}>R</text>
    </svg>
  );
}

/* ===================================================
   CLASSIFICATION BANNERS (top + bottom of every app screen)
   =================================================== */
function MBannerTop() { return <div className="m-class-banner">UNCLASSIFIED // FOR OFFICIAL USE ONLY</div>; }
function MBannerBottom() { return <div className="m-class-banner-bottom">UNCLASSIFIED // FOR OFFICIAL USE ONLY</div>; }

/* ===================================================
   APP HEADER (title row)
   =================================================== */
function MHeader({ eyebrow, title, leftIcon, leftOnClick, rightIcons = [] }) {
  return (
    <header className="m-header">
      {leftIcon && (
        <button className="m-header-action" onClick={leftOnClick} aria-label="back">
          <MIcon name={leftIcon} size={18}/>
        </button>
      )}
      <div className="m-header-title">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <div className="h">{title}</div>
      </div>
      {rightIcons.map((r, i) => (
        <button key={i} className={"m-header-action" + (r.dot ? " relative" : "")} onClick={r.onClick} aria-label={r.name}>
          <MIcon name={r.name} size={18}/>
          {r.dot && <span className="dot-count"/>}
        </button>
      ))}
    </header>
  );
}

/* ===================================================
   BOTTOM TAB BAR
   =================================================== */
function MTabBar({ current, onNav }) {
  const tabs = [
    { id: "home",     l: "Portfolio",  ic: "layout" },
    { id: "alerts",   l: "Alerts",     ic: "bell",      count: 7 },
    { id: "ai",       l: "AI Drafts",  ic: "sparkles",  count: 3 },
    { id: "briefing", l: "Briefings",  ic: "presentation" },
    { id: "more",     l: "More",       ic: "user" },
  ];
  return (
    <nav className="m-tabbar">
      {tabs.map(t => (
        <button key={t.id}
                className={"m-tab" + (current === t.id ? " active" : "")}
                onClick={() => onNav(t.id)}>
          <MIcon name={t.ic} size={20}/>
          <span>{t.l}</span>
          {t.count != null && <span className="count">{t.count}</span>}
        </button>
      ))}
    </nav>
  );
}

Object.assign(window, { MIcon, MMonogram, MBannerTop, MBannerBottom, MHeader, MTabBar });
