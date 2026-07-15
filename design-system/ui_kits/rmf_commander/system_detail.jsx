/* global React */
const { useState } = React;

/* ===================================================
   SYSTEM DETAIL SCREEN
   =================================================== */
function SystemDetailScreen({ system, onBack, onDraft }) {
  const [tab, setTab] = useState("posture");
  const s = system || mockSystem;
  return (
    <div className="rmf-work">
      <button className="rmf-btn rmf-btn-ghost rmf-btn-sm" onClick={onBack} style={{ marginLeft: -8, marginBottom: 12 }}>
        <Icon name="chevron-left" size={13}/> Back to portfolio
      </button>

      <header className="rmf-work-head" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="rmf-eyebrow">SYSTEM · {s.id} · {s.classification}</div>
          <h1>{s.name}</h1>
          <div className="rmf-row" style={{ gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <Badge tone={s.tone}>{s.atoLabel}</Badge>
            <Chip>{s.baseline}</Chip>
            <Chip>OWNER · {s.owner}</Chip>
            <Chip>ISSO · {s.isso}</Chip>
            <Chip>EMASS PKG #{s.pkg}</Chip>
          </div>
        </div>
        <div className="actions">
          <Button variant="secondary" icon="external-link" size="md">Open in eMASS</Button>
          <Button variant="secondary" icon="download" size="md">Export package</Button>
          <Button variant="primary" icon="sparkles" size="md" onClick={onDraft}>Draft renewal</Button>
        </div>
      </header>

      <div className="rmf-grid-4" style={{ marginBottom: 20 }}>
        <Kpi value={s.daysToAto} label="Days to ATO expiry" tone={s.daysToAto < 30 ? "critical" : s.daysToAto < 90 ? "warning" : "default"} />
        <Kpi value={s.posture + "%"} label="Control posture" tone={s.posture >= 90 ? "success" : s.posture >= 75 ? "warning" : "critical"} />
        <Kpi value={s.poamCount} label="Open POA&Ms" />
        <Kpi value={s.scanFresh} label="Scan freshness" tone={s.scanFreshTone} />
      </div>

      <nav className="rmf-tabs">
        {[
          { id: "posture", l: "Control posture" },
          { id: "poams", l: "POA&Ms", count: s.poamCount },
          { id: "scans", l: "Scans" },
          { id: "docs", l: "Documents" },
          { id: "history", l: "Audit history" },
        ].map(t => (
          <button key={t.id} className={"rmf-tab" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>
            {t.l}{t.count ? <span className="rmf-mono" style={{ color: "var(--fg-3)", marginLeft: 6 }}>{t.count}</span> : null}
          </button>
        ))}
      </nav>

      {tab === "posture" && <PostureTab system={s} onDraft={onDraft} />}
      {tab === "poams"   && <PoamTab    system={s} onDraft={onDraft} />}
      {tab === "scans"   && <EmptyTab title="Scans" desc="ACAS / Tenable findings appear here once integration ships in Phase 3." />}
      {tab === "docs"    && <EmptyTab title="Documents" desc="System SSP, SAR, and POA&M artifacts pulled from eMASS." />}
      {tab === "history" && <EmptyTab title="Audit history" desc="Every API call, AI prompt, and approval is logged with 1-year retention." />}
    </div>
  );
}

function EmptyTab({ title, desc }) {
  return (
    <div className="rmf-card" style={{ padding: 32, textAlign: "center", color: "var(--fg-3)" }}>
      <Icon name="file" size={32} />
      <div style={{ marginTop: 12, fontWeight: 600, color: "var(--fg-1)", fontSize: 15 }}>{title}</div>
      <div style={{ marginTop: 6, fontSize: 13 }}>{desc}</div>
    </div>
  );
}

/* ----- Posture tab ----- */
function PostureTab({ system, onDraft }) {
  const families = [
    { id: "AC", name: "Access Control",            implemented: 21, total: 23 },
    { id: "AU", name: "Audit & Accountability",    implemented: 14, total: 15 },
    { id: "CM", name: "Configuration Management",  implemented: 9,  total: 11 },
    { id: "SI", name: "System & Info Integrity",   implemented: 16, total: 18 },
    { id: "SC", name: "System & Comms Protection", implemented: 22, total: 25 },
    { id: "IA", name: "Identification & Auth",     implemented: 12, total: 12 },
  ];
  return (
    <div className="rmf-grid-2-3">
      <div className="rmf-card" style={{ padding: 18 }}>
        <div className="rmf-eyebrow" style={{ marginBottom: 14 }}>FAMILY COVERAGE</div>
        <div className="rmf-stack" style={{ gap: 14 }}>
          {families.map(f => (
            <div key={f.id}>
              <div className="rmf-row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13 }}><span className="rmf-mono" style={{ color: "var(--cyan-400)", marginRight: 8 }}>{f.id}</span>{f.name}</span>
                <span className="rmf-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{f.implemented}/{f.total}</span>
              </div>
              <div className="rmf-posture">
                <div className="rmf-posture-seg" style={{ width: (f.implemented / f.total * 100) + "%", background: f.implemented === f.total ? "var(--success-500)" : "var(--cyan-400)" }}></div>
                <div className="rmf-posture-seg" style={{ width: (100 - (f.implemented / f.total * 100)) + "%", background: "var(--stroke-2)" }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rmf-card" style={{ padding: 0 }}>
        <div className="rmf-row" style={{ justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--stroke-2)" }}>
          <div className="rmf-eyebrow">CONTROLS REQUIRING ATTENTION</div>
          <Button variant="ghost" size="sm" icon="sparkles" onClick={onDraft}>Bulk draft</Button>
        </div>
        <div>
          <ControlRow id="AC-2(3)" name="Disable inactive accounts after 35 days" status="draft" />
          <ControlRow id="CM-6"    name="Configuration settings baseline drift" status="finding" />
          <ControlRow id="SI-4(4)" name="Inbound/outbound communications traffic" status="draft" />
          <ControlRow id="AU-12"   name="Audit record generation — completeness" status="ok" />
          <ControlRow id="SC-7"    name="Boundary protection — DMZ documentation" status="finding" />
          <ControlRow id="IA-5(1)" name="Authenticator management — complexity" status="ok" />
        </div>
      </div>
    </div>
  );
}

function ControlRow({ id, name, status }) {
  const statusEl =
    status === "draft"   ? <span className="rmf-ailabel"><Icon name="sparkles" size={9}/>AI-DRAFTED</span> :
    status === "finding" ? <Badge tone="warning">Finding</Badge> :
                           <Badge tone="success">Implemented</Badge>;
  return (
    <div className="rmf-control-row">
      <div className="rmf-control-id">{id}</div>
      <div className="rmf-control-name">{name}</div>
      <div>{statusEl}</div>
    </div>
  );
}

/* ----- POA&M tab ----- */
function PoamTab({ system, onDraft }) {
  const rows = [
    { id: "V-217884", cat: 2, title: "Local admin password lifetime exceeds policy", control: "AC-2(3)", owner: "ISSO Park",   due: "2026-06-04", slip: 7,  status: "slipping", ai: true },
    { id: "V-220110", cat: 1, title: "OpenSSL pinned to vulnerable version on egress proxy", control: "SI-2",    owner: "ISSO Park",   due: "2026-05-29", slip: 0,  status: "critical", ai: false },
    { id: "V-218047", cat: 2, title: "STIG drift — Windows audit policy", control: "CM-6",   owner: "ISSO Lin",    due: "2026-06-30", slip: 0,  status: "ontrack", ai: false },
    { id: "V-219015", cat: 3, title: "Banner text missing on legacy SFTP node", control: "AC-8",   owner: "ISSO Lin",    due: "2026-07-12", slip: 0,  status: "ontrack", ai: false },
    { id: "V-219200", cat: 2, title: "ConMon SIEM rule coverage gap — failed logon spike", control: "SI-4(4)", owner: "ISSO Park",   due: "2026-06-18", slip: 2,  status: "slipping", ai: true },
  ];
  return (
    <div className="rmf-card" style={{ padding: 0 }}>
      <div className="rmf-row" style={{ justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--stroke-2)" }}>
        <div className="rmf-eyebrow">POA&M REGISTER · 5 OF 29 SHOWN</div>
        <div className="rmf-row" style={{ gap: 8 }}>
          <Button variant="secondary" icon="filter" size="sm">CAT I</Button>
          <Button variant="primary" icon="plus" size="sm">New POA&M</Button>
        </div>
      </div>
      <table className="rmf-table">
        <thead>
          <tr>
            <th style={{ width: 100 }}>POA&M ID</th>
            <th style={{ width: 60 }}>Sev</th>
            <th>Finding</th>
            <th style={{ width: 90 }}>Control</th>
            <th style={{ width: 110 }}>Owner</th>
            <th style={{ width: 110 }}>Due</th>
            <th style={{ width: 110 }}>Status</th>
            <th style={{ width: 96 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td className="rmf-mono" style={{ fontSize: 12 }}>{r.id}</td>
              <td><SeverityTag cat={r.cat}/></td>
              <td>
                <div style={{ fontWeight: 500 }}>{r.title}</div>
                {r.ai && <div style={{ marginTop: 4 }}><AiLabel/> <span className="rmf-mono" style={{ fontSize: 10, color: "var(--fg-3)", marginLeft: 6 }}>SUGGESTED REMEDIATION</span></div>}
              </td>
              <td><Chip>{r.control}</Chip></td>
              <td>{r.owner}</td>
              <td className="rmf-mono" style={{ fontSize: 12, color: r.slip > 0 ? "var(--warning-400)" : "var(--fg-2)" }}>
                {r.due}{r.slip > 0 ? <div style={{ fontSize: 10, color: "var(--warning-400)" }}>+{r.slip}d slip</div> : null}
              </td>
              <td>
                {r.status === "critical" && <Badge tone="critical">Overdue</Badge>}
                {r.status === "slipping" && <Badge tone="warning">Slipping</Badge>}
                {r.status === "ontrack" && <Badge tone="success">On track</Badge>}
              </td>
              <td><button className="rmf-btn rmf-btn-ghost rmf-btn-sm" onClick={r.ai ? onDraft : undefined}>{r.ai ? "Review" : "Open"}<Icon name="chevron-right" size={12}/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const mockSystem = {
  name: "AFSVC-NAFI-014",
  id: "SYS-ID 0114",
  classification: "MODERATE",
  baseline: "NIST 800-53 Rev. 5 · MOD",
  owner: "Capt. R. Imani",
  isso: "T. Park",
  pkg: "88421",
  ato: "warning",
  atoLabel: "ATO in 47 d",
  tone: "warning",
  daysToAto: 47,
  posture: 88,
  poamCount: 29,
  scanFresh: "14:02",
  scanFreshTone: "warning",
};

Object.assign(window, { SystemDetailScreen, mockSystem });
