/* global React */
const { useState } = React;

/* ===================================================
   ONBOARDING — 3-step welcome
   Each step is its own component; the user steps through.
   =================================================== */

function OnboardWelcome() {
  return (
    <div className="m-screen">
      <MBannerTop />
      <div className="m-onb">
        <div className="m-onb-top">
          <MMonogram size={36} color="var(--cyan-400)" />
          <button className="m-onb-skip">Skip</button>
        </div>

        <div className="m-onb-body">
          <div className="m-onb-icon">
            <MIcon name="layout" size={40} />
          </div>
          <div className="m-onb-eyebrow">STEP 01 OF 03</div>
          <div className="m-onb-h">Your portfolio,<br/>from anywhere.</div>
          <div className="m-onb-p">
            Real-time visibility into the RMF systems you own — ATO timelines, POA&amp;M risk, control posture, scan freshness.
            Designed for the field, not the workstation.
          </div>
        </div>

        <div className="m-onb-foot">
          <div className="m-onb-dots">
            <span className="m-onb-dot active"/>
            <span className="m-onb-dot"/>
            <span className="m-onb-dot"/>
          </div>
          <button className="m-btn m-btn-primary">Next <MIcon name="arrow-right" size={16}/></button>
        </div>
      </div>
      <MBannerBottom />
    </div>
  );
}

function OnboardAi() {
  return (
    <div className="m-screen">
      <MBannerTop />
      <div className="m-onb">
        <div className="m-onb-top">
          <MMonogram size={36} color="var(--cyan-400)" />
          <button className="m-onb-skip">Skip</button>
        </div>

        <div className="m-onb-body">
          <div className="m-onb-icon">
            <MIcon name="sparkles" size={40} />
          </div>
          <div className="m-onb-eyebrow">STEP 02 OF 03</div>
          <div className="m-onb-h">AI drafts.<br/>You decide.</div>
          <div className="m-onb-p">
            The assistant drafts control statements, POA&amp;M language, and briefings — every output cited, every word reviewable.
          </div>
          <div className="m-onb-bullets">
            <div className="m-onb-bullet"><span className="check"><MIcon name="check" size={11}/></span>Grounded in NIST SP 800-53 Rev. 5</div>
            <div className="m-onb-bullet"><span className="check"><MIcon name="check" size={11}/></span>Source citations on every claim</div>
            <div className="m-onb-bullet"><span className="check"><MIcon name="check" size={11}/></span>Human approval gate cannot be bypassed</div>
          </div>
        </div>

        <div className="m-onb-foot">
          <div className="m-onb-dots">
            <span className="m-onb-dot"/>
            <span className="m-onb-dot active"/>
            <span className="m-onb-dot"/>
          </div>
          <button className="m-btn m-btn-primary">Next <MIcon name="arrow-right" size={16}/></button>
        </div>
      </div>
      <MBannerBottom />
    </div>
  );
}

function OnboardSecurity() {
  return (
    <div className="m-screen">
      <MBannerTop />
      <div className="m-onb">
        <div className="m-onb-top">
          <MMonogram size={36} color="var(--cyan-400)" />
          <button className="m-onb-skip">Skip</button>
        </div>

        <div className="m-onb-body">
          <div className="m-onb-icon">
            <MIcon name="lock-keyhole" size={40} />
          </div>
          <div className="m-onb-eyebrow">STEP 03 OF 03</div>
          <div className="m-onb-h">Built for IL4<br/>boundaries.</div>
          <div className="m-onb-p">
            CAC/PIV-derived credentials. DoD-authorized cloud. Zero device persistence.
            Session wipes after 5 minutes in the background.
          </div>
          <div className="m-onb-bullets">
            <div className="m-onb-bullet"><span className="check"><MIcon name="check" size={11}/></span>Purebred derived credential</div>
            <div className="m-onb-bullet"><span className="check"><MIcon name="check" size={11}/></span>MDM enrollment required</div>
            <div className="m-onb-bullet"><span className="check"><MIcon name="check" size={11}/></span>15-minute JWT · TLS 1.3</div>
          </div>
        </div>

        <div className="m-onb-foot">
          <div className="m-onb-dots">
            <span className="m-onb-dot"/>
            <span className="m-onb-dot"/>
            <span className="m-onb-dot active"/>
          </div>
          <button className="m-btn m-btn-primary">Sign in with CAC/PIV <MIcon name="arrow-right" size={16}/></button>
        </div>
      </div>
      <MBannerBottom />
    </div>
  );
}

/* ===================================================
   SIGN IN — three states: idle, detected, signed-in
   =================================================== */
function SignInScreen({ state = "detected" }) {
  return (
    <div className="m-screen">
      <MBannerTop />
      <div className="m-signin">
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

            {state === "idle" && (
              <div className="m-card" style={{ background: "var(--surface-2)", textAlign: "center", padding: "20px 16px" }}>
                <MIcon name="smartphone" size={28} color="var(--fg-3)"/>
                <div style={{ marginTop: 10, fontSize: 13.5, fontWeight: 500 }}>Plug in or tap your CAC</div>
                <div style={{ marginTop: 4, fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", letterSpacing: ".06em", textTransform: "uppercase" }}>WAITING FOR DERIVED CREDENTIAL</div>
              </div>
            )}

            {state === "detected" && (
              <div className="cac detected">
                <span className="cac-ic"><MIcon name="key-round" size={28}/></span>
                <div>
                  <div className="t">Derived credential detected</div>
                  <div className="s">CN=CHRISTIE.LEO.A · DoD ID 1024…</div>
                </div>
                <span className="m-badge cyan nodot" style={{ marginLeft: "auto" }}>VERIFIED</span>
              </div>
            )}

            {state === "signed-in" && (
              <div className="cac detected">
                <span className="cac-ic" style={{ color: "var(--success-400)" }}><MIcon name="check-circle" size={28}/></span>
                <div>
                  <div className="t">Welcome, Maj. Christie</div>
                  <div className="s">ISSM · NH-III · SESSION 14:59</div>
                </div>
              </div>
            )}

            {state === "error" && (
              <div className="cac" style={{ borderColor: "rgba(239,68,68,0.45)" }}>
                <span className="cac-ic" style={{ color: "var(--critical-400)" }}><MIcon name="alert-circle" size={28}/></span>
                <div>
                  <div className="t" style={{ color: "var(--critical-400)" }}>Credential rejected</div>
                  <div className="s">DEVICE NOT ENROLLED · CONTACT YOUR ISSO</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button className={"m-btn m-btn-primary" + (state === "detected" ? " is-pressed" : "")}
                  disabled={state === "idle" || state === "error"}>
            {state === "signed-in" ? <><MIcon name="check" size={16}/> Signed in</> :
             state === "detected"  ? <><MIcon name="shield-check" size={16}/> Authenticating…</> :
                                      <><MIcon name="shield-check" size={16}/> Sign in with CAC/PIV</>}
          </button>
          <button className="m-btn m-btn-ghost" style={{ fontSize: 13, padding: 8 }}>Need help signing in?</button>
          <div className="legal">
            UNCLASSIFIED // FOUO · NIST AI RMF 1.0 ALIGNED<br/>
            BY USING THIS SYSTEM YOU CONSENT TO MONITORING
          </div>
        </div>
      </div>
      <MBannerBottom />
    </div>
  );
}

Object.assign(window, { OnboardWelcome, OnboardAi, OnboardSecurity, SignInScreen });
