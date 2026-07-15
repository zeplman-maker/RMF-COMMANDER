/* global React */
const { useState } = React;

/* ===================================================
   PORTFOLIO DASHBOARD
   =================================================== */
function DashboardScreen({ onOpenSystem, onOpenAi }) {
  return (
    <div className="rmf-work">
      <header className="rmf-work-head">
        <div>
          <div className="eyebrow">PORTFOLIO · 26 SYSTEMS · MOCK DATA · DAY 41 OF 90</div>
          <h1>Portfolio overview</h1>
        </div>
        <div className="actions">
          <Button variant="secondary" icon="filter" size="md">Filter</Button>
          <Button variant="secondary" icon="download" size="md">Export</Button>
          <Button variant="primary" icon="presentation" size="md">Generate AO Briefing</Button>
        </div>
      </header>

      <div className="rmf-grid-4">
        <Kpi value="26" label="Systems managed" />
        <Kpi value="3" label="Within 90-day ATO window" tone="warning" />
        <Kpi value="2" label="CAT I findings open" tone="critical" />
        <Kpi value="94%" label="Control posture · passing" tone="success" />
      </div>

      <div className="rmf-grid-3-2" style={{ marginTop: 16 }}>
        <section className="rmf-stack" style={{ gap: 12 }}>
          <div className="rmf-row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
            <h2 className="rmf-section-title">Systems</h2>
            <div className="rmf-row" style={{ gap: 8 }}>
              <span className="rmf-eyebrow">SORT</span>
              <span className="rmf-chip">ATO expiry · ↑</span>
            </div>
          </div>
          <div className="rmf-grid-2">
            <SystemCard
              name="AFSVC-MWR-007" id="0207 · HIGH" ato="ATO 12 d" tone="critical"
              cat1={2} cat2={11} cat3={38} meta="SCAN 04:11 AGO · ACTION REQ"
              metaColor="critical"
              onClick={() => onOpenSystem("AFSVC-MWR-007")}/>
            <SystemCard
              name="AFSVC-NAFI-014" id="0114 · MODERATE" ato="ATO 47 d" tone="warning"
              cat1={0} cat2={7} cat3={22} meta="SCAN 14:02 AGO · RAG STALE"
              active onClick={() => onOpenSystem("AFSVC-NAFI-014")}/>
            <SystemCard
              name="AFSVC-VTOS-001" id="0042 · MODERATE" ato="ATO 247 d" tone="success"
              cat1={0} cat2={3} cat3={14} meta="SCAN 02:47 AGO · RAG OK"
              onClick={() => onOpenSystem("AFSVC-VTOS-001")}/>
            <SystemCard
              name="AFSVC-FSS-021" id="0321 · LOW" ato="Expired" tone="critical"
              cat1={1} cat2={5} cat3={9} meta="IATT NEEDED · ESCALATE"
              metaColor="critical"
              onClick={() => onOpenSystem("AFSVC-FSS-021")}/>
            <SystemCard
              name="AFSVC-LODGING-012" id="0312 · MODERATE" ato="ATO 181 d" tone="success"
              cat1={0} cat2={2} cat3={11} meta="SCAN 01:12 AGO · RAG OK"
              onClick={() => onOpenSystem("AFSVC-LODGING-012")}/>
            <SystemCard
              name="AFSVC-CLUBS-005" id="0205 · MODERATE" ato="ATO 73 d" tone="warning"
              cat1={0} cat2={4} cat3={18} meta="SCAN 06:48 AGO · RAG STALE"
              onClick={() => onOpenSystem("AFSVC-CLUBS-005")}/>
          </div>
        </section>

        <section className="rmf-stack" style={{ gap: 12 }}>
          <div className="rmf-row" style={{ justifyContent: "space-between" }}>
            <h2 className="rmf-section-title">Smart alerts</h2>
            <button className="rmf-btn rmf-btn-ghost rmf-btn-sm">View all <Icon name="chevron-right" size={12}/></button>
          </div>

          <Alert tone="crit" icon="shield-alert"
            title="ATO expires in 12 days — AFSVC-MWR-007"
            desc="System enters the 30-day window. Renewal package draft recommended now."
            meta={["CRITICAL", "ISSM ACTION", "14:02:11 Z"]} />

          <Alert tone="warn" icon="alert-triangle"
            title="POA&M slip — AFSVC-NAFI-014 / V-217884"
            desc="CAT II finding missed scheduled completion. New estimated date proposed."
            meta={["WARNING", "POA&M", "CM-6"]} />

          <Alert tone="info" icon="bell"
            title="eMASS workflow state changed — AFSVC-VTOS-001"
            desc="SCA returned the SAR with two items for ISSM response."
            meta={["INFO", "WORKFLOW", "02:47 AGO"]} />

          <Alert tone="ai" icon="sparkles"
            title="Draft ready — Control statement for AC-2(3)"
            desc="Grounded in NIST SP 800-53 Rev. 5 and three prior system precedents."
            meta={[<AiLabel key="ai" />, "REQUIRES ISSM APPROVAL"]}
            action={<Button size="sm" variant="ghost" onClick={onOpenAi}>Review<Icon name="chevron-right" size={12}/></Button>} />
        </section>
      </div>

      <div style={{ marginTop: 28 }}>
        <h2 className="rmf-section-title" style={{ marginBottom: 12 }}>Upcoming ATO windows</h2>
        <table className="rmf-table">
          <thead>
            <tr>
              <th style={{ width: 140 }}>System</th>
              <th style={{ width: 100 }}>ATO Status</th>
              <th style={{ width: 100 }}>Days left</th>
              <th>Owner</th>
              <th style={{ width: 100 }}>POA&M Open</th>
              <th style={{ width: 100 }}>Posture</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            <AtoRow sys="AFSVC-FSS-021" status="expired" days="−4" owner="Maj. T. Park" poam={15} posture={62}/>
            <AtoRow sys="AFSVC-MWR-007" status="warning" days="12" owner="Capt. R. Imani" poam={51} posture={71}/>
            <AtoRow sys="AFSVC-NAFI-014" status="warning" days="47" owner="Capt. R. Imani" poam={29} posture={88}/>
            <AtoRow sys="AFSVC-CLUBS-005" status="warning" days="73" owner="Lt. S. Hahn" poam={22} posture={91}/>
            <AtoRow sys="AFSVC-LODGING-012" status="success" days="181" owner="Lt. S. Hahn" poam={13} posture={96}/>
            <AtoRow sys="AFSVC-VTOS-001" status="success" days="247" owner="Maj. L. Christie" poam={17} posture={94}/>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ===================================================
   System Card (dashboard tile)
   =================================================== */
function SystemCard({ name, id, ato, tone, cat1, cat2, cat3, meta, metaColor, active, onClick }) {
  return (
    <div className={"rmf-sys" + (active ? " active" : "")} onClick={onClick} role="button">
      <div className="rmf-sys-head">
        <div>
          <div className="rmf-sys-name">{name}</div>
          <div className="rmf-sys-id">{id}</div>
        </div>
        <Badge tone={tone}>{ato}</Badge>
      </div>
      <div className="rmf-sys-stats">
        <div><div className={"rmf-sys-stat-num" + (cat1 > 0 ? " crit" : "")}>{cat1}</div><div className="rmf-sys-stat-label">CAT I</div></div>
        <div><div className={"rmf-sys-stat-num" + (cat2 > 5 ? " warn" : "")}>{cat2}</div><div className="rmf-sys-stat-label">CAT II</div></div>
        <div><div className="rmf-sys-stat-num">{cat3}</div><div className="rmf-sys-stat-label">CAT III</div></div>
      </div>
      <div className="rmf-sys-meta" style={metaColor === "critical" ? { color: "var(--critical-400)" } : {}}>{meta}</div>
    </div>
  );
}

/* ===================================================
   Alert (feed item)
   =================================================== */
function Alert({ tone, icon, title, desc, meta = [], action }) {
  return (
    <div className={"rmf-alert rmf-alert-" + tone}>
      <div className="rmf-alert-ico"><Icon name={icon} size={16} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="rmf-alert-title">{title}</div>
        <div className="rmf-alert-desc">{desc}</div>
        <div className="rmf-alert-meta">
          {meta.map((m, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="dot"></span>}
              <span>{m}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
      {action && <div style={{ display: "flex", alignItems: "center" }}>{action}</div>}
    </div>
  );
}

/* ===================================================
   ATO Row
   =================================================== */
function AtoRow({ sys, status, days, owner, poam, posture }) {
  const toneMap = { expired: "critical", warning: "warning", success: "success" };
  return (
    <tr>
      <td><span style={{ fontWeight: 600 }}>{sys}</span></td>
      <td><Badge tone={toneMap[status]} dot>{status === "expired" ? "Expired" : status === "warning" ? "Window" : "Active"}</Badge></td>
      <td className="rmf-mono" style={{ fontSize: 13, color: status === "expired" ? "var(--critical-400)" : (status === "warning" && +days < 30 ? "var(--warning-400)" : "var(--fg-1)") }}>{days}</td>
      <td>{owner}</td>
      <td className="rmf-mono">{poam}</td>
      <td>
        <div className="rmf-posture">
          <div className="rmf-posture-seg" style={{ width: posture + "%", background: posture >= 90 ? "var(--success-500)" : posture >= 75 ? "var(--warning-500)" : "var(--critical-500)" }}></div>
          <div className="rmf-posture-seg" style={{ width: (100 - posture) + "%", background: "var(--stroke-2)" }}></div>
        </div>
      </td>
      <td><button className="rmf-btn rmf-btn-ghost rmf-btn-sm">Open<Icon name="chevron-right" size={12}/></button></td>
    </tr>
  );
}

Object.assign(window, { DashboardScreen, SystemCard, Alert, AtoRow });
