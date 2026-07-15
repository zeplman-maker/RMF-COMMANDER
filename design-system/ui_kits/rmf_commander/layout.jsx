/* global React */
const { useState, useEffect, useRef } = React;

/* ===================================================
   CLASSIFICATION BANNER
   =================================================== */
function ClassBanner() {
  return <div className="rmf-class-banner">UNCLASSIFIED // FOR OFFICIAL USE ONLY</div>;
}

/* ===================================================
   TOP BAR
   =================================================== */
function TopBar({ user, onOpenPalette, onLogout, sessionMin }) {
  return (
    <header className="rmf-topbar">
      <div className="rmf-topbar-brand">
        <Monogram size={28} color="var(--cyan-400)" />
        <div className="word">
          <div className="top">RMF</div>
          <div className="bot">COMMANDER</div>
        </div>
      </div>

      <div className="rmf-topbar-sep"></div>

      <button className="rmf-topbar-search" onClick={onOpenPalette} style={{ cursor: "text", border: 0, padding: 0, background: "transparent" }}>
        <span className="icon-l"><Icon name="search" size={15} /></span>
        <input readOnly placeholder='Ask portfolio · "Which CAT I findings are older than 30 days?"' />
        <span className="kbd">⌘K</span>
      </button>

      <div className="rmf-topbar-right">
        <button className="rmf-iconbtn" aria-label="refresh"><Icon name="refresh" size={16}/></button>
        <button className="rmf-iconbtn" aria-label="alerts"><Icon name="bell" size={16}/><span className="badge-count"/></button>
        <div className="rmf-topbar-sep"></div>
        <div className="rmf-userchip" onClick={onLogout} title="Click to sign out">
          <div className="avatar">{user.initials}</div>
          <div>
            <div className="name">{user.name}</div>
            <div className="role">{user.role} · {sessionMin}m</div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ===================================================
   MONOGRAM (inline SVG so kit works fully offline)
   =================================================== */
function Monogram({ size = 32, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
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
   SIDEBAR
   =================================================== */
function Sidebar({ current, onNav }) {
  const items = [
    { group: "Operations" },
    { id: "dashboard",  label: "Portfolio",      icon: "layout",       count: 26 },
    { id: "alerts",     label: "Smart Alerts",   icon: "bell",         count: 7  },
    { id: "poams",      label: "POA&Ms",         icon: "clipboard",    count: 143 },
    { id: "controls",   label: "Controls",       icon: "shield-check", count: null },
    { group: "Drafting" },
    { id: "ai",         label: "AI Assistant",   icon: "sparkles",     count: 3 },
    { id: "briefing",   label: "Briefings",      icon: "presentation", count: null },
    { group: "Governance" },
    { id: "audit",      label: "Audit Log",      icon: "scroll",       count: null },
    { id: "roles",      label: "Roles & Access", icon: "id-card",      count: null },
  ];

  return (
    <aside className="rmf-sidebar">
      {items.map((it, i) => {
        if (it.group) return <div className="rmf-sidebar-group" key={"g"+i}>{it.group}</div>;
        const active = current === it.id;
        return (
          <button key={it.id}
                  className={"rmf-nav-item" + (active ? " active" : "")}
                  onClick={() => onNav(it.id)}>
            <Icon name={it.icon} size={15} />
            <span>{it.label}</span>
            {it.count != null && <span className="count">{it.count}</span>}
          </button>
        );
      })}

      <div className="rmf-sidebar-pilot">
        <div className="tag">90-DAY PILOT · DAY 41</div>
        <div className="title">Mock / sandbox data only</div>
        <div className="desc">Production eMASS write-back requires separate AO approval.</div>
      </div>
    </aside>
  );
}

/* ===================================================
   COMMAND PALETTE (⌘K)
   =================================================== */
function CommandPalette({ open, onClose, onNav, onAsk }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    if (open) setQ("");
  }, [open]);
  if (!open) return null;

  const suggestions = [
    { kind: "ask", label: "Which CAT I findings are older than 30 days?", meta: "ASK" },
    { kind: "ask", label: "Systems in 90/60/30-day ATO window", meta: "ASK" },
    { kind: "ask", label: "POA&Ms slipping more than 14 days", meta: "ASK" },
    { kind: "go",  label: "Go to AFSVC-NAFI-014",          meta: "SYSTEM", to: "system_detail" },
    { kind: "go",  label: "Open AI Documentation Assistant", meta: "PAGE", to: "ai" },
    { kind: "go",  label: "Generate AO Briefing",            meta: "PAGE", to: "briefing" },
  ];
  const filtered = q
    ? suggestions.filter(s => s.label.toLowerCase().includes(q.toLowerCase()))
    : suggestions;

  return (
    <div className="rmf-palette-backdrop" onClick={onClose}>
      <div className="rmf-palette" onClick={e => e.stopPropagation()}>
        <div className="rmf-palette-input">
          <Icon name="search" size={18} />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
                 placeholder="Ask portfolio in plain English, or jump to a system…" />
          <span className="rmf-mono" style={{ fontSize: 10.5, color: "var(--fg-3)", letterSpacing: ".08em" }}>ESC TO CLOSE</span>
        </div>
        <div className="rmf-palette-section">
          <div className="title">Suggested</div>
          {filtered.map((s, i) => (
            <div key={i} className="rmf-palette-row"
                 onClick={() => { if (s.kind === "go") onNav(s.to); else onAsk(s.label); onClose(); }}>
              <Icon name={s.kind === "ask" ? "sparkles" : "arrow-up-right"} size={15} />
              <span className="label">{s.label}</span>
              <span className="meta">{s.meta}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ClassBanner, TopBar, Monogram, Sidebar, CommandPalette });
