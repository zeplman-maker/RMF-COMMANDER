/* global React */

/* ===================================================
   AI ASSISTANT — Key feature
   Variants:
     "list"     — list of drafts requiring review
     "draft"    — viewing one draft, awaiting approval
     "approved" — same draft after approval
   =================================================== */
function AiListScreen() {
  return (
    <div className="m-screen">
      <MBannerTop />
      <MHeader
        eyebrow="3 PENDING REVIEW · ZERO AUTO-SUBMITTED"
        title="AI drafts"
        rightIcons={[{ name: "filter", onClick: () => {} }]}
      />

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
            <DraftCard
              control="AC-2(3)"
              title="Disable inactive accounts after 35 days"
              system="AFSVC-NAFI-014"
              version="v3"
              ago="02:14 ago"
              sources={3}
              priority="ISSM REVIEW"
              active
            />
            <DraftCard
              control="SI-4(4)"
              title="ConMon SIEM rule coverage gap — failed logon spike"
              system="AFSVC-NAFI-014"
              version="v1"
              ago="11:48 ago"
              sources={2}
              priority="ISSO REVIEW"
            />
            <DraftCard
              control="CM-6"
              title="STIG drift — Windows audit policy baseline"
              system="AFSVC-MWR-007"
              version="v2"
              ago="1d ago"
              sources={4}
              priority="ISSM REVIEW"
            />
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

      <MTabBar current="ai" onNav={() => {}} />
      <MBannerBottom />
    </div>
  );
}

function DraftCard({ control, title, system, version, ago, sources, priority, active }) {
  return (
    <div className={"m-card" + (active ? " active" : "")} style={{ padding: 14 }}>
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
   AI DRAFT DETAIL — approval gate + sources
   =================================================== */
function AiDraftScreen({ variant = "draft" }) {
  return (
    <div className="m-screen">
      <MBannerTop />
      <MHeader
        leftIcon="chevron-left"
        eyebrow="AC-2(3) · AFSVC-NAFI-014 · v3"
        title="Disable inactive accounts"
        rightIcons={[{ name: "more-horizontal", onClick: () => {} }]}
      />

      <main className="m-body" style={{ paddingBottom: 140 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span className="m-ailabel"><MIcon name="sparkles" size={9}/>AI-DRAFTED</span>
          <span className="m-chip">NIST SP 800-53</span>
          <span className="m-chip">RAG GROUNDED</span>
        </div>

        <div className="m-draft-body">
          <p>
            All NAFI user accounts on AFSVC-NAFI-014 are governed by an automated lifecycle policy that disables
            accounts inactive for more than <strong>35 calendar days</strong>. Inactivity is measured at the identity
            provider (Azure AD Gov) and confirmed nightly by a privileged script that writes a tamper-evident
            attestation to the audit log <span className="cite">SP 800-53 §AC-2(3)</span>.
          </p>
          <p>
            Service and break-glass accounts are exempted by group membership and reviewed quarterly by the ISSM.
            Disabled accounts are retained — but non-functional — for 90 days to support investigations
            <span className="cite">SP 800-53 §AU-11</span>.
          </p>
        </div>

        <div>
          <div className="m-eyebrow" style={{ marginBottom: 6 }}>SOURCES · {3} CITED</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="m-source">
              <span className="ref">§AC-2(3)</span>
              <span className="desc">Disable inactive accounts after organization-defined period</span>
            </div>
            <div className="m-source">
              <span className="ref">§AU-11</span>
              <span className="desc">Audit record retention — investigative needs</span>
            </div>
            <div className="m-source">
              <span className="ref">VTOS-001</span>
              <span className="desc">Approved precedent — same control, June 2025</span>
            </div>
          </div>
        </div>

        <div className={"m-gate" + (variant === "approved" ? " approved" : "")}>
          {variant === "approved"
            ? <><MIcon name="check" size={13}/> Approved · ready for SSP insertion</>
            : <><MIcon name="lock-keyhole" size={13}/> Awaiting ISSM approval · cannot submit until reviewed</>}
        </div>
      </main>

      <div className="m-actionbar">
        {variant === "approved" ? (
          <>
            <button className="m-btn m-btn-secondary"><MIcon name="download" size={15}/> Export</button>
            <button className="m-btn m-btn-primary"><MIcon name="presentation" size={15}/> Add to briefing</button>
          </>
        ) : (
          <>
            <button className="m-btn m-btn-secondary">Suggest edits</button>
            <button className="m-btn m-btn-primary"><MIcon name="check" size={15}/> Approve as ISSM</button>
          </>
        )}
      </div>

      <MBannerBottom />
    </div>
  );
}

Object.assign(window, { AiListScreen, AiDraftScreen, DraftCard });
                 