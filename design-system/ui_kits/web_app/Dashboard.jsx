/* Dashboard — portfolio overview */

function KpiCard({ label, value, sub, sub2, valueColor }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="value" style={valueColor ? { color: valueColor } : null}>{value}</div>
      <div className="sub">{sub}{sub2 ? <span> · {sub2}</span> : null}</div>
    </div>
  );
}

function AlertsFeed({ alerts, max }) {
  const shown = typeof max === 'number' ? alerts.slice(0, max) : alerts;
  const iconFor = { ok: 'check-circle-2', warn: 'triangle-alert', crit: 'octagon-alert', ai: 'bot' };
  return (
    <div className="alerts">
      {shown.map(a => (
        <div key={a.id} className={`alert-row ${a.tone}`}>
          <span className="ico"><Icon name={iconFor[a.tone]} size={16} /></span>
          <div className="body">
            <b>{a.title}</b>
            <span>{a.meta}</span>
          </div>
          <span className="time">{a.time}</span>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ onOpenSystem, onOpenAssistant }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page">Portfolio overview</h1>
          <div className="page-subtitle">Air Force Services Center · VTOS · 26 systems · 1M+ end users</div>
        </div>
        <div className="actions-row">
          <button className="btn btn-secondary">
            <Icon name="download" size={14}/> Export posture
          </button>
          <button className="btn btn-primary" onClick={onOpenAssistant}>
            <Icon name="sparkles" size={14}/> Generate AO briefing
          </button>
        </div>
      </div>

      {/* NL Query */}
      <div className="nlq" style={{ marginBottom: 24 }}>
        <span className="ico"><Icon name="search" size={18} /></span>
        <input placeholder='Try: "which systems expire in the next 60 days and have open HIGH POA&Ms?"' />
        <span className="hint">⏎ to ask · answers cite source</span>
      </div>

      {/* KPI strip */}
      <div className="kpi-strip">
        <KpiCard label="Systems" value="26" sub="22 valid" sub2="4 in window" />
        <KpiCard label="ATO ≤ 30 days" value="1" valueColor="var(--status-crit)" sub="AFSVC-MWR-INTRANET-02" />
        <KpiCard label="Open POA&Ms" value="47" sub="4 HIGH · 17 MED · 26 LOW" />
        <KpiCard label="Avg. scan freshness" value="5.3d" sub="Target ≤ 7d · 1 host stale" />
      </div>

      {/* Systems grid */}
      <div className="section-head">
        <span className="eyebrow">01</span>
        <span className="title">Systems by posture</span>
        <span className="meta">Sorted by days-to-ATO ascending · 6 of 26 shown</span>
      </div>
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {MOCK_SYSTEMS.map(sys =>
          <SystemCard key={sys.id} sys={sys} onClick={() => onOpenSystem(sys)} />
        )}
      </div>

      {/* Alerts */}
      <div className="section-head">
        <span className="eyebrow">02</span>
        <span className="title">Smart alerts</span>
        <span className="meta">90/60/30-day · POA&amp;M slips · AI draft ready</span>
      </div>
      <AlertsFeed alerts={MOCK_ALERTS} />
    </div>
  );
}

Object.assign(window, { Dashboard, AlertsFeed });
