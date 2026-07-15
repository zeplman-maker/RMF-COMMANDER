/* global React */

/* ===================================================
   AI drafts list — wired
   =================================================== */
function ProtoAiList({ onTab, onOpenDraft }) {
  return (
    <>
      <MHeader eyebrow="3 PENDING REVIEW · ZERO AUTO-SUBMITTED" title="AI drafts"
               rightIcons={[{ name: "filter", onClick: () => {} }]}/>
      <main className="m-body">
        <div className="m-card" style={{ padding: 14, background: "rgba(34,211,238,0.04)", borderColor: "rgba(34,211,238,0.32)" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(34,211,238,0.16)", color: "var(--cyan-400)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MIcon name="sparkles" size={18}/>
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>Drafts assist; you decide.</div>
              <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 4, lineHeight: 1.45 }}>
                Every output is labeled <span className="m-ailabel" style={{ display: "inline-flex", verticalAlign: "middle" }}>AI-DRAFTED</span> until you approve it. The gate cannot be bypassed.
              </div>
            </div>
          </div>
        </div>

        <section>
          <div className="m-section-h"><span className="h">Awaiting your review</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
            <ProtoDraftCard control="AC-2(3)" title="Disable inactive accounts after 35 days"
                       system="AFSVC-NAFI-014" version="v3" ago="02:14 ago" sources={3}
                       priority="ISSM REVIEW" active onClick={onOpenDraft}/>
            <ProtoDraftCard control="SI-4(4)" title="ConMon SIEM rule coverage gap — failed logon spike"
                       system="AFSVC-NAFI-014" version="v1" ago="11:48 ago" sources={2}
                       priority="ISSO REVIEW"/>
            <ProtoDraftCard control="CM-6" title="STIG drift — Windows audit policy baseline"
                       system="AFSVC-MWR-007" version="v2" ago="1d ago" sources={4}
                       priority="ISSM REVIEW"/>
          </div>
        </section>

        <section>
          <div className="m-section-h">
            <span className="h">Recently approved</span>
            <button className="action">7 total</button>
          </div>
          <div className="m-list" style={{ marginTop: 4 }}>
            <div className="m-list-row">
              <div className="ic cyan"><MIcon name="check" size={16}/></div>
              <div className="meta">
                <div className="t">AU-12 — Audit record generation</div>
                <div className="s">AFSVC-VTOS-001 · Approved by you · 2d ago</div>
              </div>
              <span className="chev"><MIcon name="chevron-right" size={16}/></span>
            </div>
            <div className="m-list-row">
              <div className="ic cyan"><MIcon name="check" size={16}/></div>
              <div className="meta">
                <div className="t">IA-5(1) — Authenticator complexity</div>
                <div className="s">AFSVC-NAFI-014 · Approved by you · 4d ago</div>
              </div>
              <span className="chev"><MIcon name="chevron-right" size={16}/></span>
            </div>
          </div>
        </section>
      </main>
      <MTabBar current="ai" onNav={(id) => onTab(id === "more" ? "settings" : id)} />
    </>
  );
}

function ProtoDraftCard({ control, title, system, version, ago, sources, priority, active, onClick }) {
  return (
    <div className={"m-card" + (active ? " active" : "")} style={{ padding: 14, cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className="m-chip active">{control}</span>
            <span className="m-ailabel"><MIcon name="sparkles" size={9}/>AI-DRAFTED</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8, lineHeight: 1.3 }}>{title}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", marginTop: 6, letterSpacing: ".04em", textTransform: "uppercase" }}>
            {system} · {version} · {ago} · {sources} SOURCES
          </div>
        </div>
        <span className="m-badge warning nodot" style={{ flexShrink: 0 }}>{priority}</span>
      </div>
    </div>
  );
}

/* ===================================================
   AI draft detail — gate + approve
   =================================================== */
