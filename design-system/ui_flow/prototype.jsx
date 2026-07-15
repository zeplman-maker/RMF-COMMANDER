/* global React */
const { useState, useEffect, useCallback } = React;

/* ===================================================
   ProtoApp — single-phone click-through prototype.
   Reuses MIcon, MMonogram, MBannerTop/Bottom, MHeader, MTabBar
   from mobile-components.jsx. All other screen markup is inline
   so navigation handlers can be wired without forking the canvas
   screen components.
   =================================================== */

const ROUTES = {
  ONBOARD_1: "onb-welcome",
  ONBOARD_2: "onb-ai",
  ONBOARD_3: "onb-sec",
  SIGNIN:    "signin",
  HOME:      "home",
  ALERTS:    "alerts",
  AI_LIST:   "ai-list",
  AI_DRAFT:  "ai-draft",
  BRIEFING:  "briefing",
  SETTINGS:  "settings",
};

function ProtoApp() {
  const [route, setRoute] = useState(ROUTES.ONBOARD_1);
  const [signinState, setSigninState] = useState("detected");
  const [draftApproved, setDraftApproved] = useState(false);
  const [toast, setToast] = useState(null);
  const [filterCat1, setFilterCat1] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);

  const go = useCallback((r) => setRoute(r), []);
  const fireToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  // Auto-advance signin "authenticating" → home
  useEffect(() => {
    if (route === ROUTES.SIGNIN && signinState === "authenticating") {
      const id = setTimeout(() => { setSigninState("detected"); go(ROUTES.HOME); fireToast("Signed in · session 14:59"); }, 900);
      return () => clearTimeout(id);
    }
  }, [route, signinState, go]);

  // The phone "app" is mounted once; the route swaps which screen renders.
  return (
    <div className="m-screen" data-screen-label={route}>
      <MBannerTop />

      {route === ROUTES.ONBOARD_1 && <ProtoOnboard step={1} onNext={() => go(ROUTES.ONBOARD_2)} onSkip={() => go(ROUTES.SIGNIN)} />}
      {route === ROUTES.ONBOARD_2 && <ProtoOnboard step={2} onNext={() => go(ROUTES.ONBOARD_3)} onSkip={() => go(ROUTES.SIGNIN)} />}
      {route === ROUTES.ONBOARD_3 && <ProtoOnboard step={3} onNext={() => go(ROUTES.SIGNIN)} onSkip={() => go(ROUTES.SIGNIN)} />}

      {route === ROUTES.SIGNIN && <ProtoSignIn
        state={signinState}
        onSign={() => setSigninState("authenticating")}
      />}

      {route === ROUTES.HOME && <ProtoHome
        onTab={(t) => go(t)}
        onOpenAi={() => go(ROUTES.AI_LIST)}
        filter={filterCat1}
        onToggleFilter={() => setFilterCat1(f => !f)}
      />}

      {route === ROUTES.ALERTS && <ProtoAlerts onTab={go} onOpenAi={() => go(ROUTES.AI_LIST)} />}

      {route === ROUTES.AI_LIST && <ProtoAiList
        onTab={go}
        onOpenDraft={() => { setDraftApproved(false); go(ROUTES.AI_DRAFT); }}
      />}

      {route === ROUTES.AI_DRAFT && <ProtoAiDraft
        approved={draftApproved}
        onBack={() => go(ROUTES.AI_LIST)}
        onApprove={() => { setDraftApproved(true); fireToast("Draft approved · locked into audit log"); }}
      />}

      {route === ROUTES.BRIEFING && <ProtoBriefing onTab={go} />}

      {route === ROUTES.SETTINGS && <ProtoSettings
        onTab={go}
        wipeOpen={wipeOpen}
        onShowWipe={() => setWipeOpen(true)}
        onCancelWipe={() => setWipeOpen(false)}
        onSignOut={() => { setWipeOpen(false); fireToast("Signed out · session wiped"); setTimeout(() => go(ROUTES.SIGNIN), 600); }}
      />}

      {toast && (
        <div className="m-toast">
          <span className="ic"><MIcon name="check" size={16}/></span>
          <span className="msg">{toast}</span>
        </div>
      )}

      <MBannerBottom />
    </div>
  );
}

/* ===================================================
   Onboarding (step 1 / 2 / 3 — same shell)
   =================================================== */
