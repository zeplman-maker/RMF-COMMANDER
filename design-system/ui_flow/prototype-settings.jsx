/* global React */

/* ===================================================
   Settings — 2-screen flow (overview → drill-down)
   sub: "overview" | "account" | "security" | "notif" | "privacy"
   plus wipeOpen overlay layered on top.
   =================================================== */
function ProtoSettings({ onTab, wipeOpen, onShowWipe, onCancelWipe, onSignOut }) {
  const [sub, setSub] = React.useState("overview");

  // Local switch state lives here so it persists when drilling in/out.
  const [notif, setNotif] = React.useState({ ato: true, poam: true, ai: true, workflow: false });
  const [reauthAi, setReauthAi] = React.useState(true);

  return (
    <>
      {sub === "overview" && <SettingsOverview
        onTab={onTab}
        onSection={setSub}
        onShowWipe={onShowWipe}
        onSignOut={onSignOut}
        notifOn={Object.values(notif).filter(Boolean).length}
      />}
      {sub === "account"  && <SettingsDrill title="Account"        eyebrow="ROLES · ORG · AUTH PACKAGE"
                              onBack={() => setSub("overview")}><AccountPanel/></SettingsDrill>}
      {sub === "security" && <SettingsDrill title="Security & session" eyebrow="CREDENTIALS · LOCK · WIPE"
                              onBack={() => setSub("overview")}><SecurityPanel reauthAi={reauthAi} setReauthAi={setReauthAi} onShowWipe={onShowWipe}/></SettingsDrill>}
      {sub === "notif"    && <SettingsDrill title="Notifications"  eyebrow="WHEN WE PING YOU"
                              onBack={() => setSub("overview")}><NotifPanel notif={notif} setNotif={setNotif}/></SettingsDrill>}
      {sub === "privacy"  && <SettingsDrill title="Data & privacy" eyebrow="AUDIT · SCOPE · ABOUT"
                              onBack={() => setSub("overview")}><PrivacyPanel/></SettingsDrill>}

      {wipeOpen && <ProtoWipeOverlay onCancel={onCancelWipe} onSignOut={onSignOut} />}

      {sub === "overview" && <MTabBar current="more" onNav={(id) => onTab(id === "more" ? "settings" : id)} />}
    </>
  );
}

/* ---------- OVERVIEW ---------- */
function SettingsOverview({ onTab, onSection, onShowWipe, onSignOut, notifOn }) {
  return (
    <>
      <MHeader eyebrow="ACCOUNT · SECURITY · DATA" title="Settings"/>
      <main className="m-body">
        <div className="m-profile">
          <div className="avatar">LC</div>
          <div className="meta" style={{ flex: 1 }}>
            <div className="name">Maj. Leo Christie</div>
            <div className="role">ISSM · NH-III</div>
            <div className="email">christie.leo.a.civ@us.af.mil</div>
          </div>
        </div>

        <div className="m-session-pill">
          <MIcon name="key-round" size={13}/>
          <span className="label">Session</span>
          <span className="v">14 : 32</span>
          <span style={{ color: "var(--fg-3)", marginLeft: 4 }}>· Purebred · MDM ✓</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <CategoryCard
            ic="id-card" tone="cyan"
            title="Account"
            sub="ISSM on 26 systems · 1 ISSO assignment"
            chips={["AFSVC · VTOS", "Pkg #88421"]}
            onClick={() => onSection("account")}
          />
          <CategoryCard
            ic="lock-keyhole" tone="cyan"
            title="Security & session"
            sub="Purebred credential · 5-min auto-lock · re-auth on AI approvals"
            chips={["EXPIRES SEPT 2026", "MDM ✓"]}
            onClick={() => onSection("security")}
          />
          <CategoryCard
            ic="bell" tone="cyan"
            title="Notifications"
            sub={`${notifOn} of 4 channels on`}
            chips={["ATO · POA&M · AI"]}
            onClick={() => onSection("notif")}
          />
          <CategoryCard
            ic="scroll" tone="cyan"
            title="Data & privacy"
            sub="1-year audit retention · mock data only in pilot"
            chips={["v0.4.1-pilot", "DAY 41 OF 90"]}
            onClick={() => onSection("privacy")}
          />
        </div>

        <button className="m-btn m-btn-secondary"
                style={{ background: "transparent", color: "var(--critical-400)", borderColor: "rgba(239,68,68,0.32)", marginTop: 4 }}
                onClick={onSignOut}>
          <MIcon name="log-out" size={16}/> Sign out and wipe session
        </button>
      </main>
    </>
  );
}

