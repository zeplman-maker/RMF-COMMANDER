/* global React */
const { useState } = React;

/* ===================================================
   DASHBOARD / HOME — variants:
   variant="default" | "loading" | "filtered-empty"
   =================================================== */
function DashboardScreen({ variant = "default" }) {
  return (
    <div className="m-screen">
      <MBannerTop />
      <MHeader
        eyebrow="MAJ. L. CHRISTIE · ISSM · SESSION 14:32"
        title="Portfolio"
        rightIcons={[
          { name: "search", onClick: () => {} },
          { name: "bell",   onClick: () => {}, dot: true },
        ]}
      />

      <main className="m-body">
        {variant === "loading" ? <DashboardSkeleton /> : <DashboardContent variant={variant} />}
      </main>

      <MTabBar current="home" onNav={() => {}} />
      <MBannerBottom />
    </div>
  );
}

function DashboardContent({ variant }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="m-kpi"><div className="v">26</div><div className="l">Systems<br/>managed</div></div>
        <div className="m-kpi warn"><div className="v">3</div><div className="l">In 90-day<br/>window</div></div>
        <div className="m-kpi crit"><div className="v">2</div><div className="l">CAT I<br/>findings</div></div>
        <div className="m-kpi ok"><div className="v">94%</div><div className="l">Control<br/>posture</div></div>
      </div>

      <section>
        <div className="m-section-h">
          <span className="h">Critical alerts</span>
          <button className="action">See all 7</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <div className="m-alert crit">
            <div className="ic-wrap"><MIcon name="shield-alert" size={16}/></div>
            <div className="body">
              <div className="t">ATO expires in 12 days</div>
              <div className="d">AFSVC-MWR-007 enters 30-day window. Renewal draft recommended now.</div>
              <div className="meta">CRITICAL <span className="sep"/> ISSM ACTION <span className="sep"/> 14:02 Z</div>
            </div>
          </div>
          <div className="m-alert ai">
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
          <span className={"m-chip" + (variant === "filtered-empty" ? "" : " active")}>All (26)</span>
          <span className={"m-chip" + (variant === "filtered-empty" ? " active" : "")}>CAT I only</span>
          <span className="m-chip">Within 90d</span>
          <span className="m-chip">My systems</span>
        </div>

        {variant === "filtered-empty" ? (
          <div className="m-empty">
            <div className="ic"><MIcon name="check-circle" size={26}/></div>
            <div className="h">No CAT I findings</div>
            <div className="s">Your portfolio has zero CAT I findings open right now. Great work — keep it that way.</div>
            <button className="m-btn m-btn-secondary m-btn-sm" style={{ width: "auto", marginTop: 4 }}>Clear filter</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="m-sys active">
              <div className="head">
                <div>
                  <div className="name">AFSVC-MWR-007</div>
                  <div className="id">SYS-ID 0207 · HIGH</div>
                </div>
                <span className="m-badge critical">ATO 12 d</span>
              </div>
              <div className="stats">
                <div><div className="v crit">2</div><div className="l">CAT I</div></div>
                <div><div className="v warn">11</div><div className="l">CAT II</div></div>
                <div><div className="v">38</div><div className="l">CAT III</div></div>
              </div>
              <div className="foot" style={{ color: "var(--critical-400)" }}>SCAN 04:11 AGO <span className="sep"/> ACTION REQ</div>
            </div>

            <div className="m-sys">
              <div className="head">
                <div>
                  <div className="name">AFSVC-NAFI-014</div>
                  <div className="id">SYS-ID 0114 · MODERATE</div>
                </div>
                <span className="m-badge warning">ATO 47 d</span>
              </div>
              <div className="stats">
                <div><div className="v">0</div><div className="l">CAT I</div></div>
                <div><div className="v warn">7</div><div className="l">CAT II</div></div>
                <div><div className="v">22</div><div className="l">CAT III</div></div>
              </div>
              <div className="foot">SCAN 14:02 AGO <span className="sep"/> RAG STALE</div>
            </div>

            <div className="m-sys">
              <div className="head">
                <div>
                  <div className="name">AFSVC-VTOS-001</div>
                  <div className="id">SYS-ID 0042 · MODERATE</div>
                </div>
                <span className="m-badge success">ATO 247 d</span>
              </div>
              <div className="stats">
                <div><div className="v">0</div><div className="l">CAT I</div></div>
                <div><div className="v">3</div><div className="l">CAT II</div></div>
                <div><div className="v">14</div><div className="l">CAT III</div></div>
              </div>
              <div className="foot">SCAN 02:47 AGO <span className="sep"/> RAG OK</div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[0,1,2,3].map(i => (
          <div className="m-card" key={i} style={{ padding: 14 }}>
            <div className="m-skel" style={{ width: "40%", height: 26, marginBottom: 8 }}/>
            <div className="m-skel" style={{ width: "70%", height: 10 }}/>
          </div>
        ))}
      </div>
      <div>
        <div className="m-section-h"><span className="h">Critical alerts</span></div>
        {[0,1].map(i => (
          <div key={i} className="m-card" style={{ padding: 14, marginTop: 10 }}>
            <div className="m-skel" style={{ width: "55%", height: 14 }}/>
            <div className="m-skel" style={{ width: "85%", height: 11, marginTop: 6 }}/>
            <div className="m-skel" style={{ width: "40%", height: 9, marginTop: 8 }}/>
          </div>
        ))}
      </div>
      <div>
        <div className="m-section-h"><span className="h">Systems</span></div>
        {[0,1].map(i => (
          <div key={i} className="m-card" style={{ padding: 14, marginTop: 10 }}>
            <div className="m-skel" style={{ width: "60%", height: 14 }}/>
            <div className="m-skel" style={{ width: "30%", height: 10, marginTop: 6 }}/>
            <div className="m-skel" style={{ width: "100%", height: 30, marginTop: 12 }}/>
          </div>
        ))}
      </div>
    </>
  );
}

Object.assign(window, { DashboardScreen });
