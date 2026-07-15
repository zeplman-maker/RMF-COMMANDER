/* SystemCard — the signature tile */
function SystemCard({ sys, onClick }) {
  const sev = severityForDays(sys.daysToATO);
  const label = labelForDays(sys.daysToATO);
  return (
    <div className={`sys-card ${sev}`} onClick={onClick}>
      <div className="head">
        <div>
          <div className="name">{sys.id}</div>
          <div className="title">{sys.title}</div>
        </div>
        <Pill tone={sev}>{label}</Pill>
      </div>
      <div className="countdown">
        {pad3(sys.daysToATO)}
        <span className="unit">days to ATO</span>
      </div>
      <div className="meta">
        <span><span className="label">POA&amp;M</span> {sys.poam.high}/{sys.poam.med}/{sys.poam.low}</span>
        <span>·</span>
        <span><span className="label">SCAN</span> {sys.scanDays}d</span>
        <span>·</span>
        <span><span className="label">CAT</span> {sys.cat}</span>
      </div>
    </div>
  );
}
Object.assign(window, { SystemCard });