function CategoryCard({ ic, tone, title, sub, chips, onClick }) {
  return (
    <div className="m-card" style={{ padding: 16, cursor: "pointer" }} onClick={onClick}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: tone === "cyan" ? "rgba(34,211,238,0.12)" : "var(--surface-2)",
          color: tone === "cyan" ? "var(--cyan-400)" : "var(--fg-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: tone === "cyan" ? "1px solid rgba(34,211,238,0.32)" : "1px solid var(--stroke-2)"
        }}>
          <MIcon name={ic} size={18}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.005em", lineHeight: 1.25 }}>{title}</div>
          <div style={{ fontSize: 12.5, color: "var(--fg-2)", marginTop: 4, lineHeight: 1.45 }} dangerouslySetInnerHTML={{ __html: sub }}/>
          {chips && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {chips.map(c => <span key={c} className="m-chip">{c}</span>)}
            </div>
          )}
        </div>
        <span className="chev" style={{ color: "var(--fg-3)", paddingTop: 14 }}><MIcon name="chevron-right" size={16}/></span>
      </div>
    </div>
  );
}

/* ---------- Drill-down shell ---------- */
function SettingsDrill({ title, eyebrow, onBack, children }) {
  return (
    <>
      <MHeader leftIcon="chevron-left" leftOnClick={onBack} eyebrow={eyebrow} title={title}/>
      <main className="m-body">{children}</main>
    </>
  );
}

/* ---------- ACCOUNT panel ---------- */
function AccountPanel() {
  return (
    <>
      <div className="m-settings-section">
        <div className="group-h">Identity</div>
        <div className="m-list">
          <SetRowProto icon="id-card" tone="cyan" title="Maj. Leo Christie" sub="ISSM · NH-III · DoD ID 1024…" />
          <SetRowProto icon="globe" title="Air Force Services Center" sub="VTOS / Cybersecurity Division" />
          <SetRowProto icon="key-round" title="CAC certificate" sub="CN=CHRISTIE.LEO.A · expires Sept 2027" />
        </div>
      </div>

      <div className="m-settings-section">
        <div className="group-h">Assignments</div>
        <div className="m-list">
          <SetRowProto icon="layout" tone="cyan" title="26 systems" sub="ISSM of record"
                       rightEl={<span className="m-chip">VIEW</span>}/>
          <SetRowProto icon="user" title="1 ISSO delegation" sub="AFSVC-NAFI-014 · T. Park"
                       rightEl={<span className="m-chip">MANAGE</span>}/>
          <SetRowProto icon="file-text" title="Authorization package" sub="RMF Commander · pkg #88421" />
        </div>
      </div>

      <div className="m-settings-section">
        <div className="group-h">Contact</div>
        <div className="m-list">
          <SetRowProto icon="info" title="christie.leo.a.civ@us.af.mil"
                       rightEl={<span className="m-chip">PRIMARY</span>}/>
          <SetRowProto icon="smartphone" title="Mobile phone" sub="(210) 555-•••• · MDM-enrolled" />
        </div>
      </div>
    </>
  );
}