function ProtoAiDraft({ approved, onBack, onApprove }) {
  return (
    <>
      <MHeader leftIcon="chevron-left" leftOnClick={onBack}
               eyebrow="AC-2(3) · AFSVC-NAFI-014 · v3"
               title="Disable inactive accounts"
               rightIcons={[{ name: "more-horizontal", onClick: () => {} }]}/>

      <main className="m-body" style={{ paddingBottom: 120 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span className="m-ailabel"><MIcon name="sparkles" size={9}/>AI-DRAFTED</span>
          <span className="m-chip">NIST SP 800-53</span>
          <span className="m-chip">RAG GROUNDED</span>
        </div>
        <div className="m-draft-body">
          <p>All NAFI user accounts on AFSVC-NAFI-014 are governed by an automated lifecycle policy that disables accounts inactive for more than <strong>35 calendar days</strong>. Inactivity is measured at the identity provider (Azure AD Gov) and confirmed nightly by a privileged script that writes a tamper-evident attestation to the audit log <span className="cite">SP 800-53 §AC-2(3)</span>.</p>
          <p>Service and break-glass accounts are exempted by group membership and reviewed quarterly by the ISSM. Disabled accounts are retained — but non-functional — for 90 days to support investigations <span className="cite">SP 800-53 §AU-11</span>.</p>
        </div>
        <div>
          <div className="m-eyebrow" style={{ marginBottom: 6 }}>SOURCES · 3 CITED</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="m-source"><span className="ref">§AC-2(3)</span><span className="desc">Disable inactive accounts after organization-defined period</span></div>
            <div className="m-source"><span className="ref">§AU-11</span><span className="desc">Audit record retention — investigative needs</span></div>
            <div className="m-source"><span className="ref">VTOS-001</span><span className="desc">Approved precedent — same control, June 2025</span></div>
          </div>
        </div>
        <div className={"m-gate" + (approved ? " approved" : "")}>
          {approved
            ? <><MIcon name="check" size={13}/> Approved · ready for SSP insertion</>
            : <><MIcon name="lock-keyhole" size={13}/> Awaiting ISSM approval · cannot submit until reviewed</>}
        </div>
      </main>

      <div className="m-actionbar">
        {approved ? (
          <>
            <button className="m-btn m-btn-secondary"><MIcon name="download" size={15}/> Export</button>
            <button className="m-btn m-btn-primary" onClick={onBack}><MIcon name="presentation" size={15}/> Add to briefing</button>
          </>
        ) : (
          <>
            <button className="m-btn m-btn-secondary">Suggest edits</button>
            <button className="m-btn m-btn-primary" onClick={onApprove}><MIcon name="check" size={15}/> Approve as ISSM</button>
          </>
        )}
      </div>
    </>
  );
}

/* ===================================================
   Briefings flow — index → builder → generating → preview → share
   Sub-routes within the "briefing" tab.
   =================================================== */
function ProtoBriefing({ onTab }) {
  const [sub, setSub] = React.useState("index");        // index | builder | generating | preview | share
  const [cfg, setCfg] = React.useState({
    audience: "AO",
    range: "30d",
    sections: { posture: true, ato: true, ai: true, decisions: true, risk: false },
  });
  const [page, setPage] = React.useState(0);

  const go = (s) => { setSub(s); setPage(0); };

  // simulate generation
  React.useEffect(() => {
    if (sub === "generating") {
      const id = setTimeout(() => setSub("preview"), 1600);
      return () => clearTimeout(id);
    }
  }, [sub]);

  return (
    <>
      {sub === "index"      && <BriefingIndex onTab={onTab} onNew={() => go("builder")} onOpenLast={() => go("preview")} />}
      {sub === "builder"    && <BriefingBuilder cfg={cfg} setCfg={setCfg} onBack={() => go("index")} onGenerate={() => go("generating")} />}
      {sub === "generating" && <BriefingGenerating cfg={cfg} />}
      {sub === "preview"    && <BriefingPreview page={page} setPage={setPage} onBack={() => go("index")} onShare={() => go("share")} />}
      {sub === "share"      && <BriefingShare onBack={() => go("preview")} onDone={() => go("index")} />}
    </>
  );
}

/* ---------- 1. INDEX ---------- */
function BriefingIndex({ onTab, onNew, onOpenLast }) {
  return (
    <>
      <MHeader eyebrow="EXEC BRIEFING GENERATOR · 30-DAY AO TOUCHPOINT"
               title="Briefings"
               rightIcons={[{ name: "filter", onClick: () => {} }]}/>
      <main className="m-body">
        <div className="m-card" style={{ padding: 16, background: "rgba(34,211,238,0.04)", borderColor: "rgba(34,211,238,0.32)" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(34,211,238,0.16)", color: "var(--cyan-400)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MIcon name="presentation" size={20}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>Next AO touchpoint</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", letterSpacing: ".06em", textTransform: "uppercase", marginTop: 4 }}>22 JUN 2026 · IN 8 DAYS</div>
            </div>
          </div>
          <button className="m-btn m-btn-primary" style={{ marginTop: 14 }} onClick={onNew}>
            <MIcon name="sparkles" size={15}/> Generate briefing
          </button>
        </div>

        <section>
          <div className="m-section-h"><span className="h">Recent briefings</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            <BriefingRow title="AO touchpoint · May" date="22 MAY 2026" pages={6} approved onClick={onOpenLast}/>
            <BriefingRow title="PM weekly · Wk 19" date="08 MAY 2026" pages={4} approved/>
            <BriefingRow title="AO touchpoint · April" date="22 APR 2026" pages={6} approved/>
            <BriefingRow title="Leadership Q1 review" date="03 APR 2026" pages={9} approved/>
          </div>
        </section>

        <section>
          <div className="m-section-h"><span className="h">Drafts</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            <BriefingRow title="POA&M deep-dive · MWR-007" date="DRAFT · 1d ago" pages={3} draft/>
          </div>
        </section>
      </main>
      <MTabBar current="briefing" onNav={(id) => onTab(id === "more" ? "settings" : id)} />
    </>
  );
}

function BriefingRow({ title, date, pages, approved, draft, onClick }) {
  return (
    <div className="m-card" style={{ padding: 14, cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{
          width: 44, height: 56, flexShrink: 0,
          background: "var(--neutral-50)", borderRadius: 4,
          border: "1.5px solid var(--stroke-2)", position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "#006400" }}/>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 5, background: "#006400" }}/>
          <div style={{ position: "absolute", inset: "10px 5px", display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ height: 4, background: "var(--neutral-200)", borderRadius: 1 }}/>
            <div style={{ height: 8, background: "var(--navy-700)", borderRadius: 1 }}/>
            <div style={{ height: 3, background: "var(--neutral-200)", borderRadius: 1, marginTop: 2 }}/>
            <div style={{ height: 3, background: "var(--neutral-200)", borderRadius: 1, width: "70%" }}/>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{title}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", marginTop: 4, letterSpacing: ".04em", textTransform: "uppercase" }}>
            {date} · {pages} PAGES
          </div>
          <div style={{ marginTop: 6 }}>
            {approved && <span className="m-badge success">Approved</span>}
            {draft && <span className="m-badge warning">Draft</span>}
          </div>
        </div>
        <span className="chev" style={{ color: "var(--fg-3)" }}><MIcon name="chevron-right" size={16}/></span>
      </div>
    </div>
  );
}

/* ---------- 2. BUILDER ---------- */
function BriefingBuilder({ cfg, setCfg, onBack, onGenerate }) {
  const set = (patch) => setCfg(c => ({ ...c, ...patch }));
  const setSection = (k, v) => setCfg(c => ({ ...c, sections: { ...c.sections, [k]: v } }));
  const toggle = (k) => setSection(k, !cfg.sections[k]);

  return (
    <>
      <MHeader leftIcon="chevron-left" leftOnClick={onBack}
               eyebrow="STEP 1 OF 2 · CONFIGURE"
               title="New briefing"/>
      <main className="m-body" style={{ paddingBottom: 120 }}>
        <section>
          <div className="m-eyebrow" style={{ marginBottom: 8 }}>AUDIENCE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <SegBtn label="AO" sub="Touchpoint" active={cfg.audience === "AO"} onClick={() => set({ audience: "AO" })} ic="shield-check"/>
            <SegBtn label="PM" sub="Weekly" active={cfg.audience === "PM"} onClick={() => set({ audience: "PM" })} ic="id-card"/>
            <SegBtn label="Lead" sub="Quarterly" active={cfg.audience === "Lead"} onClick={() => set({ audience: "Lead" })} ic="presentation"/>
          </div>
        </section>

        <section>
          <div className="m-eyebrow" style={{ marginBottom: 8 }}>RANGE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <PillBtn label="7 days" active={cfg.range === "7d"} onClick={() => set({ range: "7d" })}/>
            <PillBtn label="30 days" active={cfg.range === "30d"} onClick={() => set({ range: "30d" })}/>
            <PillBtn label="Quarter" active={cfg.range === "Q"} onClick={() => set({ range: "Q" })}/>
          </div>
        </section>

        <section>
          <div className="m-section-h"><span className="h">Sections</span><span className="m-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{Object.values(cfg.sections).filter(Boolean).length} of 5</span></div>
          <div className="m-card" style={{ padding: 0, marginTop: 8 }}>
            <ToggleRow label="Portfolio posture summary" hint="KPI snapshot · ATO / POA&M / posture" on={cfg.sections.posture} onChange={(v) => setSection("posture", v)} ic="layout"/>
            <ToggleRow label="ATO pipeline" hint="Renewals in next 60 days" on={cfg.sections.ato} onChange={(v) => setSection("ato", v)} ic="shield-check"/>
            <ToggleRow label="AI assist metrics" hint="Draft throughput · acceptance rate" on={cfg.sections.ai} onChange={(v) => setSection("ai", v)} ic="sparkles"/>
            <ToggleRow label="Decisions requested" hint="Items for AO review" on={cfg.sections.decisions} onChange={(v) => setSection("decisions", v)} ic="check"/>
            <ToggleRow label="Risk register" hint="Open risks &amp; mitigations" on={cfg.sections.risk} onChange={(v) => setSection("risk", v)} ic="alert-triangle"/>
          </div>
        </section>

        <section>
          <div className="m-card" style={{ padding: 14, background: "rgba(59,130,246,0.04)", borderColor: "rgba(59,130,246,0.28)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <MIcon name="info" size={16} color="var(--info-400)"/>
              <div style={{ fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5 }}>
                Briefing narrative is <span className="m-ailabel" style={{ display: "inline-flex", verticalAlign: "middle" }}>AI-DRAFTED</span> and validated against live data at generation. Requires ISSM approval before sharing.
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="m-actionbar">
        <button className="m-btn m-btn-secondary" onClick={onBack}>Cancel</button>
        <button className="m-btn m-btn-primary" onClick={onGenerate} disabled={Object.values(cfg.sections).every(v => !v)}>
          <MIcon name="sparkles" size={15}/> Generate
        </button>
      </div>
    </>
  );
}

function SegBtn({ label, sub, active, onClick, ic }) {
  return (
    <button onClick={onClick}
      style={{
        background: active ? "rgba(34,211,238,0.10)" : "var(--surface-1)",
        border: "1.5px solid " + (active ? "rgba(34,211,238,0.5)" : "var(--stroke-2)"),
        borderRadius: 10, padding: "12px 8px",
        color: active ? "var(--cyan-400)" : "var(--fg-1)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        fontFamily: "inherit", cursor: "pointer", textAlign: "center"
      }}>
      <MIcon name={ic} size={18}/>
      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.005em" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: active ? "var(--cyan-400)" : "var(--fg-3)", letterSpacing: ".06em", textTransform: "uppercase" }}>{sub}</div>
    </button>
  );
}

function PillBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        background: active ? "rgba(34,211,238,0.10)" : "var(--surface-1)",
        border: "1.5px solid " + (active ? "rgba(34,211,238,0.5)" : "var(--stroke-2)"),
        borderRadius: 8, padding: "10px",
        color: active ? "var(--cyan-400)" : "var(--fg-1)",
        fontSize: 13, fontWeight: 600, letterSpacing: "-0.005em",
        fontFamily: "inherit", cursor: "pointer"
      }}>
      {label}
    </button>
  );
}

function ToggleRow({ label, hint, on, onChange, ic }) {
  return (
    <div className="m-list-row" style={{ padding: "12px 14px", cursor: "pointer" }} onClick={() => onChange(!on)}>
      <div className={"ic" + (on ? " cyan" : "")}><MIcon name={ic} size={16}/></div>
      <div className="meta">
        <div className="t" dangerouslySetInnerHTML={{ __html: label }}/>
        {hint && <div className="s" dangerouslySetInnerHTML={{ __html: hint }}/>}
      </div>
      <span className={"m-switch" + (on ? " on" : "")}></span>
    </div>
  );
}

/* ---------- 3. GENERATING (loading) ---------- */
function BriefingGenerating({ cfg }) {
  const [step, setStep] = React.useState(0);
  const steps = [
    "Pulling portfolio posture from eMASS sandbox…",
    "Validating ATO timelines against system clock…",
    "Citing sources for AI-drafted narrative…",
    "Composing PDF pages…",
  ];
  React.useEffect(() => {
    const id = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 380);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      <MHeader eyebrow="GENERATING · MOCK DATA" title="Briefing"/>
      <main className="m-body" style={{ alignItems: "center", justifyContent: "center", display: "flex" }}>
        <div className="m-card" style={{ padding: 28, textAlign: "center", width: "100%" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, margin: "0 auto",
            background: "rgba(34,211,238,0.12)", color: "var(--cyan-400)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(34,211,238,0.32)"
          }}>
            <MIcon name="sparkles" size={32}/>
          </div>
          <div style={{ marginTop: 16, fontSize: 16, fontWeight: 700, letterSpacing: "-0.011em" }}>
            Drafting {cfg.audience} briefing
          </div>
          <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", letterSpacing: ".08em", textTransform: "uppercase" }}>
            {cfg.range.toUpperCase()} · {Object.values(cfg.sections).filter(Boolean).length} SECTIONS
          </div>

          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: i <= step ? 1 : 0.35, transition: "opacity 200ms" }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 50, flexShrink: 0,
                  background: i < step ? "rgba(34,197,94,0.15)" : i === step ? "rgba(34,211,238,0.15)" : "var(--surface-2)",
                  border: "1px solid " + (i < step ? "rgba(34,197,94,0.4)" : i === step ? "rgba(34,211,238,0.4)" : "var(--stroke-2)"),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: i < step ? "var(--success-400)" : "var(--cyan-400)"
                }}>
                  {i < step ? <MIcon name="check" size={11}/> : i === step ? <span className="m-skel" style={{ width: 6, height: 6, borderRadius: 50, background: "var(--cyan-400)" }}/> : null}
                </div>
                <div style={{ fontSize: 12.5, color: i <= step ? "var(--fg-1)" : "var(--fg-3)" }}>{s}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 22, fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--fg-4)", letterSpacing: ".08em", textTransform: "uppercase", lineHeight: 1.6 }}>
            NIST AI RMF · MEASURE<br/>
            All claims cited · approval required before share
          </div>
        </div>
      </main>
    </>
  );
}

