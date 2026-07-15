/* global React */
const { useState } = React;

/* ===================================================
   LOGIN — CAC/PIV-derived credential via Purebred
   =================================================== */
function LoginScreen({ onSignIn }) {
  const [state, setState] = useState("idle");
  const sign = () => {
    setState("auth");
    setTimeout(() => { setState("done"); onSignIn && onSignIn(); }, 800);
  };
  return (
    <div className="rmf-app">
      <ClassBanner />
      <div></div>
      <div className="rmf-login">
        <div className="rmf-login-card">
          <div className="rmf-login-brand">
            <Monogram size={36} color="var(--cyan-400)" />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" }}>RMF</div>
              <div className="rmf-mono" style={{ fontSize: 10.5, letterSpacing: "3px", opacity: 0.75, marginTop: 2 }}>COMMANDER</div>
            </div>
          </div>

          <div>
            <div className="rmf-login-h">Sign in to your portfolio</div>
            <div className="rmf-login-sub" style={{ marginTop: 8 }}>
              CAC/PIV-derived credential via <span className="rmf-mono" style={{ color: "var(--fg-1)" }}>Purebred</span> on an
              MDM-enrolled device. Sessions last 15 minutes and wipe after 5 minutes in the background.
            </div>
          </div>

          <div className="rmf-login-cac">
            <div className="ic"><Icon name="key-round" size={28} /></div>
            <div className="meta">
              <div className="t">{state === "done" ? "Credential verified" : "Derived credential detected"}</div>
              <div className="s">{state === "done" ? "MAJ. L. CHRISTIE · ISSM · NH-III" : "PUREBRED · CN=CHRISTIE.LEO.A · DOD ID"}</div>
            </div>
          </div>

          <Button variant="primary" size="lg" icon={state === "done" ? "check" : "shield-check"} onClick={sign} disabled={state !== "idle"}>
            {state === "idle" ? "Sign in with CAC/PIV" : state === "auth" ? "Authenticating…" : "Signed in"}
          </Button>

          <div className="rmf-login-foot">
            UNCLASSIFIED // FOUO · NIST AI RMF 1.0 ALIGNED<br/>
            BY USING THIS SYSTEM YOU CONSENT TO MONITORING
          </div>
        </div>
      </div>
      <div></div>
      <ClassBanner />
    </div>
  );
}

Object.assign(window, { LoginScreen });