/* ---------- SECURITY panel ---------- */
function SecurityPanel({ reauthAi, setReauthAi, onShowWipe }) {
  return (
    <>
      <div className="m-card" style={{ padding: 14, background: "rgba(34,211,238,0.04)", borderColor: "rgba(34,211,238,0.32)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(34,211,238,0.16)", color: "var(--cyan-400)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(34,211,238,0.32)" }}>
            <MIcon name="key-round" size={18}/>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Derived credential active</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", letterSpacing: ".05em", textTransform: "uppercase", marginTop: 3 }}>PUREBRED · EXPIRES SEPT 2026</div>
          </div>
        </div>
      </div>

      <div className="m-settings-section">
        <div className="group-h">Credential</div>
        <div className="m-list">
          <SetRowProto icon="key-round" tone="cyan" title="Reissue derived credential" sub="Triggers a fresh Purebred enrollment" />
          <SetRowProto icon="id-card" title="View CAC certificate chain" />
        </div>
      </div>

      <div className="m-settings-section">
        <div className="group-h">Session policy</div>
        <div className="m-list">
          <SetRowProto icon="lock-keyhole" title="Auto-lock after background"
                  rightEl={<span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--cyan-400)" }}>5 min</span>} />
          <SetRowProto icon="shield" title="Re-auth for AI approvals" sub="Require CAC tap before approving any AI-drafted output"
                  rightEl={<span className={"m-switch" + (reauthAi ? " on" : "")} onClick={(e) => { e.stopPropagation(); setReauthAi(v => !v); }}></span>} />
          <SetRowProto icon="alert-triangle" tone="warn" title="Preview session-wipe behavior"
                       sub="See what happens when the app backgrounds for 5 min."
                       onClick={onShowWipe}/>
        </div>
      </div>

      <div className="m-settings-section">
        <div className="group-h">Device</div>
        <div className="m-list">
          <SetRowProto icon="smartphone" title="iPhone 14 · MDM-enrolled" sub="Last attestation 02:47 ago"
                       rightEl={<span className="m-badge success">OK</span>}/>
          <SetRowProto icon="cloud-cog" title="Cloud boundary" sub="Azure Gov IL4 · NIPRNET" />
        </div>
      </div>
    </>
  );
}

