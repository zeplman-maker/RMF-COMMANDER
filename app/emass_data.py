"""
Module 3 - eMASS prep data and validator.

The "28 common mistakes" list (FR-3.3) and field-level guidance (FR-3.1) are
illustrative for prototype use. Reconcile against your local AO and ISSM
guidance before treating any item as authoritative. eMASS field rules drift
quarterly.
"""

# ---------------------------------------------------------------------------
# 28 common eMASS data-entry mistakes (FR-3.3)
# ---------------------------------------------------------------------------
COMMON_MISTAKES = [
    {"id": 1,  "area": "system",   "title": "Authorization boundary statement empty",
     "desc": "Every eMASS system record requires a written boundary statement."},
    {"id": 2,  "area": "system",   "title": "ATO type not selected",
     "desc": "Pick Initial / Renewal / IATT / Extension / Continuous; eMASS rejects records without a type."},
    {"id": 3,  "area": "system",   "title": "FIPS 199 ratings inconsistent",
     "desc": "Overall impact must be the high water mark of C/I/A; mismatch triggers eMASS validation errors."},
    {"id": 4,  "area": "system",   "title": "Mission description left blank",
     "desc": "eMASS requires a mission narrative aligned to the supported function."},
    {"id": 5,  "area": "system",   "title": "Data types not identified",
     "desc": "CUI / PII / PHI flags must be set explicitly; missing flags cause overlay misapplication."},
    {"id": 6,  "area": "control",  "title": "Selected control with empty implementation statement",
     "desc": "Every applied control must have a written implementation statement before assessment."},
    {"id": 7,  "area": "control",  "title": "Control marked not_implemented without rationale",
     "desc": "If a control will not be implemented, document the compensating control or risk acceptance."},
    {"id": 8,  "area": "control",  "title": "Common control without inheritance source",
     "desc": "Common controls must reference the providing organization or system."},
    {"id": 9,  "area": "control",  "title": "Hybrid control without responsibility split",
     "desc": "Hybrid means shared responsibility; eMASS expects both organization and system parts documented."},
    {"id":10, "area": "control",  "title": "Implementation statement < 50 characters",
     "desc": "Token statements (e.g. \"see SSP\") are a top assessor finding."},
    {"id":11, "area": "poam",     "title": "POA&M missing scheduled completion date",
     "desc": "eMASS requires a scheduled completion date for every Open POA&M."},
    {"id":12, "area": "poam",     "title": "POA&M missing milestones for items > 30 days",
     "desc": "Long-running POA&Ms must show measurable milestones."},
    {"id":13, "area": "poam",     "title": "POA&M severity blank",
     "desc": "Severity (CAT I/II/III) drives eMASS escalation routing."},
    {"id":14, "area": "poam",     "title": "POA&M risk level blank",
     "desc": "Risk level is a separate eMASS field from severity."},
    {"id":15, "area": "poam",     "title": "POA&M validation method not specified",
     "desc": "How will closure be confirmed - re-scan, examine, test? eMASS expects an answer."},
    {"id":16, "area": "poam",     "title": "POA&M residual risk statement empty",
     "desc": "Document residual risk even if closure removes the finding."},
    {"id":17, "area": "poam",     "title": "POA&M weakness > 400 characters",
     "desc": "eMASS truncates the Weakness field at 400 characters."},
    {"id":18, "area": "poam",     "title": "POA&M closed without ISSM approval",
     "desc": "Closure requires the closure approver field populated."},
    {"id":19, "area": "poam",     "title": "Critical or High vuln without auto-POA&M",
     "desc": "Every Critical / High finding should have a POA&M draft."},
    {"id":20, "area": "vuln",     "title": "Vulnerability source not identified",
     "desc": "Tag every finding ACAS / STIG / SCAP / Manual."},
    {"id":21, "area": "inventory","title": "Hardware inventory missing IP address",
     "desc": "eMASS asset records expect an IP for network-attached components."},
    {"id":22, "area": "inventory","title": "Inventory item missing version",
     "desc": "Version is required for vulnerability mapping."},
    {"id":23, "area": "inventory","title": "OS components missing EOS date",
     "desc": "EOS / EOL date drives lifecycle planning and SCRM analysis."},
    {"id":24, "area": "inventory","title": "SBOM not generated",
     "desc": "SR-3 / SR-4 expect an SBOM with software inventory."},
    {"id":25, "area": "artifact", "title": "Artifact uploaded without approval date",
     "desc": "Approval date drives review-due calculations."},
    {"id":26, "area": "artifact", "title": "Artifact expired but still on register",
     "desc": "Expired artifacts must be superseded or refreshed before eMASS upload."},
    {"id":27, "area": "artifact", "title": "Artifact missing control mappings",
     "desc": "Every artifact uploaded to eMASS should be tied to at least one control."},
    {"id":28, "area": "system",   "title": "eMASS project record link not captured",
     "desc": "The application is not eMASS - capture the project URL or ID for traceability."},
]


