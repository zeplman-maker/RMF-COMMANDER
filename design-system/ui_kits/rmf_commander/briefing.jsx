/* global React */
const { useState } = React;

/* ===================================================
   EXECUTIVE BRIEFING GENERATOR
   =================================================== */
function BriefingScreen({ onBack }) {
  return (
    <div className="rmf-work">
      <header className="rmf-work-head" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="rmf-eyebrow">EXECUTIVE BRIEFING GENERATOR · 30-DAY AO TOUCHPOINT</div>
          <h1>AO posture briefing</h1>
          <div className="rmf-row" style={{ gap: 10, marginTop: 10 }}>
            <Chip>AS OF 22 MAY 2026</Chip>
            <Chip>26 SYSTEMS</Chip>
            <Chip>PILOT DAY 41</Chip>
          </div>
        </div>
        <div className="actions">
          <Button variant="secondary" icon="refresh" size="md">Regenerate</Button>
          <Button variant="secondary" icon="download" size="md">PDF</Button>
          <Button variant="primary" icon="download" size="md">PPTX</Button>
        </div>
      </header>

      <div className="rmf-grid-2" style={{ gap: 16 }}>
        <BriefSlide
          eyebrow="01 · AO TOUCHPOINT — 22 MAY 2026"
          h="Portfolio posture summary"
          stats={[
            { num: "26", lab: "Systems" },
            { num: "3", lab: "In 90-day window" },
            { num: "2", lab: "CAT I open" },
          ]} />
        <BriefSlide
          eyebrow="02 · ATO PIPELINE"
          h="Renewals in next 60 days"
          stats={[
            { num: "12 d", lab: "AFSVC-MWR-007" },
            { num: "47 d", lab: "AFSVC-NAFI-014" },
            { num: "73 d", lab: "AFSVC-CLUBS-005" },
          ]} />
        <BriefSlide
          eyebrow="03 · AI ASSIST METRICS"
          h="Drafting throughput vs. baseline"
          stats={[
            { num: "73%", lab: "Drafts accepted" },
            { num: "100%", lab: "Source-citation rate" },
            { num: "0", lab: "Boundary violations" },
          ]} />
        <BriefSlide
          eyebrow="04 · DECISIONS REQUESTED"
          h="For AO review at next touchpoint"
          stats={[
            { num: "1", lab: "IATT for FSS-021" },
            { num: "2", lab: "POA&M extensions" },
            { num: "0", lab: "Scope expansions" },
          ]} />
      </div>

      <div className="rmf-card" style={{ padding: 18, marginTop: 16 }}>
        <div className="rmf-row" style={{ gap: 10, marginBottom: 10 }}>
          <Icon name="sparkles" size={14} className="rmf-mono" /><div className="rmf-eyebrow">AI-DRAFTED NARRATIVE · REQUIRES ISSM APPROVAL</div>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.65 }}>
          Portfolio posture is stable. Three systems are within the 90-day ATO window and one (AFSVC-FSS-021) has slipped
          into IATT territory; the recommended action is a 60-day IATT extension while the renewal package completes review.
          AI drafting has been used on <strong>23 control statements</strong> across the portfolio, of which <strong>73%</strong>
          were accepted by the responsible ISSM with no or only minor edits. Source-citation rate is at 100%, and the
          human-approval gate has not been bypassed at any point during the pilot.
        </p>
        <div className="rmf-row" style={{ gap: 8, marginTop: 14 }}>
          <Button variant="secondary" size="md">Edit narrative</Button>
          <Button variant="primary" size="md" icon="check">Approve & lock briefing</Button>
        </div>
      </div>
    </div>
  );
}

function BriefSlide({ eyebrow, h, stats }) {
  return (
    <div className="rmf-brief-page">
      <div className="rmf-brief-banner">UNCLASSIFIED // FOR OFFICIAL USE ONLY</div>
      <div className="rmf-brief-eyebrow">{eyebrow}</div>
      <div className="rmf-brief-h">{h}</div>
      <div className="rmf-brief-grid">
        {stats.map((s, i) => (
          <div key={i} className="rmf-brief-stat">
            <div className="num">{s.num}</div>
            <div className="lab">{s.lab}</div>
          </div>
        ))}
      </div>
      <div className="rmf-brief-foot">UNCLASSIFIED // FOR OFFICIAL USE ONLY</div>
    </div>
  );
}

Object.assign(window, { BriefingScreen, BriefSlide });
