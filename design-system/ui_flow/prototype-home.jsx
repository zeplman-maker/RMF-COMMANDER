/* global React */

/* ===================================================
   Home (Portfolio dashboard) — wired
   =================================================== */
function ProtoHome({ onTab, onOpenAi, filter, onToggleFilter }) {
  return (
    <>
      <MHeader
        eyebrow="MAJ. L. CHRISTIE · ISSM · SESSION 14:32"
        title="Portfolio"
        rightIcons={[
          { name: "search", onClick: () => {} },
          { name: "bell",   onClick: () => onTab("alerts"), dot: true },
        ]}
      />
      <main className="m-body">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="m-kpi"><div className="v">26</div><div className="l">Systems<br/>managed</div></div>
          <div className="m-kpi warn"><div className="v">3</div><div className="l">In 90-day<br/>window</div></div>
          <div className="m-kpi crit"><div className="v">2</div><div className="l">CAT I<br/>findings</div></div>
          <div className="m-kpi ok"><div className="v">94%</div><div className="l">Control<br/>posture</div></div>
        </div>

        <section>
          <div className="m-section-h">
            <span className="h">Critical alerts</span>
            <button className="action" onClick={() => onTab("alerts")}>See all 7</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            <div className="m-alert crit" onClick={() => onTab("alerts")} style={{ cursor: "pointer" }}>
              <div className="ic-wrap"><MIcon name="shield-alert" size={16}/></div>
              <div className="body">
                <div className="t">ATO expires in 12 days</div>
                <div className="d">AFSVC-MWR-007 enters 30-day window. Renewal draft recommended now.</div>
                <div className="meta">CRITICAL <span className="sep"/> ISSM ACTION <span className="sep"/> 14:02 Z</div>
              </div>
            </div>
            <div className="m-alert ai" onClick={onOpenAi} style={{ cursor: "pointer" }}>
              <div className="ic-wrap"><MIcon name="sparkles" size={16}/></div>
              <div className="body">
                <div className="t">AC-2(3) draft ready for review</div>
                <div className="d">Grounded in NIST SP 800-53 Rev. 5 and three precedents.</div>
                <div className="meta"><span className="m-ailabel"><MIcon name="sparkles" size={9}/>AI-DRAFTED</span> <span className="sep"/> ISSM APPROVAL</div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="m-section-h">
            <span className="h">Systems</span>
            <button className="action"><MIcon name="filter" size={13}/> Filter</button>
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "8px 0 4px", marginBottom: 4 }}>
            <span className={"m-chip" + (!filter ? " active" : "")} onClick={() => filter && onToggleFilter()}>All (26)</span>
            <span className={"m-chip" + (filter ? " active" : "")} onClick={() => !filter && onToggleFilter()}>CAT I only</span>
            <span className="m-chip">Within 90d</span>
            <span className="m-chip">My systems</span>
          </div>

          {filter ? (
            <div className="m-empty">
              <div className="ic"><MIcon name="check-circle" size={26}/></div>
              <div className="h">No CAT I findings</div>
              <div className="s">Your portfolio has zero CAT I findings open right now. Great work — keep it that way.</div>
              <button className="m-btn m-btn-secondary m-btn-sm" style={{ width: "auto", marginTop: 4 }} onClick={onToggleFilter}>Clear filter</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SysCardProto name="AFSVC-MWR-007" id="SYS-ID 0207 · HIGH" badge="ATO 12 d" tone="critical"
                            c1={2} c2={11} c3={38} foot="SCAN 04:11 AGO · ACTION REQ" footTone="critical" active/>
              <SysCardProto name="AFSVC-NAFI-014" id="SYS-ID 0114 · MODERATE" badge="ATO 47 d" tone="warning"
                            c1={0} c2={7} c3={22} foot="SCAN 14:02 AGO · RAG STALE"/>
              <SysCardProto name="AFSVC-VTOS-001" id="SYS-ID 0042 · MODERATE" badge="ATO 247 d" tone="success"
                            c1={0} c2={3} c3={14} foot="SCAN 02:47 AGO · RAG OK"/>
            </div>
          )}
        </section>
      </main>
      <MTabBar current="home" onNav={(id) => onTab(id === "more" ? "settings" : id)} />
    </>
  );
}

function SysCardProto({ name, id, badge, tone, c1, c2, c3, foot, footTone, active }) {
  return (
    <div className={"m-sys" + (active ? " active" : "")}>
      <div className="head">
        <div>
          <div className="name">{name}</div>
          <div className="id">{id}</div>
        </div>
        <span className={"m-badge " + tone}>{badge}</span>
      </div>
      <div className="stats">
        <div><div className={"v" + (c1 > 0 ? " crit" : "")}>{c1}</div><div className="l">CAT I</div></div>
        <div><div className={"v" + (c2 > 5 ? " warn" : "")}>{c2}</div><div className="l">CAT II</div></div>
        <div><div className="v">{c3}</div><div className="l">CAT III</div></div>
      </div>
      <div className="foot" style={footTone === "critical" ? { color: "var(--critical-400)" } : {}}>{foot}</div>
    </div>
  );
}

/* ===================================================
   Alerts list
   =================================================== */
function ProtoAlerts({ onTab, onOpenAi }) {
  const rows = [
    { tone: "crit", icon: "shield-alert", title: "ATO expires in 12 days — AFSVC-MWR-007", desc: "System enters 30-day window. Renewal draft recommended.", meta: ["CRITICAL", "ISSM ACTION", "14:02 Z"] },
    { tone: "warn", icon: "alert-triangle", title: "POA&M slip — AFSVC-NAFI-014 / V-217884", desc: "CAT II finding missed scheduled completion.", meta: ["WARNING", "POA&M", "CM-6"] },
    { tone: "info", icon: "bell", title: "eMASS workflow change — AFSVC-VTOS-001", desc: "SCA returned the SAR with two items.", meta: ["INFO", "WORKFLOW", "02:47 AGO"] },
    { tone: "ai",   icon: "sparkles", title: "AC-2(3) draft ready for review", desc: "Grounded in NIST SP 800-53 Rev. 5 and three precedents.", action: onOpenAi },
    { tone: "crit", icon: "alert-circle", title: "POA&M overdue — V-220110", desc: "OpenSSL CVE not closed by scheduled date.", meta: ["CRITICAL", "POA&M", "OVERDUE"] },
  ];
  return (
    <>
      <MHeader eyebrow="7 OPEN · 2 CRITICAL · 1 AI" title="Alerts"
               rightIcons={[{ name: "filter", onClick: () => {} }]}/>
      <main className="m-body">
        {rows.map((r, i) => (
          <div key={i} className={"m-alert " + r.tone} onClick={r.action} style={r.action ? { cursor: "pointer" } : {}}>
            <div className="ic-wrap"><MIcon name={r.icon} size={16}/></div>
            <div className="body">
              <div className="t">{r.title}</div>
              <div className="d">{r.desc}</div>
              <div className="meta">
                {r.tone === "ai"
                  ? <><span className="m-ailabel"><MIcon name="sparkles" size={9}/>AI-DRAFTED</span> <span className="sep"/> TAP TO REVIEW</>
                  : r.meta.map((m, j) => <React.Fragment key={j}>{j > 0 && <span className="sep"/>}{m}</React.Fragment>)
                }
              </div>
            </div>
          </div>
        ))}
      </main>
      <MTabBar current="alerts" onNav={(id) => onTab(id === "more" ? "settings" : id)} />
    </>
  );
}

Object.assign(window, { ProtoHome, ProtoAlerts, SysCardProto });