# ---------------------------------------------------------------------------
# Field guides keyed by entity (FR-3.1)
# ---------------------------------------------------------------------------
FIELD_GUIDES = {
    "system": {
        "label": "System record",
        "fields": [
            {"name": "Name", "required": True, "format": "Free text",
             "guidance": "Use the official system name as it appears on the appointment letters."},
            {"name": "Acronym", "required": True, "format": "Free text, < 40 chars",
             "guidance": "Include if the system has an acronym; eMASS uses it in reporting."},
            {"name": "ATO type", "required": True,
             "format": "Initial / Renewal / IATT / Extension / Continuous",
             "guidance": "Drives eMASS workflow routing. Cannot be left blank."},
            {"name": "Impact level", "required": True,
             "format": "Low / Moderate / High",
             "guidance": "Must align with the FIPS 199 high water mark across CIA."},
            {"name": "FIPS 199 (C/I/A)", "required": True,
             "format": "Low / Moderate / High per dimension",
             "guidance": "Document each dimension; rationale narrative attached as artifact."},
            {"name": "Authorization boundary", "required": True,
             "format": "Free text",
             "guidance": "What is in scope and what is not. Reference the boundary diagram."},
            {"name": "Mission description", "required": True,
             "format": "Free text",
             "guidance": "Tie to the supported mission or function. Avoid generic language."},
            {"name": "Data types", "required": True,
             "format": "CUI / PII / PHI / FOUO / Public / Operational",
             "guidance": "Check every type processed; drives overlay applicability."},
        ]
    },
    "control": {
        "label": "Control implementation",
        "fields": [
            {"name": "NIST control ID", "required": True,
             "format": "AC-2, RA-5, etc.", "guidance": "Use the canonical 800-53 Rev. 5 ID."},
            {"name": "Implementation status", "required": True,
             "format": "Implemented / Partial / Planned / Not Applicable",
             "guidance": "Cannot stay Planned indefinitely; eMASS flags Plan controls past target ATO date."},
            {"name": "Implementation statement", "required": True,
             "format": "Free text, recommend > 200 chars",
             "guidance": "Describe how the control is satisfied; reference evidence."},
            {"name": "Control type", "required": True,
             "format": "Common / Inherited / Hybrid / System",
             "guidance": "If Common or Inherited, document the providing organization."},
            {"name": "Owner role", "required": True,
             "format": "Role name, e.g. Sysadmin",
             "guidance": "Should match a stakeholder matrix entry."},
        ]
    },
    "poam": {
        "label": "POA&M entry",
        "fields": [
            {"name": "Weakness", "required": True,
             "format": "Free text, < 400 chars",
             "guidance": "Concise description of what is wrong."},
            {"name": "Source of discovery", "required": True,
             "format": "ACAS / STIG / SCA / ISSM / ConMon / Audit / Other",
             "guidance": "How was this finding produced?"},
            {"name": "Severity (CAT)", "required": True,
             "format": "CAT I / CAT II / CAT III",
             "guidance": "Drives eMASS escalation routing."},
            {"name": "Risk level", "required": True,
             "format": "High / Moderate / Low",
             "guidance": "Risk level is separate from severity."},
            {"name": "Date identified", "required": True,
             "format": "YYYY-MM-DD",
             "guidance": "First date the weakness was identified."},
            {"name": "Scheduled completion", "required": True,
             "format": "YYYY-MM-DD",
             "guidance": "Required for every Open POA&M."},
            {"name": "Validation method", "required": True,
             "format": "Free text",
             "guidance": "How will closure be confirmed (re-scan, examine, test)?"},
            {"name": "Residual risk", "required": True,
             "format": "Free text",
             "guidance": "Residual risk after planned mitigation."},
        ]
    },
    "artifact": {
        "label": "Artifact upload",
        "fields": [
            {"name": "Name", "required": True, "format": "Free text",
             "guidance": "Use the canonical artifact name; tie to the 42-template library."},
            {"name": "Version", "required": True, "format": "v[N].[N]",
             "guidance": "Bump major version on substantive change."},
            {"name": "Approval status", "required": True,
             "format": "Draft / In Review / Approved / Rejected / Superseded",
             "guidance": "Only Approved versions belong in the authorization package."},
            {"name": "Approver", "required": True,
             "format": "Free text (role + name)",
             "guidance": "Set automatically when status flips to Approved."},
            {"name": "Approved date", "required": True, "format": "YYYY-MM-DD",
             "guidance": "Drives review-due calculation; > 1 year overdue triggers a flag."},
            {"name": "Expiration date", "required": False, "format": "YYYY-MM-DD",
             "guidance": "For artifacts with a defined refresh cadence (training, ROB)."},
            {"name": "Control mappings", "required": True,
             "format": "List of NIST control IDs",
             "guidance": "Every artifact uploaded to eMASS should map to at least one control."},
            {"name": "eMASS upload location", "required": True, "format": "Free text",
             "guidance": "Helps assessors locate the artifact in eMASS."},
        ]
    },
}