/* ---------- 4. PREVIEW (PDF) ---------- */
function BriefingPreview({ page, setPage, onBack, onShare }) {
  const pages = [
    { idx: 1, eyebrow: "01 · AO TOUCHPOINT — 22 MAY 2026", h: "Portfolio posture summary",
      stats: [{ n: "26", l: "Systems" }, { n: "3", l: "In 90-day window" }, { n: "2", l: "CAT I open" }],
      body: "Posture is stable. Three systems are within 90 days of ATO expiry and one (FSS-021) has slipped — recommended action: 60-day IATT extension while renewal completes review." },
    { idx: 2, eyebrow: "02 · ATO PIPELINE", h: "Renewals in next 60 days",
      stats: [{ n: "12 d", l: "AFSVC-MWR-007" }, { n: "47 d", l: "AFSVC-NAFI-014" }, { n: "73 d", l: "AFSVC-CLUBS-005" }],
      body: "MWR-007 enters the 30-day window today; renewal package is in draft. NAFI-014 SAR has been returned by the SCA with two items for ISSM response." },
    { idx: 3, eyebrow: "03 · AI ASSIST METRICS", h: "Drafting throughput",
      stats: [{ n: "73%", l: "Drafts accepted" }, { n: "100%", l: "Source-citation rate" }, { n: "0", l: "Boundary violations" }],
      body: "AI drafting used on 23 control statements across the portfolio. 73% accepted with no or only minor edits by the responsible ISSM. Citation rate is 100%; gate has never been bypassed." },
    { idx: 4, eyebrow: "04 · DECISIONS REQUESTED", h: "For AO review",
      stats: [{ n: "1", l: "IATT for FSS-021" }, { n: "2", l: "POA&M extensions" }, { n: "0", l: "Scope expansions" }],
      body: "FSS-021 requires a 60-day IATT extension. Two CAT II POA&M extensions are proposed for NAFI-014 (V-217884, V-219200). No scope expansions are requested." },
  ];
  const p = pages[page];
  const total = pages.length;

  return (
    <>
      <MHeader leftIcon="chevron-left" leftOnClick={onBack}
               eyebrow={`PDF PREVIEW · PAGE ${page + 1} OF ${total}`}
               title="AO touchpoint"
               rightIcons={[{ name: "more-horizontal", onClick: () => {} }]}/>

      <main className="m-body" style={{ paddingBottom: 130, gap: 14 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span className="m-ailabel"><MIcon name="sparkles" size={9}/>AI-DRAFTED</span>
          <span className="m-chip">22 MAY 2026</span>
          <span className="m-chip">AS-OF LIVE</span>
        </div>

        <BriefingPdfPage p={p}/>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <button className="m-btn m-btn-secondary m-btn-sm" style={{ width: "auto" }}
                  disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
            <MIcon name="chevron-left" size={13}/> Prev
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            {pages.map((_, i) => (
              <button key={i} onClick={() => setPage(i)}
                style={{
                  width: i === page ? 22 : 7, height: 7, borderRadius: 999,
                  background: i === page ? "var(--cyan-400)" : "var(--stroke-3)",
                  border: 0, padding: 0, cursor: "pointer", transition: "width 200ms"
                }}/>
            ))}
          </div>
          <button className="m-btn m-btn-secondary m-btn-sm" style={{ width: "auto" }}
                  disabled={page === total - 1} onClick={() => setPage(p => Math.min(total - 1, p + 1))}>
            Next <MIcon name="chevron-right" size={13}/>
          </button>
        </div>

        <div className="m-gate" style={{ marginTop: 8 }}>
          <MIcon name="lock-keyhole" size={13}/>
          Awaiting ISSM approval before share — narrative cites 14 sources
        </div>
      </main>

      <div className="m-actionbar">
        <button className="m-btn m-btn-secondary">Suggest edits</button>
        <button className="m-btn m-btn-primary" onClick={onShare}>
          <MIcon name="check" size={15}/> Approve &amp; share
        </button>
      </div>
    </>
  );
}

/* PDF page preview — mirrors the desktop slides/slide.css "rmf-brief-page" rhythm */
function BriefingPdfPage({ p }) {
  return (
    <div style={{
      background: "var(--neutral-50)", color: "var(--navy-900)",
      borderRadius: 10, padding: "18px 18px", aspectRatio: "16 / 11",
      boxShadow: "0 16px 40px rgba(0,0,0,0.4)", border: "1px solid rgba(0,0,0,0.06)",
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", gap: 8
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, padding: 4,
        background: "#006400", color: "#fff",
        fontFamily: "var(--font-mono)", fontSize: 8.5, fontWeight: 600,
        letterSpacing: "0.18em", textTransform: "uppercase", textAlign: "center"
      }}>UNCLASSIFIED // FOR OFFICIAL USE ONLY</div>

      <div style={{ paddingTop: 18, fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--neutral-500)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {p.eyebrow}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.011em", lineHeight: 1.1 }}>{p.h}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {p.stats.map((s, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid var(--neutral-100)", borderRadius: 5, padding: "8px 10px" }}>
            <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.011em", color: "var(--navy-900)", lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 7, color: "var(--neutral-500)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 3 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10.5, color: "var(--neutral-500)", lineHeight: 1.55, marginTop: 4 }}>
        {p.body}
      </div>

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--font-mono)", fontSize: 7.5, color: "var(--neutral-500)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        <span>RMF COMMANDER · AO BRIEFING</span>
        <span>{p.idx} / 4</span>
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: 4,
        background: "#006400", color: "#fff",
        fontFamily: "var(--font-mono)", fontSize: 8.5, fontWeight: 600,
        letterSpacing: "0.18em", textTransform: "uppercase", textAlign: "center"
      }}>UNCLASSIFIED // FOR OFFICIAL USE ONLY</div>
    </div>
  );
}