/* ---------- NOTIFICATIONS panel ---------- */
function NotifPanel({ notif, setNotif }) {
  const toggle = (k) => setNotif(n => ({ ...n, [k]: !n[k] }));
  return (
    <>
      <div className="m-card" style={{ padding: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <MIcon name="info" size={16} color="var(--info-400)"/>
          <div style={{ fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5 }}>
            Notification payloads are limited to <strong style={{ color: "var(--fg-1)" }}>system name + alert type</strong>. Full detail requires an authenticated session.
          </div>
        </div>
      </div>

      <div className="m-settings-section">
        <div className="group-h">Operational alerts</div>
        <div className="m-list">
          <ToggleRow ic="bell" tone="cyan" label="ATO window alerts" hint="90 / 60 / 30 day countdown" on={notif.ato} onChange={() => toggle("ato")}/>
          <ToggleRow ic="clipboard" label="POA&amp;M milestone slips" hint="When a finding misses its scheduled date" on={notif.poam} onChange={() => toggle("poam")}/>
          <ToggleRow ic="cloud-cog" label="eMASS workflow changes" hint="SAR returned, package state change, etc." on={notif.workflow} onChange={() => toggle("workflow")}/>
        </div>
      </div>

      <div className="m-settings-section">
        <div className="group-h">AI drafts</div>
        <div className="m-list">
          <ToggleRow ic="sparkles" tone="cyan" label="Draft ready to review" hint="Required for the human-approval gate to flow" on={notif.ai} onChange={() => toggle("ai")}/>
        </div>
      </div>

      <div className="m-settings-section">
        <div className="group-h">Quiet hours</div>
        <div className="m-list">
          <SetRowProto icon="lock-keyhole" title="Do not disturb"
                       rightEl={<span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)" }}>22:00 – 06:00</span>}/>
          <SetRowProto icon="shield-alert" tone="crit" title="Override for CAT I critical" sub="Always notify, even in quiet hours"
                       rightEl={<span className="m-switch on"></span>}/>
        </div>
      </div>
    </>
  );
}

function ToggleRow({ label, hint, on, onChange, ic, tone }) {
  return (
    <div className="m-list-row" style={{ padding: "12px 0", cursor: "pointer" }} onClick={onChange}>
      <div className={"ic" + (tone ? " " + tone : "")}><MIcon name={ic} size={16}/></div>
      <div className="meta">
        <div className="t" dangerouslySetInnerHTML={{ __html: label }}/>
        {hint && <div className="s" dangerouslySetInnerHTML={{ __html: hint }}/>}
      </div>
      <span className={"m-switch" + (on ? " on" : "")}></span>
    </div>
  );
}

/* ---------- PRIVACY panel ---------- */
function PrivacyPanel() {
  return (
    <>
      <div className="m-settings-section">
        <div className="group-h">Audit trail</div>
        <div className="m-list">
          <SetRowProto icon="scroll" tone="cyan" title="My audit trail" sub="All API calls, AI prompts, approvals · 1-year retention" />
          <SetRowProto icon="file-text" title="Export my audit log" sub="JSON · last 30 days" />
        </div>
      </div>

      <div className="m-settings-section">
        <div className="group-h">Scope</div>
        <div className="m-list">
          <SetRowProto icon="eye" title="What this app can see" sub="Authorized eMASS data only · no production data in pilot" />
          <SetRowProto icon="shield" title="Data residency" sub="Azure Gov IL4 · CONUS" />
          <SetRowProto icon="cloud-cog" title="AI inference boundary" sub="All inference stays in DoD cloud · no external LLMs" />
        </div>
      </div>

      <div className="m-settings-section">
        <div className="group-h">About</div>
        <div className="m-list">
          <SetRowProto icon="info" title="Build" sub="v0.4.1-pilot · Day 41 of 90 · mock data" />
          <SetRowProto icon="file-text" title="Terms &amp; consent banner" />
          <SetRowProto icon="globe" title="Open-source licenses" />
        </div>
      </div>
    </>
  );
}

/* ---------- Shared row + wipe overlay ---------- */
function SetRowProto({ icon, tone, title, sub, rightEl, onClick }) {
  return (
    <div className="m-list-row" onClick={onClick} style={onClick ? { cursor: "pointer" } : {}}>
      <div className={"ic" + (tone ? " " + tone : "")}><MIcon name={icon} size={16}/></div>
      <div className="meta">
        <div className="t" dangerouslySetInnerHTML={{ __html: title }}/>
        {sub && <div className="s" dangerouslySetInnerHTML={{ __html: sub }}/>}
      </div>
      {rightEl || <span className="chev"><MIcon name="chevron-right" size={16}/></span>}
    </div>
  );
}

function ProtoWipeOverlay({ onCancel, onSignOut }) {
  const [s, setS] = React.useState(4);
  React.useEffect(() => {
    if (s <= 0) { onSignOut && onSignOut(); return; }
    const id = setTimeout(() => setS(x => x - 1), 1000);
    return () => clearTimeout(id);
  }, [s]);
  return (
    <div className="m-wipe-overlay">
      <div className="m-wipe-card">
        <div className="ic"><MIcon name="alert-triangle" size={28}/></div>
        <div className="h">Session wiping</div>
        <div className="countdown">00 : 0{Math.max(0, s)}</div>
        <div className="p">App was backgrounded. eMASS data clears in {s} seconds. Tap below to keep your session.</div>
        <div style={{ display: "flex", gap: 8, width: "100%", marginTop: 4 }}>
          <button className="m-btn m-btn-secondary" style={{ flex: 1 }} onClick={onSignOut}>Wipe now</button>
          <button className="m-btn m-btn-primary" style={{ flex: 1 }} onClick={onCancel}>Keep session</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ProtoSettings, SettingsOverview, SettingsDrill,
  AccountPanel, SecurityPanel, NotifPanel, PrivacyPanel,
  CategoryCard, SetRowProto, ProtoWipeOverlay
});
