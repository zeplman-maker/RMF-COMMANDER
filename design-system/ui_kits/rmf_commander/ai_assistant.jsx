/* global React */
const { useState } = React;

/* ===================================================
   AI DOCUMENTATION ASSISTANT
   =================================================== */
function AiAssistantScreen({ onApproved, onBack }) {
  const [state, setState] = useState("review"); // review | approving | approved
  const [edits, setEdits] = useState(null);

  const approve = () => {
    setState("approving");
    setTimeout(() => { setState("approved"); onApproved && onApproved(); }, 700);
  };

  return (
    <div className="rmf-work">
      <button className="rmf-btn rmf-btn-ghost rmf-btn-sm" onClick={onBack} style={{ marginLeft: -8, marginBottom: 12 }}>
        <Icon name="chevron-left" size={13}/> Back to system
      </button>

      <header className="rmf-work-head" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="rmf-eyebrow">AI DOCUMENTATION ASSISTANT · AC-2(3) · AFSVC-NAFI-014</div>
          <h1>Draft control statement</h1>
          <div className="rmf-row" style={{ gap: 10, marginTop: 10 }}>
            <AiLabel/>
            <Chip>NIST SP 800-53 Rev. 5</Chip>
            <Chip>3 PRECEDENTS</Chip>
            <Chip>RAG · GROUNDED</Chip>
          </div>
        </div>
        <div className="actions">
          <Button variant="secondary" icon="refresh" size="md">Regenerate</Button>
          <Button variant="secondary" icon="download" size="md">Export</Button>
        </div>
      </header>

      <div className="rmf-grid-2-3">
        <div className="rmf-stack" style={{ gap: 16 }}>
          <div className="rmf-card" style={{ padding: 16 }}>
            <div className="rmf-eyebrow" style={{ marginBottom: 10 }}>CONTROL</div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>AC-2(3) — Disable Inactive Accounts</div>
            <div style={{ fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5 }}>
              Disable accounts of individuals within an organization-defined time period after the account has been inactive.
            </div>
            <div className="rmf-divider" style={{ margin: "14px 0" }}></div>
            <div className="rmf-eyebrow" style={{ marginBottom: 6 }}>ORG PARAMETERS</div>
            <div className="rmf-stack" style={{ gap: 6, fontSize: 12.5 }}>
              <div><span className="rmf-mono" style={{ color: "var(--fg-3)" }}>AC-2(3)(a):</span> 35 days</div>
              <div><span className="rmf-mono" style={{ color: "var(--fg-3)" }}>SCOPE:</span> All NAFI user accounts</div>
            </div>
          </div>

          <div className="rmf-card" style={{ padding: 16 }}>
            <div className="rmf-eyebrow" style={{ marginBottom: 10 }}>HUMAN APPROVAL GATE</div>
            <div style={{ fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.55 }}>
              All AI output is labeled <span style={{ color: "var(--info-300)", fontWeight: 600 }}>AI-DRAFTED</span> until
              you (or another ISSM/ISSO) explicitly approve it. This gate <strong style={{ color: "var(--fg-1)" }}>cannot be bypassed</strong>.
            </div>
            <div className="rmf-divider" style={{ margin: "14px 0" }}></div>
            <div className="rmf-eyebrow" style={{ marginBottom: 8 }}>NIST AI RMF · MANAGE</div>
            <div className="rmf-stack" style={{ gap: 8, fontSize: 12 }}>
              <div className="rmf-row" style={{ gap: 8 }}><Icon name="check" size={13} className="rmf-mono" /> Source citations on every claim</div>
              <div className="rmf-row" style={{ gap: 8 }}><Icon name="check" size={13} /> No artifact submission without approval</div>
              <div className="rmf-row" style={{ gap: 8 }}><Icon name="check" size={13} /> Output logged with 1-year retention</div>
            </div>
          </div>
        </div>

        <div className="rmf-draft">
          <div className="rmf-draft-head">
            <Icon name="sparkles" size={16} className="rmf-mono" />
            <div style={{ fontSize: 13, fontWeight: 600 }}>AC-2(3) — Implementation statement</div>
            <span className="rmf-spacer"></span>
            <span className="rmf-mono" style={{ fontSize: 11, color: "var(--fg-3)", letterSpacing: ".06em", textTransform: "uppercase" }}>v3 · 02:14 ago</span>
          </div>

          <div className="rmf-draft-body">
            <p>
              All NAFI user accounts on AFSVC-NAFI-014 are governed by an automated lifecycle policy that disables
              accounts inactive for more than <strong>35 calendar days</strong>. Inactivity is measured at the
              identity provider (Azure AD Gov) and confirmed nightly by a privileged script that writes a
              tamper-evident attestation to the audit log <span className="cite">SP 800-53 §AC-2(3)</span>.
            </p>
            <p>
              Service and break-glass accounts are exempted by group membership and are reviewed quarterly
              by the ISSM in coordination with the system owner. Disabled accounts are retained — but
              non-functional — for 90 days to support investigations <span className="cite">SP 800-53 §AU-11</span>.
            </p>
            <p>
              No production eMASS data is referenced by this draft. Reviewers should validate the 35-day
              parameter against the latest VTOS policy memo before approving for submission.
            </p>
            { state === "approved" && (
              <div className="rmf-row" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.32)", borderRadius: 8, padding: "10px 12px", gap: 10, marginTop: 6 }}>
                <Icon name="check" size={16} className="rmf-mono" style={{ color: "var(--success-400)" }}/>
                <div style={{ fontSize: 12.5, color: "var(--success-400)" }}>
                  Approved by <strong>Maj. L. Christie (ISSM)</strong> · ready for SSP insertion. Production submission still requires AO sign-off.
                </div>
              </div>
            )}
          </div>

          <div className="rmf-draft-sources">
            <div className="title">Source citations · {3} cited</div>
            <div className="rmf-draft-source">
              <span className="ref">SP 800-53 §AC-2(3)</span>
              <span className="desc">Disable inactive accounts after organization-defined period</span>
              <Icon name="external-link" size={13}/>
            </div>
            <div className="rmf-draft-source">
              <span className="ref">SP 800-53 §AU-11</span>
              <span className="desc">Audit record retention — investigative needs</span>
              <Icon name="external-link" size={13}/>
            </div>
            <div className="rmf-draft-source">
              <span className="ref">AFSVC-VTOS-001 §AC-2(3)</span>
              <span className="desc">Approved precedent — same control on related system, June 2025</span>
              <Icon name="external-link" size={13}/>
            </div>
          </div>

          <div className="rmf-draft-foot">
            {state !== "approved" ? (
              <>
                <div className="gate-msg">
                  <Icon name="lock-keyhole" size={13} />
                  Awaiting ISSM approval — cannot submit until reviewed
                </div>
                <Button variant="secondary" size="md">Suggest edits</Button>
                <Button variant="primary" size="md" icon="check" onClick={approve} disabled={state === "approving"}>
                  {state === "approving" ? "Approving…" : "Approve as ISSM"}
                </Button>
              </>
            ) : (
              <>
                <div className="gate-msg" style={{ color: "var(--success-400)" }}>
                  <Icon name="check" size={13} />
                  Approved · ready for SSP insertion
                </div>
                <Button variant="secondary" size="md" icon="download">Export to eMASS draft</Button>
                <Button variant="primary" size="md" icon="presentation">Add to AO briefing</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AiAssistantScreen });
                                                                                                                                                                                                                                                                                                                                                                                                  