/* ---------- 5. SHARE ---------- */
function BriefingShare({ onBack, onDone }) {
  return (
    <>
      <MHeader leftIcon="chevron-left" leftOnClick={onBack}
               eyebrow="APPROVED · 4 PAGES · 14 SOURCES"
               title="Share briefing"/>
      <main className="m-body">
        <div className="m-card" style={{ padding: 16, background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.32)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(34,197,94,0.16)", color: "var(--success-400)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MIcon name="check" size={18}/>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Approved by you · ISSM</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", letterSpacing: ".05em", textTransform: "uppercase", marginTop: 3 }}>LOGGED · AUDIT #88421-BRIEF-053</div>
            </div>
          </div>
        </div>

        <section>
          <div className="m-eyebrow" style={{ marginBottom: 8 }}>EXPORT</div>
          <div className="m-card" style={{ padding: 0 }}>
            <ExportRow ic="file-text" tone="cyan" label="Download PDF" sub="A4 · 4 pages · 1.2 MB" />
            <ExportRow ic="presentation" label="Download PPTX" sub="16:9 · editable · 1.6 MB" />
            <ExportRow ic="download" label="Secure link" sub="Expires in 7 days · CAC-required" />
          </div>
        </section>

        <section>
          <div className="m-eyebrow" style={{ marginBottom: 8 }}>SEND TO</div>
          <div className="m-card" style={{ padding: 0 }}>
            <RecipientRow name="Francisco Salguero" role="SES · AO" check />
            <RecipientRow name="Capt. R. Imani" role="System owner" />
            <RecipientRow name="T. Park" role="ISSO" />
          </div>
        </section>
      </main>

      <div className="m-actionbar">
        <button className="m-btn m-btn-secondary" onClick={onBack}>Back to preview</button>
        <button className="m-btn m-btn-primary" onClick={onDone}>
          <MIcon name="arrow-right" size={15}/> Send briefing
        </button>
      </div>
    </>
  );
}

function ExportRow({ ic, tone, label, sub }) {
  return (
    <div className="m-list-row" style={{ padding: "12px 14px", cursor: "pointer" }}>
      <div className={"ic" + (tone ? " " + tone : "")}><MIcon name={ic} size={16}/></div>
      <div className="meta">
        <div className="t">{label}</div>
        {sub && <div className="s">{sub}</div>}
      </div>
      <span className="chev"><MIcon name="chevron-right" size={16}/></span>
    </div>
  );
}

function RecipientRow({ name, role, check }) {
  return (
    <div className="m-list-row" style={{ padding: "12px 14px", cursor: "pointer" }}>
      <div className="ic" style={{ background: "var(--cyan-400)", color: "var(--navy-900)", fontWeight: 700, fontSize: 12 }}>
        {name.split(" ").map(s => s[0]).slice(-2).join("")}
      </div>
      <div className="meta">
        <div className="t">{name}</div>
        <div className="s">{role}</div>
      </div>
      <div style={{
        width: 22, height: 22, borderRadius: 6,
        background: check ? "var(--cyan-400)" : "transparent",
        border: "1.5px solid " + (check ? "var(--cyan-400)" : "var(--stroke-3)"),
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--navy-900)"
      }}>
        {check && <MIcon name="check" size={13}/>}
      </div>
    </div>
  );
}

Object.assign(window, {
  ProtoAiList, ProtoAiDraft, ProtoDraftCard,
  ProtoBriefing, BriefingIndex, BriefingBuilder, BriefingGenerating, BriefingPreview, BriefingShare, BriefingPdfPage
});
                                                                                                                                                                                                                                                            