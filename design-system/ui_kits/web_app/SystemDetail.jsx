/* SystemDetail — single system page with POA&Ms + controls */
function SystemDetail({ sys, onBack }) {
  const [tab, setTab] = useState('overview');
  const sev = severityForDays(sys.daysToATO);
  const sevColor = { ok: 'var(--status-ok)', warn: 'var(--status-warn)', crit: 'var(--status-crit)' }[sev];

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: '4px 8px', fontSize: 12 }}>
          <Icon name="chevron-left" size={14}/> Back to portfolio
        </button>
      </div>
      <div className="page-header">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--slate-500)' }}>{sys.id}</div>
          <h1 className="page">{sys.title}</h1>
          <div className="row" style={{ marginTop: 8 }}>
            <Pill tone={sev} dot>{labelForDays(sys.daysToATO)}</Pill>
            <Pill tone="neu" square>{sys.cat}</Pill>
            <Pill tone="info" square>IL4</Pill>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--slate-500)' }}>
              ConMon active · last assessment 11 May 2026
            </span>
          </div>
        </div>
        <div className="actions-row">
          <button className="btn btn-secondary"><Icon name="external-link" size={14}/> Open in eMASS</button>
          <button className="btn btn-primary"><Icon name="sparkles" size={14}/> Draft renewal package</button>
        </div>
      </div>

      {/* KPI row specific to this system */}
      <div className="kpi-strip">
        <KpiCard label="ATO countdown" value={pad3(sys.daysToATO)} valueColor={sevColor} sub="Days remaining" />
        <KpiCard label="HIGH POA&Ms" value={String(sys.poam.high)} valueColor={sys.poam.high > 0 ? 'var(--status-crit)' : 'var(--status-ok)'} sub="Open and tracked" />
        <KpiCard label="Control posture" value="71%" sub="29 of 41 fully compliant" />
        <KpiCard label="Scan freshness" value={sys.scanDays + 'd'} sub={sys.scanDays <= 7 ? 'Within target' : 'Past 7-day target'} valueColor={sys.scanDays > 7 ? 'var(--status-warn)' : null} />
      </div>

      <div className="tabs">
        {['overview', 'poams', 'controls', 'scan', 'history'].map(t =>
          <div key={t} className={'tab' + (tab===t?' active':'')} onClick={() => setTab(t)}>
            {t === 'poams' ? "POA&Ms" : t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        )}
      </div>

      {tab === 'overview' && (
        <div className="grid-2">
          <div className="card" style={{ padding: 18 }}>
            <div className="section-head" style={{ marginBottom: 8 }}>
              <span className="title">System summary</span>
            </div>
            <table className="table" style={{ fontSize: 12 }}>
              <tbody>
                <tr><td style={{ color: 'var(--slate-500)', width: '40%' }}>System owner</td><td>AFSVC / VTOS</td></tr>
                <tr><td style={{ color: 'var(--slate-500)' }}>ISSM</td><td>Leo Christie · NH-III</td></tr>
                <tr><td style={{ color: 'var(--slate-500)' }}>Authorizing Official</td><td>Francisco Salguero · SES · HAF AF/A1X</td></tr>
                <tr><td style={{ color: 'var(--slate-500)' }}>Categorization (CNSSI 1253)</td><td className="mono">{sys.cat}</td></tr>
                <tr><td style={{ color: 'var(--slate-500)' }}>Boundary</td><td>Azure Gov IL4 · NIPRNET</td></tr>
                <tr><td style={{ color: 'var(--slate-500)' }}>Original ATO</td><td className="mono">12 May 2023</td></tr>
                <tr><td style={{ color: 'var(--slate-500)' }}>Current ATO expires</td><td className="mono">{`${pad3(sys.daysToATO)} days`}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div className="section-head" style={{ marginBottom: 8 }}>
              <span className="title">Recent activity</span>
            </div>
            <AlertsFeed alerts={MOCK_ALERTS.slice(0, 4)} />
          </div>
        </div>
      )}

      {tab === 'poams' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 130 }}>POA&amp;M ID</th>
                <th style={{ width: 80 }}>Sev</th>
                <th>Title</th>
                <th style={{ width: 130 }}>Owner</th>
                <th style={{ width: 130 }}>Milestone</th>
                <th style={{ width: 100 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_POAMS.map(p => (
                <tr key={p.id}>
                  <td className="mono" style={{ color: 'var(--mission-navy-900)', fontWeight: 500 }}>{p.id}</td>
                  <td>
                    <Pill square tone={p.sev === 'HIGH' ? 'crit' : p.sev === 'MED' ? 'warn' : 'info'}>{p.sev}</Pill>
                  </td>
                  <td>{p.title}</td>
                  <td>{p.owner}</td>
                  <td className="mono">{p.milestone}</td>
                  <td><Pill square tone="neu">{p.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'controls' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Control</th>
                <th style={{ width: 200 }}>Family</th>
                <th>Status</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_CONTROLS.map(c => {
                const t = { compliant: 'ok', partial: 'warn', noncompliant: 'crit' }[c.status];
                return (
                  <tr key={c.id}>
                    <td className="mono" style={{ color: 'var(--mission-navy-900)', fontWeight: 500 }}>{c.id}</td>
                    <td>{c.family}</td>
                    <td><Pill tone={t} dot>{c.status.toUpperCase()}</Pill></td>
                    <td style={{ color: 'var(--slate-500)' }}>{c.evidence}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'scan' && (
        <div className="card" style={{ padding: 18 }}>
          <div className="section-head" style={{ marginBottom: 12 }}>
            <span className="title">ACAS Tenable scan history</span>
            <span className="meta">last 8 scans · mock dataset</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
            {[42, 38, 35, 31, 33, 29, 24, 21].map((v, i) =>
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                <div style={{ width: '100%', height: v*2.5, background: 'var(--cyber-blue-200)', borderTop: '2px solid var(--cyber-blue-500)' }} title={`${v} findings`}/>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--slate-500)' }}>W{i+1}</span>
              </div>
            )}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--slate-500)' }}>Trend: open findings ↓ from 42 to 21 over 8 weeks.</div>
        </div>
      )}

      {tab === 'history' && (
        <div className="card" style={{ padding: 18 }}>
          <table className="table">
            <thead><tr><th style={{ width: 140 }}>Date</th><th>Event</th><th style={{ width: 160 }}>Actor</th></tr></thead>
            <tbody>
              <tr><td className="mono">18 May 2026</td><td>POA&amp;M-2024-029 milestone slipped 4 days</td><td>R. Mendez · ISSO</td></tr>
              <tr><td className="mono">14 May 2026</td><td>SI-4 control statement approved (AI-assisted)</td><td>L. Christie · ISSM</td></tr>
              <tr><td className="mono">11 May 2026</td><td>SCA assessment closed · SAR uploaded</td><td>K. Patel · SCA</td></tr>
              <tr><td className="mono">02 May 2026</td><td>Continuous monitoring strategy reviewed</td><td>L. Christie · ISSM</td></tr>
              <tr><td className="mono">28 Apr 2026</td><td>System registered in RMF Commander pilot tenant</td><td>System</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SystemDetail });
                 