const ONB_STEPS = [
  null,
  {
    icon: "layout",
    eyebrow: "STEP 01 OF 03",
    h: <>Your portfolio,<br/>from anywhere.</>,
    p: "Real-time visibility into the RMF systems you own — ATO timelines, POA&M risk, control posture, scan freshness. Designed for the field, not the workstation.",
    next: "Next",
  },
  {
    icon: "sparkles",
    eyebrow: "STEP 02 OF 03",
    h: <>AI drafts.<br/>You decide.</>,
    p: "The assistant drafts control statements, POA&M language, and briefings — every output cited, every word reviewable.",
    bullets: [
      "Grounded in NIST SP 800-53 Rev. 5",
      "Source citations on every claim",
      "Human approval gate cannot be bypassed",
    ],
    next: "Next",
  },
  {
    icon: "lock-keyhole",
    eyebrow: "STEP 03 OF 03",
    h: <>Built for IL4<br/>boundaries.</>,
    p: "CAC/PIV-derived credentials. DoD-authorized cloud. Zero device persistence. Session wipes after 5 minutes in the background.",
    bullets: [
      "Purebred derived credential",
      "MDM enrollment required",
      "15-minute JWT · TLS 1.3",
    ],
    next: "Sign in with CAC/PIV",
  },
];

function ProtoOnboard({ step, onNext, onSkip }) {
  const s = ONB_STEPS[step];
  return (
    <div className="m-onb" style={{ flex: 1 }}>
      <div className="m-onb-top">
        <MMonogram size={36} color="var(--cyan-400)" />
        <button className="m-onb-skip" onClick={onSkip}>Skip</button>
      </div>

      <div className="m-onb-body">
        <div className="m-onb-icon"><MIcon name={s.icon} size={40} /></div>
        <div className="m-onb-eyebrow">{s.eyebrow}</div>
        <div className="m-onb-h">{s.h}</div>
        <div className="m-onb-p">{s.p}</div>
        {s.bullets && (
          <div className="m-onb-bullets">
            {s.bullets.map(b => (
              <div className="m-onb-bullet" key={b}>
                <span className="check"><MIcon name="check" size={11}/></span>{b}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="m-onb-foot">
        <div className="m-onb-dots">
          {[1,2,3].map(i => <span key={i} className={"m-onb-dot" + (i === step ? " active" : "")}/>)}
        </div>
        <button className="m-btn m-btn-primary" onClick={onNext}>
          {s.next} <MIcon name="arrow-right" size={16}/>
        </button>
      </div>
    </div>
  );
}

/* ===================================================
   Sign in
   =================================================== */
function ProtoSignIn({ state, onSign }) {
  return (
    <div className="m-signin" style={{ flex: 1 }}>
      <div>
        <div className="mark">
          <MMonogram size={36} color="var(--cyan-400)" />
          <div className="word">
            <div className="top">RMF</div>
            <div className="bot">COMMANDER</div>
          </div>
        </div>
        <div className="body">
          <h1>Sign in to your portfolio.</h1>
          <div className="sub">
            CAC/PIV-derived credential via <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-1)" }}>Purebred</span> on an MDM-enrolled device. Sessions last 15 minutes.
          </div>
          <div className="cac detected">
            <span className="cac-ic"><MIcon name="key-round" size={28}/></span>
            <div>
              <div className="t">Derived credential detected</div>
              <div className="s">CN=CHRISTIE.LEO.A · DoD ID 1024…</div>
            </div>
            <span className="m-badge cyan nodot" style={{ marginLeft: "auto" }}>VERIFIED</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          className={"m-btn m-btn-primary" + (state === "authenticating" ? " is-pressed" : "")}
          onClick={onSign}
          disabled={state === "authenticating"}
        >
          {state === "authenticating"
            ? <><MIcon name="shield-check" size={16}/> Authenticating…</>
            : <><MIcon name="shield-check" size={16}/> Sign in with CAC/PIV</>}
        </button>
        <button className="m-btn m-btn-ghost" style={{ fontSize: 13, padding: 8 }}>Need help signing in?</button>
        <div className="legal">
          UNCLASSIFIED // FOUO · NIST AI RMF 1.0 ALIGNED<br/>
          BY USING THIS SYSTEM YOU CONSENT TO MONITORING
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProtoApp });
