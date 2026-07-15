/* global React */
const { useState } = React;

/* ===================================================
   PROFILE & SETTINGS
   variant: "default" | "wipe" (shows session-wipe overlay)
   =================================================== */
function SettingsScreen({ variant = "default" }) {
  return (
    <div className="m-screen">
      <MBannerTop />
      <MHeader
        eyebrow="ACCOUNT · SECURITY · DATA"
        title="Settings"
      />

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

        <div className="m-settings-section">
          <div className="group-h">Account</div>
          <div className="m-list">
            <SetRow icon="id-card" tone="cyan" title="Roles &amp; assignments" sub="ISSM on 26 systems · 1 ISSO assignment" />
            <SetRow icon="globe" title="Organization" sub="AFSVC · VTOS / Cybersecurity Division" />
            <SetRow icon="file-text" title="Authorization package" sub="RMF Commander · pkg #88421" />
          </div>
        </div>

        <div className="m-settings-section">
          <div className="group-h">Security &amp; session</div>
          <div className="m-list">
            <SetRow icon="key-round" tone="cyan" title="Derived credential" sub="Purebred · expires Sept 2026" />
            <SetRow icon="lock-keyhole" title="Auto-lock after background"
                    rightEl={<span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--cyan-400)" }}>5 min</span>} />
            <SetRow icon="shield" title="Re-auth for AI approvals"
                    rightEl={<span className="m-switch on"></span>} />
            <SetRow icon="alert-triangle" tone="warn" title="Session wipe behavior" sub="Full memory wipe · no eMASS data persisted" />
          </div>
        </div>

        <div className="m-settings-section">
          <div className="group-h">Notifications</div>
          <div className="m-list">
            <SetRow icon="bell" tone="cyan" title="ATO window alerts"
                    rightEl={<span className="m-switch on"></span>} />
            <SetRow icon="clipboard" title="POA&amp;M milestone slips"
                    rightEl={<span className="m-switch on"></span>} />
            <SetRow icon="sparkles" title="AI draft ready to review"
                    rightEl={<span className="m-switch on"></span>} />
            <SetRow icon="cloud-cog" title="eMASS workflow changes"
                    rightEl={<span className="m-switch"></span>} />
          </div>
        </div>

        <div className="m-settings-section">
          <div className="group-h">Data &amp; privacy</div>
          <div className="m-list">
            <SetRow icon="scroll" title="My audit trail" sub="All API calls, AI prompts, approvals · 1-year retention" />
            <SetRow icon="eye" title="What this app sees" sub="Authorized eMASS data only · no production data in pilot" />
            <SetRow icon="info" title="About this build" sub="v0.4.1-pilot · Day 41 of 90 · mock data" />
          </div>
        </div>

        <button className="m-btn m-btn-secondary" style={{ background: "transparent", color: "var(--critical-400)", borderColor: "rgba(239,68,68,0.32)" }}>
          <MIcon name="log-out" size={16}/> Sign out and wipe session
        </button>
      </main>

      {variant === "wipe" && <SessionWipeOverlay seconds={4} />}

      <MTabBar current="more" onNav={() => {}} />
      <MBannerBottom />
    </div>
  );
}

function SetRow({ icon, tone, title, sub, rightEl }) {
  return (
    <div className="m-list-row">
      <div className={"ic" + (tone ? " " + tone : "")}><MIcon name={icon} size={16}/></div>
      <div className="meta">
        <div className="t" dangerouslySetInnerHTML={{ __html: title }}/>
        {sub && <div className="s" dangerouslySetInnerHTML={{ __html: sub }}/>}
      </div>
      {rightEl || <span className="chev"><MIcon name="chevron-right" size={16}/></span>}
    </div>
  );
}

/* Session-wipe modal overlay — used for the "5-min background" countdown */
function SessionWipeOverlay({ seconds = 4 }) {
  return (
    <div className="m-wipe-overlay">
      <div className="m-wipe-card">
        <div className="ic"><MIcon name="alert-triangle" size={28}/></div>
        <div className="h">Session wiping</div>
        <div className="countdown">00 : 0{seconds}</div>
        <div className="p">App was backgrounded. eMASS data clears in {seconds} seconds. Tap below to keep your session.</div>
        <div style={{ display: "flex", gap: 8, width: "100%", marginTop: 4 }}>
          <button className="m-btn m-btn-secondary" style={{ flex: 1 }}>Wipe now</button>
          <button className="m-btn m-btn-primary" style={{ flex: 1 }}>Keep session</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SettingsScreen, SessionWipeOverlay });
