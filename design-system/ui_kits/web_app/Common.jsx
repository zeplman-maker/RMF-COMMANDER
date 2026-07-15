/* Common — shared atoms for the RMF Commander web kit */

const { useState, useEffect, useMemo } = React;

// Lucide icon helper — assumes lucide global script tag loaded.
function Icon({ name, size = 18, color, style }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = '';
      const i = document.createElement('i');
      i.setAttribute('data-lucide', name);
      ref.current.appendChild(i);
      if (window.lucide) window.lucide.createIcons({ icons: window.lucide.icons });
    }
  }, [name]);
  return (
    <span ref={ref} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, color: color || 'currentColor', ...style
    }} />
  );
}

// Pill
function Pill({ tone = 'neu', square, dot, children, style }) {
  const cls = `pill pill-${tone}${square ? ' pill-square' : ''}`;
  const dotColor = {
    ok: '#15803D', warn: '#B45309', crit: '#B91C1C',
    info: '#1D4ED8', ai: '#6D28D9', neu: '#64748B'
  }[tone];
  return (
    <span className={cls} style={style}>
      {dot ? <span className="dot" style={{ background: dotColor }} /> : null}
      {children}
    </span>
  );
}

// Severity helpers
function severityForDays(d) {
  if (d <= 30) return 'crit';
  if (d <= 60) return 'warn';
  return 'ok';
}
function labelForDays(d) {
  if (d <= 30) return '30-DAY';
  if (d <= 60) return '60-DAY';
  if (d <= 90) return '90-DAY';
  return 'VALID';
}

// Padded number
function pad3(n) { return String(n).padStart(3, '0'); }

// Mock systems dataset — 26 systems to match the proposal scale
const MOCK_SYSTEMS = [
  { id: 'AFSVC-FITNESS-WEB-01',     title: 'Fitness portal',              daysToATO: 274, poam: { high: 0, med: 2, low: 5 }, scanDays: 2,  cat: 'MOD·LOW·LOW' },
  { id: 'AFSVC-LODGING-API-04',     title: 'Lodging reservations API',    daysToATO: 52,  poam: { high: 1, med: 4, low: 9 }, scanDays: 6,  cat: 'MOD·MOD·LOW' },
  { id: 'AFSVC-MWR-INTRANET-02',    title: 'MWR intranet',                daysToATO: 23,  poam: { high: 3, med: 7, low: 12 }, scanDays: 11, cat: 'MOD·MOD·MOD' },
  { id: 'AFSVC-CHILDCARE-WEB-09',   title: 'Childcare scheduling',        daysToATO: 198, poam: { high: 0, med: 1, low: 3 }, scanDays: 4,  cat: 'LOW·LOW·LOW' },
  { id: 'AFSVC-FOODSVC-POS-07',     title: 'Food services POS',           daysToATO: 67,  poam: { high: 0, med: 3, low: 6 }, scanDays: 8,  cat: 'MOD·LOW·LOW' },
  { id: 'AFSVC-CEMETERY-DB-11',     title: 'Cemetery records DB',         daysToATO: 312, poam: { high: 0, med: 0, low: 2 }, scanDays: 1,  cat: 'MOD·LOW·LOW' },
];

const MOCK_ALERTS = [
  { id: 1, tone: 'crit', title: 'AFSVC-MWR-INTRANET-02 — ATO expires in 23 days',     meta: 'Renewal package not yet drafted. Assigned: L. Christie (ISSM).',   time: '08:42 CT' },
  { id: 2, tone: 'warn', title: 'AFSVC-LODGING-API-04 — 60-day ATO window opened',     meta: 'POA&M slip: AC-2 control review overdue 4 days.',                  time: '07:15 CT' },
  { id: 3, tone: 'ai',   title: 'AI draft ready — SI-4 control statement',             meta: 'Grounded in NIST SP 800-53 Rev. 5. Awaiting ISSM review.',          time: 'Yesterday' },
  { id: 4, tone: 'warn', title: 'AFSVC-FOODSVC-POS-07 — Scan freshness past 7 days',   meta: 'ACAS Tenable scan due. Next scheduled: 24 May.',                    time: 'Yesterday' },
  { id: 5, tone: 'ok',   title: 'AFSVC-CEMETERY-DB-11 — Continuous monitoring nominal', meta: 'No outstanding POA&Ms above LOW. Last assessment: 11 May.',         time: '21 May' },
];

const MOCK_POAMS = [
  { id: 'POAM-2024-031', sev: 'HIGH', title: 'AC-2 — Privileged account inventory not reviewed within 30-day cadence', owner: 'L. Christie', milestone: '15 Jun 2026',  status: 'OPEN' },
  { id: 'POAM-2024-029', sev: 'HIGH', title: 'IA-5 — Service account password rotation not automated for 4 accounts',  owner: 'L. Christie', milestone: '01 Jul 2026',  status: 'OPEN' },
  { id: 'POAM-2024-027', sev: 'MED',  title: 'SI-4 — Continuous monitoring sensor coverage gap on staging subnet',     owner: 'R. Mendez',   milestone: '30 Jun 2026',  status: 'IN-WORK' },
  { id: 'POAM-2024-024', sev: 'MED',  title: 'CM-6 — Baseline configuration drift on 2 web nodes',                     owner: 'R. Mendez',   milestone: '22 Jun 2026',  status: 'IN-WORK' },
  { id: 'POAM-2024-021', sev: 'LOW',  title: 'AU-6 — Audit review evidence retention falling below 30 days on 1 host', owner: 'T. Park',     milestone: '12 Jul 2026',  status: 'OPEN' },
];

const MOCK_CONTROLS = [
  { id: 'AC-2',  family: 'Access Control',     status: 'partial',  evidence: 'SSP §3.1 + IAM export 18 May 2026' },
  { id: 'AC-12', family: 'Access Control',     status: 'compliant',evidence: 'SSP §3.4 + session policy artifact'  },
  { id: 'IA-5',  family: 'Identification',     status: 'partial',  evidence: 'Open POA&M-2024-029 — pending rotation' },
  { id: 'SI-4',  family: 'System Integrity',   status: 'compliant',evidence: 'ConMon dashboard, ACAS Tenable scan' },
  { id: 'AU-6',  family: 'Audit & Accountability', status: 'partial', evidence: 'Splunk evidence link — last review 14 May' },
  { id: 'CM-6',  family: 'Configuration Mgmt', status: 'noncompliant', evidence: '2 hosts drifted from baseline' },
  { id: 'CA-7',  family: 'Assessment & Auth',  status: 'compliant',evidence: 'Continuous monitoring strategy approved' },
];

Object.assign(window, {
  Icon, Pill, severityForDays, labelForDays, pad3,
  MOCK_SYSTEMS, MOCK_ALERTS, MOCK_POAMS, MOCK_CONTROLS
});