# ---------------------------------------------------------------------------
# Validator (FR-3.2)
# ---------------------------------------------------------------------------
SEV_ERROR = "error"
SEV_WARN  = "warn"
SEV_INFO  = "info"


def _f(severity, area, title, detail, ref_id=None):
    return {"severity": severity, "area": area, "title": title,
            "detail": detail, "ref": ref_id}


def validate_system(system, controls, poams, vulns, inventory, artifacts):
    """Run the validator over a single system's live data and return findings.
    Returns a list of dicts with severity, area, title, detail, and a link to
    a common-mistake ID where applicable."""
    out = []

    # ---- system ----
    if not system.boundary_statement:
        out.append(_f(SEV_ERROR, "system",
                       "Authorization boundary missing",
                       "Add a boundary statement on the system registration page.",
                       1))
    if not system.ato_type:
        out.append(_f(SEV_ERROR, "system", "ATO type not selected",
                       "Select an ATO type (Initial / Renewal / IATT / Extension / Continuous).",
                       2))
    cia = (system.cia_confidentiality, system.cia_integrity,
           system.cia_availability)
    if all(cia) and system.impact_level:
        order = {"Low": 1, "Moderate": 2, "High": 3}
        max_cia = max(order.get(c, 0) for c in cia)
        if order.get(system.impact_level, 0) != max_cia:
            out.append(_f(SEV_ERROR, "system",
                           "Impact level not aligned with CIA high water mark",
                           f"CIA={cia[0]}/{cia[1]}/{cia[2]}, Overall={system.impact_level}.",
                           3))
    if not system.mission_desc:
        out.append(_f(SEV_WARN, "system", "Mission description missing",
                       "Document the mission tied to this system.", 4))
    if not system.data_types:
        out.append(_f(SEV_WARN, "system", "Data types not identified",
                       "Tag every data type processed (CUI / PII / etc.).", 5))

    # ---- controls ----
    for c in controls:
        stmt = (c.implementation_statement or "").strip()
        if not stmt:
            out.append(_f(SEV_ERROR, "control",
                           f"{c.nist_id}: implementation statement empty",
                           "Document how this control is satisfied.", 6))
        elif len(stmt) < 50:
            out.append(_f(SEV_WARN, "control",
                           f"{c.nist_id}: implementation statement < 50 chars",
                           f"Statement length {len(stmt)}; expand with specifics.", 10))
        if c.implementation_status == "not_implemented" and not stmt:
            out.append(_f(SEV_WARN, "control",
                           f"{c.nist_id}: not_implemented without rationale",
                           "Document compensating control or risk acceptance.", 7))
        if c.control_type == "common" and not stmt:
            out.append(_f(SEV_WARN, "control",
                           f"{c.nist_id}: common control without inheritance source",
                           "Reference the providing organization or system.", 8))
        if c.control_type == "hybrid" and not stmt:
            out.append(_f(SEV_WARN, "control",
                           f"{c.nist_id}: hybrid control without responsibility split",
                           "Document organization / system shared responsibilities.", 9))

    # ---- POA&Ms ----
    for p in poams:
        if p.status not in ("closed", "risk_accepted"):
            if not p.scheduled_completion:
                out.append(_f(SEV_ERROR, "poam",
                               f"POA&M {p.poam_id[:8]}: missing scheduled completion",
                               "eMASS requires a scheduled completion date.", 11))
            if not p.severity:
                out.append(_f(SEV_ERROR, "poam",
                               f"POA&M {p.poam_id[:8]}: severity blank",
                               "Set CAT I / II / III.", 13))
            if not p.risk_level:
                out.append(_f(SEV_ERROR, "poam",
                               f"POA&M {p.poam_id[:8]}: risk level blank",
                               "Set High / Moderate / Low.", 14))
            if not p.validation_method:
                out.append(_f(SEV_WARN, "poam",
                               f"POA&M {p.poam_id[:8]}: validation method not specified",
                               "Document how closure will be verified.", 15))
            if not p.residual_risk:
                out.append(_f(SEV_WARN, "poam",
                               f"POA&M {p.poam_id[:8]}: residual risk statement empty",
                               "Add a residual risk note.", 16))
        if p.weakness and len(p.weakness) > 400:
            out.append(_f(SEV_WARN, "poam",
                           f"POA&M {p.poam_id[:8]}: weakness > 400 chars",
                           f"Length {len(p.weakness)} exceeds eMASS limit.", 17))
        if p.status == "closed" and not p.closure_approver:
            out.append(_f(SEV_ERROR, "poam",
                           f"POA&M {p.poam_id[:8]}: closed without ISSM approval",
                           "Closure requires closure_approver populated.", 18))
        try:
            ms_count = len(__import__("json").loads(p.milestones_json or "[]"))
        except (ValueError, TypeError):
            ms_count = 0
        if p.status not in ("closed", "risk_accepted") and ms_count == 0:
            if p.scheduled_completion:
                from datetime import datetime, timezone
                today = datetime.now(timezone.utc).date()
                if (p.scheduled_completion - today).days > 30:
                    out.append(_f(SEV_WARN, "poam",
                                   f"POA&M {p.poam_id[:8]}: > 30 day window with no milestones",
                                   "Add measurable milestones.", 12))

    # ---- vulnerabilities ----
    for v in vulns:
        if v.severity in ("critical", "high") and not v.poam_id and v.status == "open":
            out.append(_f(SEV_ERROR, "vuln",
                           f"Vuln {v.vuln_id[:8]} ({v.severity}): no POA&M draft",
                           f"{v.title or 'Open finding'} on {v.host or 'unknown host'}.", 19))
        if not v.source:
            out.append(_f(SEV_INFO, "vuln",
                           f"Vuln {v.vuln_id[:8]}: source not tagged",
                           "Tag ACAS / STIG / SCAP / Manual.", 20))

    # ---- inventory ----
    hw = [i for i in inventory if i.item_type == "hardware"]
    sw_fw = [i for i in inventory if i.item_type in ("software", "firmware")]
    sbom = [i for i in inventory if i.item_type == "sbom"]
    for it in hw:
        if not it.ip_address:
            out.append(_f(SEV_INFO, "inventory",
                           f"HW '{it.name}': missing IP address",
                           "Add IP for network-attached components.", 21))
    for it in inventory:
        if not it.version:
            out.append(_f(SEV_WARN, "inventory",
                           f"{it.item_type.upper()} '{it.name}': version missing",
                           "Required for vulnerability mapping.", 22))
    if any(i.item_type == "software" and i.os for i in inventory):
        os_items = [i for i in inventory if i.item_type == "software" and i.os]
        for it in os_items:
            if not it.eos_date:
                out.append(_f(SEV_INFO, "inventory",
                               f"OS '{it.name}': EOS date missing",
                               "EOS drives lifecycle planning.", 23))
    if sw_fw and not sbom:
        out.append(_f(SEV_WARN, "inventory",
                       "No SBOM entries on register",
                       "SR-3 / SR-4 expect an SBOM. Capture at least key OSS components.",
                       24))

    # ---- artifacts ----
    for a in artifacts:
        if a.approval_status == "approved" and not a.approved_date:
            out.append(_f(SEV_WARN, "artifact",
                           f"Artifact '{a.name}': approved without date",
                           "Approved date drives review-due flagging.", 25))
        if a.expiration_date:
            from datetime import datetime, timezone
            today = datetime.now(timezone.utc).date()
            if a.expiration_date < today and a.approval_status != "superseded":
                out.append(_f(SEV_ERROR, "artifact",
                               f"Artifact '{a.name}': expired and still active",
                               "Refresh or supersede before eMASS upload.", 26))
        try:
            mappings = __import__("json").loads(a.control_mappings_json or "[]")
        except (ValueError, TypeError):
            mappings = []
        if not mappings:
            out.append(_f(SEV_INFO, "artifact",
                           f"Artifact '{a.name}': no control mappings",
                           "Tie to at least one NIST control.", 27))

    return out


def summarize(findings):
    s = {"error": 0, "warn": 0, "info": 0, "total": len(findings)}
    for f in findings:
        s[f["severity"]] = s.get(f["severity"], 0) + 1
    by_area = {}
    for f in findings:
        by_area[f["area"]] = by_area.get(f["area"], 0) + 1
    s["by_area"] = by_area
    return s


def readiness_score(findings):
    """Simple 0-100 readiness score from finding counts."""
    if not findings:
        return 100
    deduction = 0
    for f in findings:
        deduction += {"error": 6, "warn": 2, "info": 1}.get(f["severity"], 1)
    return max(0, 100 - deduction)
