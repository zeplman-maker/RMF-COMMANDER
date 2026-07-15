"""
RMF ATO Navigator - Flask + SQLite prototype.

Implements Module 1 (system registration + inventory), Module 2 (RMF workflow
wizard for Steps 0-6), Module 3 (eMASS prep hub with field guides, 28 common mistakes,
validator, and CSV exports for controls / artifacts / POA&Ms),
Module 5 (42-artifact library with .docx and .xlsx generators tying to live
system data, version and approval tracking, expiration flagging),
Module 9 (ISSO / ISSM / SCA / AO role-based dashboards with print-to-PDF)
and a simulated role-aware login that gates sensitive actions per the SRS
RBAC matrix (no CAC/PIV/MFA in this prototype),
Module 6 (NIST SP 800-53 Rev. 5 control catalog
browser with FR-6.2 deep-dive, family roll-up, system control workspace),
Module 7 (POA&M kanban + milestones + closure workflow + eMASS CSV export),
Module 8 (vulnerability dashboard with ACAS .nessus and STIG .ckl import,
auto POA&M generation, trend reporting, remediation status), and a mocked
AI assistant panel.

Aligned to RMF_ATO_Navigator_SRS_v1.0 FR-1.1.x, FR-1.2.x, FR-2.x, FR-3.x, FR-4.x, FR-5.x, FR-6.x, FR-7.x, FR-8.x, FR-9.x.

LOCAL VALIDATION REQUIRED. UNCLASSIFIED instance only.
"""
from __future__ import annotations

import csv
import io
import json
import os
import secrets
import uuid
from datetime import datetime, timezone

from functools import wraps
from flask import (Flask, abort, flash, g, jsonify, redirect, render_template,
                   request, session, url_for)
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import CSRFProtect
from sqlalchemy import event, or_
from sqlalchemy.engine import Engine
from controls_catalog_data import CATALOG as CATALOG_SEED, FAMILIES as FAMILIES_MAP
from artifact_templates_data import TEMPLATES as ARTIFACT_TEMPLATES, CATEGORIES as ARTIFACT_CATEGORIES, get_template as get_template_def
from emass_data import COMMON_MISTAKES, FIELD_GUIDES, validate_system as emass_validate, summarize as emass_summarize, readiness_score as emass_readiness_score
import ai_provider

# ---------------------------------------------------------------------------
# App + DB setup
# ---------------------------------------------------------------------------
app = Flask(__name__)

# SECRET_KEY: read from the environment. If unset, generate a random per-process
# key so the app still boots for local use, but sessions won't survive a restart
# and a warning is printed. Set SECRET_KEY in the environment for any real deployment.
_secret = os.environ.get("SECRET_KEY")
if not _secret:
    _secret = secrets.token_hex(32)
    print("WARNING: SECRET_KEY not set - using a random key. "
          "Sessions will reset on restart. Set SECRET_KEY for production.")
app.config["SECRET_KEY"] = _secret

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["MAX_CONTENT_LENGTH"] = 500 * 1024 * 1024  # NFR file size cap

# Session cookie hardening. SESSION_COOKIE_SECURE is opt-in via env so local
# http development still works; enable it when serving over HTTPS.
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = os.environ.get(
    "SESSION_COOKIE_SECURE", "").lower() in ("1", "true", "yes")

# CSRF protection for all state-changing (POST/PUT/PATCH/DELETE) requests.
# Forms include a hidden csrf_token; AJAX sends it via the X-CSRFToken header.
csrf = CSRFProtect(app)

db = SQLAlchemy(app)


def uid() -> str:
    return str(uuid.uuid4())


def now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Models (SRS Section 6.1.1, Table 26)
# ---------------------------------------------------------------------------
class Organization(db.Model):
    __tablename__ = "organization"
    org_id = db.Column(db.String, primary_key=True, default=uid)
    name = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(80))
    command = db.Column(db.String(120))
    ao_name = db.Column(db.String(120))
    created_date = db.Column(db.DateTime, default=now)


class Role(db.Model):
    __tablename__ = "role"
    role_id = db.Column(db.String, primary_key=True, default=uid)
    name = db.Column(db.String(60), nullable=False)
    permissions_json = db.Column(db.Text, default="{}")
    org_id = db.Column(db.String, db.ForeignKey("organization.org_id"))


class User(db.Model):
    __tablename__ = "user"
    user_id = db.Column(db.String, primary_key=True, default=uid)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=False)
    cac_edipi = db.Column(db.String(20))
    role_name = db.Column(db.String(60))
    org_id = db.Column(db.String, db.ForeignKey("organization.org_id"))
    active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime)
    mfa_enabled = db.Column(db.Boolean, default=True)


class System(db.Model):
    __tablename__ = "system"
    system_id = db.Column(db.String, primary_key=True, default=uid)
    name = db.Column(db.String(200), nullable=False)
    acronym = db.Column(db.String(40))
    system_type = db.Column(db.String(60))         # FR-1.1.3
    impact_level = db.Column(db.String(20))        # Low/Mod/High (FIPS 199)
    cia_confidentiality = db.Column(db.String(20))
    cia_integrity = db.Column(db.String(20))
    cia_availability = db.Column(db.String(20))
    ato_type = db.Column(db.String(40))            # FR-1.1.2
    current_step = db.Column(db.Integer, default=0)
    ato_expiration = db.Column(db.Date)
    boundary_statement = db.Column(db.Text)        # FR-1.1.5
    mission_desc = db.Column(db.Text)              # FR-1.1.4
    data_types = db.Column(db.Text)                # CUI/PII/PHI etc
    is_nss = db.Column(db.Boolean, default=False)  # FR-1.1.9 CNSSI 1253
    org_id = db.Column(db.String, db.ForeignKey("organization.org_id"))
    isso_id = db.Column(db.String, db.ForeignKey("user.user_id"))
    issm_id = db.Column(db.String, db.ForeignKey("user.user_id"))
    sca_id = db.Column(db.String, db.ForeignKey("user.user_id"))
    ao_id = db.Column(db.String, db.ForeignKey("user.user_id"))
    completeness_score = db.Column(db.Integer, default=0)  # FR-1.1.6
    created_date = db.Column(db.DateTime, default=now)

    inventory = db.relationship("InventoryItem", backref="system",
                                cascade="all, delete-orphan")
    poams = db.relationship("POAM", backref="system",
                            cascade="all, delete-orphan")
    artifacts = db.relationship("Artifact", backref="system",
                                cascade="all, delete-orphan")


class RMFProject(db.Model):
    __tablename__ = "rmf_project"
    project_id = db.Column(db.String, primary_key=True, default=uid)
    system_id = db.Column(db.String, db.ForeignKey("system.system_id"))
    step_status_json = db.Column(db.Text, default="{}")
    target_ato_date = db.Column(db.Date)
    boundary_statement = db.Column(db.Text)
    mission_desc = db.Column(db.Text)


class Control(db.Model):
    __tablename__ = "control"
    control_id = db.Column(db.String, primary_key=True, default=uid)
    nist_id = db.Column(db.String(20))             # AC-2 etc
    title = db.Column(db.String(200))
    family = db.Column(db.String(40))
    baseline = db.Column(db.String(20))
    system_id = db.Column(db.String, db.ForeignKey("system.system_id"))
    implementation_status = db.Column(db.String(40), default="not_implemented")
    control_type = db.Column(db.String(40))         # common/inherited/hybrid/system
    owner_id = db.Column(db.String)
    implementation_statement = db.Column(db.Text)
    last_reviewed = db.Column(db.DateTime)


class ControlCatalog(db.Model):
    """Master NIST SP 800-53 Rev. 5 reference data (FR-6.1, FR-6.2, FR-6.4)."""
    __tablename__ = "control_catalog"
    nist_id = db.Column(db.String(20), primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    family = db.Column(db.String(4), index=True)
    family_name = db.Column(db.String(80))
    baseline_low = db.Column(db.Boolean, default=False)
    baseline_mod = db.Column(db.Boolean, default=False)
    baseline_high = db.Column(db.Boolean, default=False)
    control_type_default = db.Column(db.String(40))
    rmf_step = db.Column(db.Integer)
    statement = db.Column(db.Text)
    expected_artifacts = db.Column(db.Text, default="[]")     # JSON list
    evidence_examples = db.Column(db.Text, default="[]")
    assessment_methods = db.Column(db.Text, default="[]")
    responsible_roles = db.Column(db.Text, default="[]")
    emass_location = db.Column(db.String(200))
    common_mistakes = db.Column(db.Text, default="[]")
    poam_triggers = db.Column(db.Text, default="[]")
    conmon_metric = db.Column(db.String(200))


class Artifact(db.Model):
    __tablename__ = "artifact"
    artifact_id = db.Column(db.String, primary_key=True, default=uid)
    artifact_key = db.Column(db.String(60))         # template key, FR-5.1
    name = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(80))                 # docx / xlsx / pdf / other
    version = db.Column(db.String(20), default="0.1")
    version_number = db.Column(db.Integer, default=1)
    system_id = db.Column(db.String, db.ForeignKey("system.system_id"))
    upload_date = db.Column(db.DateTime, default=now)
    uploaded_by = db.Column(db.String)
    approval_status = db.Column(db.String(20), default="draft")
    approver = db.Column(db.String(120))
    approved_date = db.Column(db.DateTime)
    expiration_date = db.Column(db.Date)            # FR-5.6
    file_path = db.Column(db.String(400))
    control_mappings_json = db.Column(db.Text, default="[]")
    emass_location = db.Column(db.String(120))
    supersedes_id = db.Column(db.String)
    generated_from_template = db.Column(db.Boolean, default=False)


class POAM(db.Model):
    __tablename__ = "poam"
    poam_id = db.Column(db.String, primary_key=True, default=uid)
    system_id = db.Column(db.String, db.ForeignKey("system.system_id"))
    control_nist_id = db.Column(db.String(20))
    weakness = db.Column(db.String(400))
    source = db.Column(db.String(40))
    severity = db.Column(db.String(10))             # CAT I/II/III
    risk_level = db.Column(db.String(20))
    root_cause = db.Column(db.Text)
    resources_required = db.Column(db.Text)
    milestones_json = db.Column(db.Text, default="[]")
    scheduled_completion = db.Column(db.Date)
    validation_method = db.Column(db.String(120))
    residual_risk = db.Column(db.Text)
    comments = db.Column(db.Text)
    status = db.Column(db.String(20), default="open")
    # FR-7.5 closure workflow
    closure_evidence_id = db.Column(db.String)
    closure_submitted_by = db.Column(db.String)
    closure_submitted_at = db.Column(db.DateTime)
    closure_approver = db.Column(db.String)
    closure_approved_at = db.Column(db.DateTime)
    date_identified = db.Column(db.Date)
    created_date = db.Column(db.DateTime, default=now)
    updated_at = db.Column(db.DateTime, default=now, onupdate=now)


class Vulnerability(db.Model):
    __tablename__ = "vulnerability"
    vuln_id = db.Column(db.String, primary_key=True, default=uid)
    system_id = db.Column(db.String, db.ForeignKey("system.system_id"))
    asset_id = db.Column(db.String)
    host = db.Column(db.String(120))                # hostname or IP
    port = db.Column(db.String(20))
    source = db.Column(db.String(20))               # ACAS/STIG/SCAP
    cve = db.Column(db.String(40))
    plugin_id = db.Column(db.String(40))
    rule_id = db.Column(db.String(80))
    severity = db.Column(db.String(20))             # critical/high/medium/low/info
    cat = db.Column(db.String(8))                   # CAT I / II / III (STIG)
    title = db.Column(db.String(300))
    description = db.Column(db.Text)
    comments = db.Column(db.Text)
    status = db.Column(db.String(20), default="open")  # open/in_progress/remediated/risk_accepted/false_positive
    first_seen = db.Column(db.DateTime, default=now)
    last_seen = db.Column(db.DateTime, default=now)
    remediation_date = db.Column(db.DateTime)
    poam_id = db.Column(db.String, db.ForeignKey("poam.poam_id"))


class Scan(db.Model):
    """FR-8.5 - one row per scan import event for trend reporting."""
    __tablename__ = "scan"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    system_id = db.Column(db.String, db.ForeignKey("system.system_id"),
                          nullable=False, index=True)
    source = db.Column(db.String(20), nullable=False)   # ACAS / STIG / SCAP
    filename = db.Column(db.String(200))
    scan_date = db.Column(db.DateTime, default=now)
    critical = db.Column(db.Integer, default=0)
    high = db.Column(db.Integer, default=0)
    medium = db.Column(db.Integer, default=0)
    low = db.Column(db.Integer, default=0)
    info = db.Column(db.Integer, default=0)
    not_a_finding = db.Column(db.Integer, default=0)
    not_applicable = db.Column(db.Integer, default=0)
    not_reviewed = db.Column(db.Integer, default=0)
    total = db.Column(db.Integer, default=0)


class InventoryItem(db.Model):
    """FR-1.2.1 / 1.2.2 / 1.2.3 / 1.2.4 — HW / SW / FW / SBOM."""
    __tablename__ = "inventory_item"
    item_id = db.Column(db.String, primary_key=True, default=uid)
    system_id = db.Column(db.String, db.ForeignKey("system.system_id"))
    item_type = db.Column(db.String(20))            # hardware/software/firmware/sbom
    name = db.Column(db.String(200), nullable=False)
    vendor = db.Column(db.String(120))
    version = db.Column(db.String(60))
    ip_address = db.Column(db.String(60))
    mac_address = db.Column(db.String(40))
    os = db.Column(db.String(60))
    os_version = db.Column(db.String(40))
    patch_level = db.Column(db.String(40))
    eos_date = db.Column(db.Date)
    owner = db.Column(db.String(120))
    location = db.Column(db.String(120))
    license = db.Column(db.String(80))              # SBOM
    component_origin = db.Column(db.String(40))     # commercial/oss/govt
    status = db.Column(db.String(20), default="active")
    created_date = db.Column(db.DateTime, default=now)


class Assessment(db.Model):
    __tablename__ = "assessment"
    assessment_id = db.Column(db.String, primary_key=True, default=uid)
    system_id = db.Column(db.String, db.ForeignKey("system.system_id"))
    control_nist_id = db.Column(db.String(20))
    assessor_id = db.Column(db.String)
    method = db.Column(db.String(20))
    result = db.Column(db.String(20))
    finding_desc = db.Column(db.Text)
    recommendation = db.Column(db.Text)
    severity = db.Column(db.String(20))
    date_assessed = db.Column(db.DateTime)


class AIInteraction(db.Model):
    """FR-4.4 — log every AI interaction. Retained 3 yrs (NFR-2.8)."""
    __tablename__ = "ai_interaction"
    interaction_id = db.Column(db.String, primary_key=True, default=uid)
    user_id = db.Column(db.String, db.ForeignKey("user.user_id"))
    system_id = db.Column(db.String, db.ForeignKey("system.system_id"))
    assistant_mode = db.Column(db.String(40))
    prompt_text = db.Column(db.Text)
    response_text = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=now)
    confidence_score = db.Column(db.Float)
    flagged_for_review = db.Column(db.Boolean, default=True)
    review_status = db.Column(db.String(20), default="unreviewed")
    sources_cited_json = db.Column(db.Text, default="[]")


class StepTask(db.Model):
    """FR-2.x - per-system task completion for the RMF workflow wizard."""
    __tablename__ = "step_task"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    system_id = db.Column(db.String, db.ForeignKey("system.system_id"),
                          nullable=False, index=True)
    step = db.Column(db.Integer, nullable=False)
    task_key = db.Column(db.String(60), nullable=False)
    completed_at = db.Column(db.DateTime)
    completed_by = db.Column(db.String)
    note = db.Column(db.Text)
    __table_args__ = (db.UniqueConstraint("system_id", "task_key",
                                           name="uq_systask"),)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
ATO_TYPES = ["Initial", "Renewal", "IATT", "Extension", "Continuous"]
SYSTEM_TYPES = ["Major Application", "General Support System", "Mission System",
                "Subsystem", "Cloud Service", "Platform IT"]
IMPACT_LEVELS = ["Low", "Moderate", "High"]
CIA_LEVELS = ["Low", "Moderate", "High"]
DATA_TYPES = ["CUI", "PII", "PHI", "FOUO", "Public", "Operational"]
RMF_STEPS = [
    (0, "Prepare"), (1, "Categorize"), (2, "Select"),
    (3, "Implement"), (4, "Assess"), (5, "Authorize"), (6, "Monitor"),
]

# Module 2 - RMF workflow wizard catalog (FR-2.0.x to FR-2.6.x)
TASK_CATALOG = {
    0: [
        {"key": "p_assign_isso", "fr": "FR-2.0.1", "title": "Assign ISSO",
         "desc": "Confirm ISSO appointment and document the assignment.",
         "gate": True},
        {"key": "p_assign_issm", "fr": "FR-2.0.1", "title": "Assign ISSM",
         "desc": "Confirm ISSM appointment and document the assignment.",
         "gate": True},
        {"key": "p_assign_ao", "fr": "FR-2.0.1",
         "title": "Identify AO and AO Rep",
         "desc": "Confirm Authorizing Official and AO Representative.",
         "gate": True},
        {"key": "p_stakeholder_matrix", "fr": "FR-2.0.2",
         "title": "Build stakeholder matrix",
         "desc": "List every stakeholder with role, contact, and approval authority.",
         "gate": True},
        {"key": "p_emass_setup", "fr": "FR-2.0.3",
         "title": "Create eMASS project record",
         "desc": "Open the eMASS project and capture the system ID.",
         "gate": True},
        {"key": "p_charter", "fr": "FR-2.0.4",
         "title": "Draft project charter",
         "desc": "Document mission, scope, schedule, and accountability.",
         "gate": False},
    ],
    1: [
        {"key": "c_info_types", "fr": "FR-2.1.2",
         "title": "Identify NIST 800-60 information types",
         "desc": "List every information type the system processes.",
         "gate": True},
        {"key": "c_fips199", "fr": "FR-2.1.1",
         "title": "Complete FIPS 199 worksheet",
         "desc": "Confidentiality, Integrity, Availability ratings per info type, then overall.",
         "gate": True},
        {"key": "c_data_types", "fr": "FR-2.1.5",
         "title": "Identify CUI / PII / PHI data",
         "desc": "Document all sensitive data types handled.",
         "gate": True},
        {"key": "c_rationale", "fr": "FR-2.1.3",
         "title": "Write categorization rationale",
         "desc": "Narrative justifying the impact level decision.",
         "gate": True},
        {"key": "c_boundary_draft", "fr": "FR-2.1.4",
         "title": "Draft initial boundary description",
         "desc": "Initial boundary statement, refined later in Step 2.",
         "gate": False},
        {"key": "c_cnssi", "fr": "FR-2.1.6",
         "title": "Complete CNSSI 1253 worksheet (NSS only)",
         "desc": "Required if system is national security.",
         "gate": False},
    ],
    2: [
        {"key": "s_baseline", "fr": "FR-2.2.1",
         "title": "Select 800-53B baseline",
         "desc": "Choose Low / Moderate / High baseline per FIPS 199 result.",
         "gate": True},
        {"key": "s_overlays", "fr": "FR-2.2.6",
         "title": "Apply overlays",
         "desc": "Apply CUI, Privacy, NSS, or other overlays as required.",
         "gate": False},
        {"key": "s_tailor", "fr": "FR-2.2.2",
         "title": "Tailor controls",
         "desc": "Add, remove, scope, or compensate controls per system context.",
         "gate": True},
        {"key": "s_classify", "fr": "FR-2.2.3",
         "title": "Classify each control",
         "desc": "Mark each control common, inherited, hybrid, or system-specific.",
         "gate": True},
        {"key": "s_owners", "fr": "FR-2.2.4",
         "title": "Assign control owners",
         "desc": "Assign a responsible individual or team to every control.",
         "gate": True},
        {"key": "s_matrix", "fr": "FR-2.2.5",
         "title": "Build responsibility and artifact matrices",
         "desc": "For each control, document who, what artifact, and where in eMASS.",
         "gate": True},
    ],
    3: [
        {"key": "i_workspace", "fr": "FR-2.3.1",
         "title": "Implement controls in workspace",
         "desc": "Document implementation for every selected control.",
         "gate": True},
        {"key": "i_statements", "fr": "FR-2.3.6",
         "title": "Draft SSP narrative",
         "desc": "Compile implementation statements into the System Security Plan.",
         "gate": True},
        {"key": "i_evidence", "fr": "FR-2.3.2",
         "title": "Upload supporting evidence",
         "desc": "Attach policies, procedures, screenshots, configs, scan results.",
         "gate": True},
        {"key": "i_status", "fr": "FR-2.3.3",
         "title": "Update implementation status per control",
         "desc": "Mark each control implemented, partial, planned, or not applicable.",
         "gate": True},
        {"key": "i_gaps", "fr": "FR-2.3.4",
         "title": "Flag implementation gaps",
         "desc": "Identify controls that cannot be implemented as written.",
         "gate": False},
        {"key": "i_poam_draft", "fr": "FR-2.3.5",
         "title": "Auto-draft POA&Ms for gaps",
         "desc": "Convert flagged gaps into POA&M drafts.",
         "gate": False},
    ],
    4: [
        {"key": "a_sap", "fr": "FR-2.4.1", "title": "Develop SAP",
         "desc": "Security Assessment Plan defining scope, methods, schedule.",
         "gate": True},
        {"key": "a_acas", "fr": "FR-2.4.6",
         "title": "Import ACAS .nessus scan",
         "desc": "Pull latest ACAS results into the vulnerability list.",
         "gate": False},
        {"key": "a_stig", "fr": "FR-2.4.5",
         "title": "Import STIG checklists",
         "desc": "Pull .ckl or XCCDF results for every relevant STIG.",
         "gate": False},
        {"key": "a_findings", "fr": "FR-2.4.2",
         "title": "Record assessment findings",
         "desc": "Document every finding with severity, control, and recommendation.",
         "gate": True},
        {"key": "a_sar", "fr": "FR-2.4.3", "title": "Generate SAR",
         "desc": "Compile findings into the Security Assessment Report.",
         "gate": True},
        {"key": "a_poam_update", "fr": "FR-2.4.4",
         "title": "Update POA&Ms from findings",
         "desc": "Open or update POA&Ms for every Critical and High finding.",
         "gate": True},
        {"key": "a_risk_register", "fr": "FR-2.4.7",
         "title": "Build risk register",
         "desc": "Aggregate residual risks for AO review.",
         "gate": False},
    ],
    5: [
        {"key": "z_readiness", "fr": "FR-2.5.1",
         "title": "Complete ATO readiness checklist",
         "desc": "All package artifacts present, signed, and uploaded.",
         "gate": True},
        {"key": "z_summary", "fr": "FR-2.5.2",
         "title": "Prepare executive risk summary",
         "desc": "One-page summary for the AO covering posture and residual risk.",
         "gate": True},
        {"key": "z_residual", "fr": "FR-2.5.3",
         "title": "Document residual risk",
         "desc": "Statement on each accepted residual risk.",
         "gate": True},
        {"key": "z_decision", "fr": "FR-2.5.4",
         "title": "Record AO decision",
         "desc": "AO records ATO, IATT, denial, or extension. Capture date and conditions.",
         "gate": True},
        {"key": "z_conditions", "fr": "FR-2.5.5",
         "title": "Capture ATO conditions",
         "desc": "List every condition the AO attached to the authorization.",
         "gate": False},
    ],
    6: [
        {"key": "m_conmon_plan", "fr": "FR-2.6.1",
         "title": "Establish ConMon Plan",
         "desc": "Document continuous monitoring per CA-7.",
         "gate": True},
        {"key": "m_scan_trends", "fr": "FR-2.6.2",
         "title": "Track vulnerability scan trends",
         "desc": "Monthly trend reporting on Critical and High counts.",
         "gate": True},
        {"key": "m_sia", "fr": "FR-2.6.3",
         "title": "Run security impact analyses",
         "desc": "Assess risk of every significant change.",
         "gate": False},
        {"key": "m_annual", "fr": "FR-2.6.4",
         "title": "Annual control assessment",
         "desc": "Re-test a subset of controls each year.",
         "gate": True},
        {"key": "m_monthly_report", "fr": "FR-2.6.5",
         "title": "Submit monthly cyber status report",
         "desc": "Standard format covering posture, findings, POA&M aging.",
         "gate": False},
        {"key": "m_score", "fr": "FR-2.6.6",
         "title": "Maintain continuous ATO readiness score",
         "desc": "Track readiness for renewal or revocation.",
         "gate": False},
    ],
}

GATE_DESC = {
    0: "All roles assigned, eMASS project record open, stakeholder matrix complete.",
    1: "FIPS 199 categorization complete with rationale and data type identification.",
    2: "800-53B baseline selected, controls tailored, classified, and owners assigned.",
    3: "Implementation statements written for in-scope controls; evidence on file.",
    4: "SAP signed, findings recorded, SAR generated, POA&Ms updated.",
    5: "Risk summary complete, residual risk documented, AO decision recorded.",
    6: "ConMon Plan in place, scan cadence held, annual assessment scheduled.",
}

STEP_OUTPUTS = {
    0: ["Stakeholder Matrix", "Project Charter", "eMASS Project Setup Checklist"],
    1: ["FIPS 199 Worksheet", "Categorization Rationale",
        "Initial Boundary Description", "CNSSI 1253 Worksheet (NSS)"],
    2: ["Tailored Control Set", "Control Responsibility Matrix",
        "Control Artifact Matrix"],
    3: ["System Security Plan (SSP)", "Implementation Evidence",
        "Initial POA&M draft"],
    4: ["Security Assessment Plan (SAP)", "Assessment Findings",
        "Security Assessment Report (SAR)", "Updated POA&M Register",
        "Risk Register"],
    5: ["Executive Risk Summary", "Residual Risk Statement",
        "AO Authorization Decision", "ATO Conditions Tracker"],
    6: ["ConMon Plan", "Monthly Cyber Status Reports",
        "Annual Control Assessment Records", "ATO Readiness Score"],
}


def task_status_for_step(system_id: str, step: int):
    """Return a list of (task_dict, completed_bool) for a step."""
    completed = {t.task_key for t in StepTask.query
                  .filter_by(system_id=system_id)
                  .filter(StepTask.completed_at.isnot(None)).all()}
    out = []
    for t in TASK_CATALOG.get(step, []):
        out.append((t, t["key"] in completed))
    return out


def gate_status_for_step(system_id: str, step: int):
    """Return (met, total, missing_titles) for the gate-required tasks."""
    statuses = task_status_for_step(system_id, step)
    gate_items = [(t, done) for t, done in statuses if t["gate"]]
    total = len(gate_items)
    met = sum(1 for _, done in gate_items if done)
    missing = [t["title"] for t, done in gate_items if not done]
    return met, total, missing


# ---------------------------------------------------------------------------
# Module 8 - Vulnerability scan parsers (ACAS .nessus + STIG .ckl)
# ---------------------------------------------------------------------------
import xml.etree.ElementTree as ET

ACAS_SEV_MAP = {
    "4": "critical", "3": "high", "2": "medium",
    "1": "low", "0": "info",
}
STIG_CAT_TO_SEV = {
    "CAT I": "high", "CAT II": "medium", "CAT III": "low",
    "I": "high", "II": "medium", "III": "low",
}
STATUS_OPTIONS = ["open", "in_progress", "remediated", "risk_accepted",
                  "false_positive"]


def _link_inventory(system_id, host):
    """FR-8.3 - try to link a vuln to a hardware inventory item by hostname / IP."""
    if not host:
        return None
    item = (InventoryItem.query
            .filter_by(system_id=system_id, item_type="hardware")
            .filter((InventoryItem.name == host) |
                    (InventoryItem.ip_address == host))
            .first())
    return item.item_id if item else None


def _maybe_create_poam(system_id, vuln, control_id_hint=None):
    """FR-8.4 - auto draft POA&M for Critical / High."""
    if vuln.severity not in ("critical", "high"):
        return None
    if vuln.poam_id:
        return vuln.poam_id
    p = POAM(
        system_id=system_id,
        control_nist_id=control_id_hint or "RA-5",
        weakness=(vuln.title or "Vulnerability finding")[:400],
        source=vuln.source,
        severity="CAT I" if vuln.severity == "critical" else "CAT II",
        risk_level="High" if vuln.severity == "critical" else "Moderate",
        root_cause=(vuln.description or "")[:2000],
        status="open",
        residual_risk="To be assessed after remediation.",
        validation_method="Re-scan and confirm finding closed.",
    )
    db.session.add(p)
    db.session.flush()
    vuln.poam_id = p.poam_id
    return p.poam_id


def parse_nessus(system_id, filename, content_bytes):
    """FR-8.1 - parse ACAS .nessus XML, dedupe by (host, plugin_id)."""
    try:
        root = ET.fromstring(content_bytes)
    except ET.ParseError as e:
        raise ValueError(f"Invalid .nessus XML: {e}")

    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    new_findings = 0
    poam_drafts = 0
    for host_el in root.iter("ReportHost"):
        host = host_el.get("name") or "unknown-host"
        for item in host_el.findall("ReportItem"):
            sev = ACAS_SEV_MAP.get(item.get("severity", "0"), "info")
            counts[sev] += 1
            plugin_id = item.get("pluginID") or ""
            port = item.get("port") or ""
            title = (item.get("pluginName") or "").strip()
            cve_el = item.find("cve")
            cve = cve_el.text.strip() if cve_el is not None and cve_el.text else None
            desc_el = item.find("description")
            desc = desc_el.text.strip() if desc_el is not None and desc_el.text else None
            existing = Vulnerability.query.filter_by(
                system_id=system_id, source="ACAS",
                host=host, plugin_id=plugin_id, port=port).first()
            if existing:
                existing.last_seen = now()
                if existing.status == "remediated":
                    existing.status = "open"  # finding came back
                continue
            v = Vulnerability(
                system_id=system_id, source="ACAS",
                asset_id=_link_inventory(system_id, host),
                host=host, port=port, plugin_id=plugin_id,
                cve=cve, severity=sev, title=title or f"Plugin {plugin_id}",
                description=desc, status="open",
            )
            db.session.add(v)
            db.session.flush()
            if _maybe_create_poam(system_id, v):
                poam_drafts += 1
            new_findings += 1

    scan = Scan(system_id=system_id, source="ACAS", filename=filename,
                critical=counts["critical"], high=counts["high"],
                medium=counts["medium"], low=counts["low"], info=counts["info"],
                total=sum(counts.values()))
    db.session.add(scan)
    db.session.commit()
    return {"new": new_findings, "poam_drafts": poam_drafts, "counts": counts,
            "scan_id": scan.id}


def parse_ckl(system_id, filename, content_bytes):
    """FR-8.2 - parse STIG Viewer .ckl XML, dedupe by (host, rule_id)."""
    try:
        root = ET.fromstring(content_bytes)
    except ET.ParseError as e:
        raise ValueError(f"Invalid .ckl XML: {e}")

    asset_el = root.find("ASSET")
    host = "unknown-host"
    if asset_el is not None:
        hn = asset_el.find("HOST_NAME")
        ip = asset_el.find("HOST_IP")
        host = (hn.text if hn is not None and hn.text else
                (ip.text if ip is not None and ip.text else host))
    counts = {"open": 0, "not_a_finding": 0, "not_applicable": 0, "not_reviewed": 0}
    sev_counts = {"high": 0, "medium": 0, "low": 0}
    new_findings = 0
    poam_drafts = 0

    for vuln_el in root.iter("VULN"):
        attrs = {}
        for sd in vuln_el.findall("STIG_DATA"):
            name_el = sd.find("VULN_ATTRIBUTE")
            data_el = sd.find("ATTRIBUTE_DATA")
            if name_el is not None and data_el is not None and name_el.text:
                attrs[name_el.text] = (data_el.text or "").strip()
        status_el = vuln_el.find("STATUS")
        status = (status_el.text or "").strip() if status_el is not None else ""
        rule_id = attrs.get("Rule_ID") or attrs.get("Vuln_Num") or ""
        title = attrs.get("Rule_Title") or attrs.get("Group_Title") or "STIG finding"
        cat = attrs.get("Severity") or ""  # high/medium/low text
        # STIG Viewer often uses 'high'/'medium'/'low' for Severity attr
        sev_text = (cat or "").lower()
        if sev_text not in ("high", "medium", "low"):
            sev_text = STIG_CAT_TO_SEV.get(cat, "low")
        cat_label = {"high": "CAT I", "medium": "CAT II", "low": "CAT III"}.get(sev_text, "CAT III")
        cci = attrs.get("CCI_REF") or ""
        finding_details = (vuln_el.findtext("FINDING_DETAILS") or "").strip()
        comments = (vuln_el.findtext("COMMENTS") or "").strip()

        # Tally STIG status counts
        s_lower = status.lower().replace(" ", "_")
        if s_lower in ("open",):
            counts["open"] += 1
            sev_counts[sev_text] += 1
        elif s_lower in ("notafinding", "not_a_finding"):
            counts["not_a_finding"] += 1
        elif s_lower in ("not_applicable",):
            counts["not_applicable"] += 1
        else:
            counts["not_reviewed"] += 1

        if s_lower != "open":
            # only track open findings as live vulnerabilities
            continue

        existing = Vulnerability.query.filter_by(
            system_id=system_id, source="STIG",
            host=host, rule_id=rule_id).first()
        if existing:
            existing.last_seen = now()
            existing.comments = comments or existing.comments
            if existing.status == "remediated":
                existing.status = "open"
            continue
        v = Vulnerability(
            system_id=system_id, source="STIG",
            asset_id=_link_inventory(system_id, host),
            host=host, rule_id=rule_id,
            severity=sev_text, cat=cat_label, title=title[:300],
            description=finding_details[:2000] if finding_details else None,
            comments=comments[:2000] if comments else None,
            status="open",
        )
        db.session.add(v)
        db.session.flush()
        # Default control hint for STIG findings is CM-6 (config settings)
        if _maybe_create_poam(system_id, v, control_id_hint="CM-6"):
            poam_drafts += 1
        new_findings += 1

    scan = Scan(system_id=system_id, source="STIG", filename=filename,
                critical=0, high=sev_counts["high"], medium=sev_counts["medium"],
                low=sev_counts["low"],
                not_a_finding=counts["not_a_finding"],
                not_applicable=counts["not_applicable"],
                not_reviewed=counts["not_reviewed"],
                total=counts["open"])
    db.session.add(scan)
    db.session.commit()
    return {"new": new_findings, "poam_drafts": poam_drafts,
            "open": counts["open"],
            "not_a_finding": counts["not_a_finding"],
            "not_applicable": counts["not_applicable"],
            "not_reviewed": counts["not_reviewed"],
            "scan_id": scan.id}
INVENTORY_TYPES = ["hardware", "software", "firmware", "sbom"]

DEFAULT_ROLES = ["ISSO", "ISSM", "SCA", "AO", "System Owner",
                 "Vulnerability Analyst", "Network Engineer", "Sysadmin",
                 "Cloud Engineer", "SCRM Analyst", "Admin"]


def compute_completeness(system: System) -> int:
    """FR-1.1.6 ATO Package Completeness Score 0-100. Heuristic for prototype."""
    pts = 0
    if system.name: pts += 5
    if system.acronym: pts += 5
    if system.system_type: pts += 5
    if system.impact_level: pts += 10
    if system.cia_confidentiality and system.cia_integrity and system.cia_availability:
        pts += 10
    if system.ato_type: pts += 5
    if system.boundary_statement: pts += 10
    if system.mission_desc: pts += 10
    if system.data_types: pts += 5
    if system.isso_id: pts += 5
    if system.issm_id: pts += 5
    if system.ao_id: pts += 5
    inv_count = InventoryItem.query.filter_by(system_id=system.system_id).count()
    if inv_count >= 1: pts += 5
    if inv_count >= 10: pts += 5
    # Module 2 contribution: each completed gate task is worth 1 point up to 30
    completed_gate = (StepTask.query
                      .filter_by(system_id=system.system_id)
                      .filter(StepTask.completed_at.isnot(None))
                      .count())
    pts += min(completed_gate, 30)
    return min(pts, 100)


# ---------------------------------------------------------------------------
# Mocked AI assistant (FR-4.x) - canned responses, no external calls
# ---------------------------------------------------------------------------
AI_MODES = {
    "isso_coach":      "Mode 1 - ISSO Coach",
    "control_analyst": "Mode 2 - Control Analyst",
    "artifact_gen":    "Mode 3 - Artifact Generator",
    "evidence_review": "Mode 4 - Evidence Reviewer",
    "poam_builder":    "Mode 5 - POA&M Builder",
    "topology":        "Mode 6 - Topology Analyst",
    "sbom":            "Mode 7 - SBOM Analyst",
    "ato_readiness":   "Mode 8 - ATO Readiness",
}

AI_CANNED = {
    "isso_coach": {
        "answer": ("Direct answer: Begin with RMF Step 0 (Prepare) per NIST SP "
                   "800-37 Rev. 2. Confirm AO, ISSM, ISSO assignments and "
                   "establish the eMASS project record.\n\n"
                   "Required artifacts: Project Charter, Stakeholder Matrix, "
                   "eMASS Project Setup Checklist.\n\n"
                   "Next actions: assign roles, draft mission narrative, "
                   "schedule kickoff. Local validation required before any "
                   "package action."),
        "sources": ["NIST SP 800-37 Rev. 2", "DoDI 8510.01", "AFI 17-101"],
    },
    "control_analyst": {
        "answer": ("AC-2 Account Management - manage information system "
                   "accounts including identification, role assignment, "
                   "approval, modification, disable, and removal.\n\n"
                   "Evidence examples: account inventory export, IAM "
                   "provisioning policy, periodic review records, automated "
                   "disable logs.\n\n"
                   "Common deficiencies: stale shared accounts, no quarterly "
                   "review evidence, missing approval workflow."),
        "sources": ["NIST SP 800-53 Rev. 5 AC-2", "NIST SP 800-53A Rev. 5"],
    },
    "artifact_gen": {
        "answer": ("Generated SSP outline (System Security Plan, FR-5.1):\n"
                   "1. System identification and description\n"
                   "2. Authorization boundary and topology\n"
                   "3. System categorization (FIPS 199)\n"
                   "4. Control implementation statements (NIST SP 800-53)\n"
                   "5. Roles and responsibilities\n"
                   "6. Plan of action and milestones reference\n"
                   "7. Approval and signature block\n\n"
                   "Replace bracketed placeholders with system-specific data. "
                   "Submit to ISSM for review prior to SCA assessment."),
        "sources": ["NIST SP 800-18", "DoDI 8510.01"],
    },
    "evidence_review": {
        "answer": ("CONDITIONAL PASS. The provided artifact addresses the "
                   "control intent but is missing two assessment elements "
                   "per NIST SP 800-53A:\n"
                   "- Examine: no policy approval signature visible\n"
                   "- Test: no recent test result attached (within 12 mo)\n\n"
                   "Recommended actions: obtain ISSM signature on policy "
                   "page 1, attach 2026 quarterly test record, re-submit."),
        "sources": ["NIST SP 800-53A Rev. 5"],
    },
    "poam_builder": {
        "answer": ("POA&M draft (eMASS-ready):\n"
                   "Weakness: Account review cadence not documented.\n"
                   "Source: SCA assessment finding.\n"
                   "Control: AC-2.\n"
                   "Severity: CAT II.\n"
                   "Root cause: Process not formalized.\n"
                   "Milestones: (1) Draft procedure - 30 d; (2) ISSM "
                   "approval - 45 d; (3) First quarterly review - 90 d.\n"
                   "Validation: Attach signed procedure and review log."),
        "sources": ["DoDI 8510.01", "CA-5", "CA-7"],
    },
    "topology": {
        "answer": ("Boundary review: include all hosts inside the authorization "
                   "boundary, all external connections (with ISA/MOA "
                   "references), trust zones, and data flow direction.\n\n"
                   "Common gaps: undocumented backup network, missing cloud "
                   "shared-responsibility annotations, admin path not shown "
                   "separately from user path."),
        "sources": ["NIST SP 800-47", "SC-7", "PL-2", "CA-3"],
    },
    "sbom": {
        "answer": ("SBOM review: confirm component name, version, supplier, "
                   "license, and origin (commercial/OSS/government) for every "
                   "software item. Flag any component past EOL/EOS or without "
                   "an active maintenance source.\n\n"
                   "Next actions: map open-source components to known CVEs, "
                   "document supply-chain risk per NIST SP 800-161."),
        "sources": ["NIST SP 800-161", "CM-8", "SR-3", "SR-4", "SA-4"],
    },
    "ato_readiness": {
        "answer": ("ATO readiness score: 62 / 100 (Conditional).\n\n"
                   "Top blockers:\n"
                   "1. SSP narrative incomplete for AC, AU, SI families\n"
                   "2. POA&M residual risk statements missing on 4 entries\n"
                   "3. Topology diagram lacks external connection labels\n"
                   "4. Hardware inventory missing 12 EOS dates\n\n"
                   "Estimated effort to AO submission: 3-4 weeks."),
        "sources": ["NIST SP 800-37 Rev. 2", "DoDI 8510.01"],
    },
}

DEFAULT_AI = AI_CANNED["isso_coach"]


# ---------------------------------------------------------------------------
# Auth - simulated role-aware login (no CAC/PIV/MFA in this prototype)
# ---------------------------------------------------------------------------
ROLE_ACCESS_MATRIX = {
    "poam.approve_closure": ("ISSM", "Admin"),
    "artifact.approve":     ("ISSM", "SCA", "Admin"),
    "ao.record_decision":   ("AO", "Admin"),
    "system.register":      ("ISSO", "ISSM", "Admin"),
}

ROLE_TO_SYSTEM_FIELD = {
    "ISSO": "isso_id",
    "ISSM": "issm_id",
    "SCA":  "sca_id",
    "AO":   "ao_id",
}


def current_user():
    """Return the User row for the session user, or None if not logged in."""
    if hasattr(g, "_current_user"):
        return g._current_user
    uid_in = session.get("user_id")
    g._current_user = User.query.get(uid_in) if uid_in else None
    return g._current_user


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not current_user():
            session["next_url"] = request.url
            return redirect(url_for("login"))
        return view(*args, **kwargs)
    return wrapped


def role_required(*roles):
    def deco(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            u = current_user()
            if not u:
                session["next_url"] = request.url
                return redirect(url_for("login"))
            if u.role_name not in roles and u.role_name != "Admin":
                flash(f"That action requires one of: {', '.join(roles)}. "
                      f"You are signed in as {u.role_name}.", "err")
                return redirect(request.referrer or url_for("index"))
            return view(*args, **kwargs)
        return wrapped
    return deco


def _user_roles_on_system(system, user):
    """List of role labels (ISSO/ISSM/SCA/AO) the user holds on the system.
    Admin returns all four. Empty list means no access."""
    if not user or not system:
        return []
    if user.role_name == "Admin":
        return ["ISSO", "ISSM", "SCA", "AO"]
    roles = []
    if system.isso_id == user.user_id: roles.append("ISSO")
    if system.issm_id == user.user_id: roles.append("ISSM")
    if system.sca_id  == user.user_id: roles.append("SCA")
    if system.ao_id   == user.user_id: roles.append("AO")
    return roles


def system_access_required(view):
    """Gate a route by per-system role assignment. Use AFTER @login_required."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        u = current_user()
        if not u:
            session["next_url"] = request.url
            return redirect(url_for("login"))
        sid = kwargs.get("system_id")
        if sid:
            s = System.query.get_or_404(sid)
            roles = _user_roles_on_system(s, u)
            if not roles:
                flash(f"You do not have a role on '{s.name}'. Sign in as the "
                      f"assigned ISSO, ISSM, SCA, or AO (or Admin) to view it.",
                      "err")
                return redirect(url_for("me_systems"))
        return view(*args, **kwargs)
    return wrapped


def _visible_systems(role_attr):
    """Return systems the current user can see for a given role view.
    Admin sees every system; everyone else sees only those where they are
    the named role assignee. role_attr is one of 'isso_id', 'issm_id',
    'sca_id', 'ao_id'."""
    user = current_user()
    if not user:
        return []
    if user.role_name == "Admin":
        return System.query.order_by(System.created_date.desc()).all()
    return (System.query.filter(getattr(System, role_attr) == user.user_id)
            .order_by(System.created_date.desc()).all())


@app.context_processor
def inject_user():
    """Make current_user() available to every template as `current_user`."""
    return {"current_user": current_user()}


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        uid_in = request.form.get("user_id", "")
        u = User.query.get(uid_in)
        if not u or not u.active:
            flash("Unknown user. Pick one of the seeded accounts.", "err")
            return redirect(url_for("login"))
        session["user_id"] = u.user_id
        u.last_login = now()
        db.session.commit()
        flash(f"Signed in as {u.name} ({u.role_name}).", "ok")
        nxt = session.pop("next_url", None) or url_for("index")
        return redirect(nxt)
    users = User.query.filter_by(active=True).order_by(User.name.asc()).all()
    return render_template("login.html", users=users)


@app.route("/logout", methods=["POST", "GET"])
def logout():
    name = current_user().name if current_user() else None
    session.pop("user_id", None)
    if name:
        flash(f"Signed out {name}.", "ok")
    return redirect(url_for("login"))


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/")
@login_required
def index():
    """FR-9.1 ISSO Dashboard - system list with metrics."""
    systems = _visible_systems('isso_id')
    for s in systems:
        s.completeness_score = compute_completeness(s)
    db.session.commit()
    metrics = {
        "total_systems": len(systems),
        "open_poams": POAM.query.filter_by(status="open").count(),
        "in_authorize": System.query.filter_by(current_step=5).count(),
        "in_monitor": System.query.filter_by(current_step=6).count(),
    }
    return render_template("index.html", systems=systems, metrics=metrics,
                           rmf_steps=dict(RMF_STEPS,
                            scope_role="ISSO",
                            is_admin=(current_user().role_name == "Admin")))


@app.route("/system/new", methods=["GET", "POST"])
@login_required
@role_required("ISSO", "ISSM")
def system_new():
    if request.method == "POST":
        s = System(
            name=request.form["name"].strip(),
            acronym=request.form.get("acronym", "").strip(),
            system_type=request.form.get("system_type"),
            impact_level=request.form.get("impact_level"),
            cia_confidentiality=request.form.get("cia_c"),
            cia_integrity=request.form.get("cia_i"),
            cia_availability=request.form.get("cia_a"),
            ato_type=request.form.get("ato_type"),
            boundary_statement=request.form.get("boundary_statement", "").strip(),
            mission_desc=request.form.get("mission_desc", "").strip(),
            data_types=", ".join(request.form.getlist("data_types")),
            is_nss=bool(request.form.get("is_nss")),
        )
        s.completeness_score = compute_completeness(s)
        db.session.add(s)
        db.session.commit()
        flash(f"System '{s.name}' registered. RMF Step 0 in progress.", "ok")
        return redirect(url_for("system_detail", system_id=s.system_id))
    return render_template("system_form.html",
                           ato_types=ATO_TYPES, system_types=SYSTEM_TYPES,
                           impact_levels=IMPACT_LEVELS, cia_levels=CIA_LEVELS,
                           data_types=DATA_TYPES)


@app.route("/system/<system_id>")
@login_required
@system_access_required
def system_detail(system_id):
    s = System.query.get_or_404(system_id)
    s.completeness_score = compute_completeness(s)
    db.session.commit()
    inv_counts = {t: InventoryItem.query.filter_by(system_id=s.system_id,
                                                    item_type=t).count()
                  for t in INVENTORY_TYPES}
    poam_count = POAM.query.filter_by(system_id=s.system_id).count()
    artifact_count = Artifact.query.filter_by(system_id=s.system_id).count()
    return render_template("system_detail.html", system=s,
                           rmf_steps=RMF_STEPS, inv_counts=inv_counts,
                           poam_count=poam_count, artifact_count=artifact_count)


@app.route("/system/<system_id>/inventory", methods=["GET", "POST"])
@login_required
@system_access_required
def inventory(system_id):
    s = System.query.get_or_404(system_id)
    item_type = request.args.get("type", "hardware")
    if item_type not in INVENTORY_TYPES:
        item_type = "hardware"

    if request.method == "POST":
        item = InventoryItem(
            system_id=s.system_id,
            item_type=item_type,
            name=request.form["name"].strip(),
            vendor=request.form.get("vendor", "").strip(),
            version=request.form.get("version", "").strip(),
            ip_address=request.form.get("ip_address", "").strip(),
            mac_address=request.form.get("mac_address", "").strip(),
            os=request.form.get("os", "").strip(),
            os_version=request.form.get("os_version", "").strip(),
            patch_level=request.form.get("patch_level", "").strip(),
            license=request.form.get("license", "").strip(),
            component_origin=request.form.get("component_origin", "").strip(),
            owner=request.form.get("owner", "").strip(),
            location=request.form.get("location", "").strip(),
        )
        eos = request.form.get("eos_date", "").strip()
        if eos:
            try:
                item.eos_date = datetime.strptime(eos, "%Y-%m-%d").date()
            except ValueError:
                pass
        db.session.add(item)
        db.session.commit()
        flash(f"Added {item.name} to {item_type} inventory.", "ok")
        return redirect(url_for("inventory", system_id=s.system_id, type=item_type))

    items = InventoryItem.query.filter_by(system_id=s.system_id,
                                          item_type=item_type).all()
    today = datetime.now().date()
    flagged = []
    for it in items:
        flags = []
        if not it.version:
            flags.append("missing version")
        if it.eos_date and it.eos_date < today:
            flags.append("past EOS")
        if it.eos_date and (it.eos_date - today).days < 90 and it.eos_date >= today:
            flags.append("EOS within 90 days")
        flagged.append((it, flags))
    counts = {t: InventoryItem.query.filter_by(system_id=s.system_id,
                                                item_type=t).count()
              for t in INVENTORY_TYPES}
    return render_template("inventory.html", system=s, item_type=item_type,
                           items=flagged, counts=counts,
                           inventory_types=INVENTORY_TYPES)


@app.route("/system/<system_id>/inventory/import", methods=["POST"])
@login_required
@system_access_required
def inventory_import(system_id):
    """FR-1.2.5 - CSV bulk import."""
    s = System.query.get_or_404(system_id)
    item_type = request.form.get("type", "hardware")
    file = request.files.get("csv_file")
    if not file or file.filename == "":
        flash("No CSV file provided.", "err")
        return redirect(url_for("inventory", system_id=s.system_id, type=item_type))
    try:
        text = file.read().decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
        added = 0
        for row in reader:
            name = (row.get("name") or row.get("Name") or "").strip()
            if not name:
                continue
            it = InventoryItem(
                system_id=s.system_id, item_type=item_type, name=name,
                vendor=(row.get("vendor") or "").strip(),
                version=(row.get("version") or "").strip(),
                ip_address=(row.get("ip_address") or "").strip(),
                mac_address=(row.get("mac_address") or "").strip(),
                os=(row.get("os") or "").strip(),
                os_version=(row.get("os_version") or "").strip(),
                patch_level=(row.get("patch_level") or "").strip(),
                license=(row.get("license") or "").strip(),
                component_origin=(row.get("component_origin") or "").strip(),
                owner=(row.get("owner") or "").strip(),
                location=(row.get("location") or "").strip(),
            )
            eos = (row.get("eos_date") or "").strip()
            if eos:
                try:
                    it.eos_date = datetime.strptime(eos, "%Y-%m-%d").date()
                except ValueError:
                    pass
            db.session.add(it)
            added += 1
        db.session.commit()
        flash(f"Imported {added} {item_type} items.", "ok")
    except Exception as exc:
        flash(f"Import failed: {exc}", "err")
    return redirect(url_for("inventory", system_id=s.system_id, type=item_type))


@app.route("/system/<system_id>/inventory/<item_id>/delete", methods=["POST"])
@login_required
@system_access_required
def inventory_delete(system_id, item_id):
    item = InventoryItem.query.get_or_404(item_id)
    if item.system_id != system_id:
        abort(404)
    item_type = item.item_type
    db.session.delete(item)
    db.session.commit()
    flash("Inventory item removed.", "ok")
    return redirect(url_for("inventory", system_id=system_id, type=item_type))


@app.route("/system/<system_id>/rmf-step/<int:step>")
@login_required
@system_access_required
def rmf_step(system_id, step):
    s = System.query.get_or_404(system_id)
    if step < 0 or step > 6:
        abort(404)
    step_info = dict(RMF_STEPS).get(step, "Unknown")
    tasks = task_status_for_step(s.system_id, step)
    met, total, missing = gate_status_for_step(s.system_id, step)
    outputs = STEP_OUTPUTS.get(step, [])
    gate_desc = GATE_DESC.get(step, "")
    return render_template("rmf_step.html", system=s, step=step,
                           step_name=step_info, rmf_steps=RMF_STEPS,
                           tasks=tasks, gate_met=met, gate_total=total,
                           gate_missing=missing, gate_desc=gate_desc,
                           outputs=outputs)


@app.route("/system/<system_id>/rmf-step/<int:step>/task/<task_key>/toggle",
           methods=["POST"])
@login_required
@system_access_required
def rmf_task_toggle(system_id, step, task_key):
    s = System.query.get_or_404(system_id)
    valid_keys = {t["key"] for t in TASK_CATALOG.get(step, [])}
    if task_key not in valid_keys:
        abort(404)
    existing = StepTask.query.filter_by(system_id=s.system_id,
                                         task_key=task_key).first()
    if existing and existing.completed_at:
        existing.completed_at = None
        existing.completed_by = None
    elif existing:
        existing.completed_at = now()
        existing.completed_by = current_user().name
    else:
        db.session.add(StepTask(system_id=s.system_id, step=step,
                                task_key=task_key,
                                completed_at=now(),
                                completed_by=current_user().name))
    db.session.commit()
    return redirect(url_for("rmf_step", system_id=s.system_id, step=step))


@app.route("/system/<system_id>/advance-step", methods=["POST"])
@login_required
@system_access_required
def rmf_advance_step(system_id):
    s = System.query.get_or_404(system_id)
    target = int(request.form.get("target", s.current_step + 1))
    if target < 0 or target > 6:
        abort(400)
    met, total, missing = gate_status_for_step(s.system_id, s.current_step)
    if missing:
        flash(f"Advanced from Step {s.current_step} to Step {target} with "
              f"{total - met} of {total} gate items still open: "
              f"{'; '.join(missing[:3])}{'...' if len(missing) > 3 else ''}",
              "message")
    else:
        flash(f"Advanced from Step {s.current_step} to Step {target}. "
              f"All gate items met.", "ok")
    s.current_step = target
    db.session.commit()
    return redirect(url_for("rmf_step", system_id=s.system_id, step=target))


@app.route("/api/ai-chat", methods=["POST"])
@login_required
def ai_chat():
    """FR-4.x. Routes the user prompt through the configured LLM (or the
    mocked fallback). Logs every interaction to AIInteraction for audit."""
    data = request.get_json(silent=True) or {}
    mode = data.get("mode", "isso_coach")
    if mode not in ai_provider.AI_MODES:
        mode = "isso_coach"
    prompt = (data.get("prompt") or "").strip()
    system_id = data.get("system_id") or None

    # Build live system context if a system is in scope
    context_block = ""
    if system_id:
        s = System.query.get(system_id)
        if s:
            controls = Control.query.filter_by(system_id=s.system_id).all()
            poams = POAM.query.filter_by(system_id=s.system_id).all()
            vulns = Vulnerability.query.filter_by(system_id=s.system_id).all()
            inv = InventoryItem.query.filter_by(system_id=s.system_id).all()
            arts = Artifact.query.filter_by(system_id=s.system_id).all()
            context_block = ai_provider.build_system_context(
                s, controls=controls, poams=poams, vulns=vulns,
                inventory=inv, artifacts=arts)

    # Use the existing canned response as the mock fallback when no API key
    canned = AI_CANNED.get(mode)
    result = ai_provider.generate(mode, prompt, context_block=context_block,
                                   canned_fallback=canned)

    # Append the FR-4.3 / FR-4.5 footer for every non-error response
    answer_text = result.get("answer", "")
    if not result.get("blocked") and result.get("provider") != "error":
        answer_text = (answer_text.rstrip() +
                       "\n\nLOCAL VALIDATION REQUIRED. AI-generated content. "
                       "The AO records the authorization decision.")

    interaction = AIInteraction(
        user_id=current_user().user_id,
        system_id=system_id,
        assistant_mode=mode,
        prompt_text=prompt,
        response_text=answer_text,
        confidence_score=result.get("confidence", 0.0),
        flagged_for_review=True,
        review_status="unreviewed",
        sources_cited_json=json.dumps(result.get("sources", [])),
    )
    db.session.add(interaction)
    db.session.commit()

    return jsonify({
        "mode": ai_provider.AI_MODES[mode],
        "response": answer_text,
        "sources": result.get("sources", []),
        "confidence": result.get("confidence", 0.0),
        "blocked": bool(result.get("blocked")),
        "provider": result.get("provider", "unknown"),
        "human_review_required": True,
        "disclaimer": ("AI-generated content. Local validation required. "
                       "Never replaces an AO authorization decision."),
        "interaction_id": interaction.interaction_id,
    })


@app.route("/api/ai-status")
@login_required
def ai_status():
    """Tells the AI panel whether real or mocked is active."""
    return jsonify({
        "real": ai_provider.is_real_llm_available(),
        "label": ai_provider.provider_label(),
    })



# ---------------------------------------------------------------------------
# Module 5 - Artifact library + .docx / .xlsx generators (FR-5.x)
# ---------------------------------------------------------------------------
import os as _os
from werkzeug.utils import secure_filename
ARTIFACT_STORAGE_DIR = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)),
                                      "artifacts_storage")
_os.makedirs(ARTIFACT_STORAGE_DIR, exist_ok=True)

# Only these extensions may be uploaded as artifacts / evidence.
ALLOWED_UPLOAD_EXTENSIONS = {
    "pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "md",
    "png", "jpg", "jpeg", "zip", "xml", "json", "nessus", "ckl",
}

ARTIFACT_APPROVAL_STATUSES = ["draft", "in_review", "approved",
                              "rejected", "superseded"]
ARTIFACT_APPROVAL_LABELS = {
    "draft": "Draft",
    "in_review": "In Review",
    "approved": "Approved",
    "rejected": "Rejected",
    "superseded": "Superseded",
}


def _artifact_flags(art):
    """FR-5.6 - flag expired / unsigned / outdated."""
    today = datetime.now(timezone.utc).date()
    flags = []
    if art.expiration_date and art.expiration_date < today:
        flags.append("expired")
    if art.expiration_date and (art.expiration_date - today).days <= 30 \
            and art.expiration_date >= today:
        flags.append("expiring_soon")
    if art.approval_status in ("draft", "in_review", "rejected"):
        flags.append("unsigned")
    if art.approved_date and (today - art.approved_date.date()).days > 365:
        flags.append("review_overdue")
    return flags


@app.route("/artifacts")
@login_required
def artifacts():
    """FR-5.1 / FR-5.2 - 42-template library."""
    by_cat = {k: [] for k in ARTIFACT_CATEGORIES}
    for t in ARTIFACT_TEMPLATES:
        by_cat[t["category"]].append(t)
    return render_template("artifacts.html", categories=ARTIFACT_CATEGORIES,
                            by_category=by_cat,
                            total=len(ARTIFACT_TEMPLATES))


@app.route("/controls")
@login_required
def controls():
    """FR-6.1 / FR-6.3 / FR-6.4 - NIST SP 800-53 Rev. 5 catalog browser."""
    search = (request.args.get("q") or "").strip()
    active_family = (request.args.get("family") or "").strip() or None
    active_baseline = (request.args.get("baseline") or "").strip() or None
    families = []
    for code, name in FAMILIES_MAP.items():
        fam_q = ControlCatalog.query.filter_by(family=code)
        count = fam_q.count()
        if not count:
            continue
        families.append((code, {
            "name": name, "count": count,
            "low": fam_q.filter_by(baseline_low=True).count(),
            "mod": fam_q.filter_by(baseline_mod=True).count(),
            "high": fam_q.filter_by(baseline_high=True).count(),
        }))
    q = ControlCatalog.query
    if active_family:
        q = q.filter_by(family=active_family)
    if active_baseline == "low":
        q = q.filter_by(baseline_low=True)
    elif active_baseline == "moderate":
        q = q.filter_by(baseline_mod=True)
    elif active_baseline == "high":
        q = q.filter_by(baseline_high=True)
    if search:
        like = f"%{search}%"
        q = q.filter(or_(ControlCatalog.nist_id.ilike(like),
                         ControlCatalog.title.ilike(like),
                         ControlCatalog.statement.ilike(like)))
    controls_list = q.order_by(ControlCatalog.nist_id).all()
    return render_template("controls.html", total=ControlCatalog.query.count(),
                           families=families, controls=controls_list,
                           active_family=active_family,
                           active_baseline=active_baseline, search=search)


@app.route("/controls/<nist_id>")
@login_required
def control_detail(nist_id):
    """FR-6.2 - control deep-dive."""
    c = ControlCatalog.query.get_or_404(nist_id)
    return render_template("control_detail.html", c=c,
                           artifacts=json.loads(c.expected_artifacts or "[]"),
                           evidence=json.loads(c.evidence_examples or "[]"),
                           methods=json.loads(c.assessment_methods or "[]"),
                           roles=json.loads(c.responsible_roles or "[]"),
                           mistakes=json.loads(c.common_mistakes or "[]"),
                           triggers=json.loads(c.poam_triggers or "[]"))


@app.route("/artifacts/<key>")
@login_required
def artifact_template_detail(key):
    t = get_template_def(key)
    if not t:
        abort(404)
    return render_template("artifact_detail.html", t=t)


@app.route("/system/<system_id>/artifacts")
@login_required
@system_access_required
def system_artifacts(system_id):
    """FR-5.4 / FR-5.6 - per-system register with version, approval, flags."""
    s = System.query.get_or_404(system_id)
    rows = (Artifact.query.filter_by(system_id=s.system_id)
            .order_by(Artifact.upload_date.desc()).all())
    items = [(a, _artifact_flags(a)) for a in rows]
    summary = {
        "total": len(rows),
        "approved": sum(1 for a in rows if a.approval_status == "approved"),
        "draft": sum(1 for a in rows if a.approval_status == "draft"),
        "expiring": sum(1 for a, f in items if "expiring_soon" in f),
        "expired": sum(1 for a, f in items if "expired" in f),
        "review_overdue": sum(1 for a, f in items if "review_overdue" in f),
    }
    return render_template("system_artifacts.html", system=s, items=items,
                            summary=summary,
                            templates=ARTIFACT_TEMPLATES,
                            statuses=ARTIFACT_APPROVAL_STATUSES,
                            status_labels=ARTIFACT_APPROVAL_LABELS)


@app.route("/system/<system_id>/artifacts/generate", methods=["POST"])
@login_required
@system_access_required
def system_artifact_generate(system_id):
    """FR-5.3 - generate a real .docx or .xlsx using live system data."""
    s = System.query.get_or_404(system_id)
    key = request.form.get("template_key", "").strip()
    tpl = get_template_def(key)
    if not tpl or not tpl.get("generator"):
        flash("That template has no generator wired in this build.", "err")
        return redirect(url_for("system_artifacts", system_id=s.system_id))

    try:
        from artifact_generators import GENERATORS
    except ImportError as exc:
        flash(f"Generator module unavailable: {exc}", "err")
        return redirect(url_for("system_artifacts", system_id=s.system_id))

    gen = GENERATORS.get(tpl["generator"])
    if not gen:
        flash(f"No generator function found for '{tpl['generator']}'.", "err")
        return redirect(url_for("system_artifacts", system_id=s.system_id))

    # Pull live data the generator needs
    controls = Control.query.filter_by(system_id=s.system_id) \
        .order_by(Control.nist_id.asc()).all()
    poams = POAM.query.filter_by(system_id=s.system_id) \
        .order_by(POAM.scheduled_completion.asc().nullslast()).all()
    inv_all = InventoryItem.query.filter_by(system_id=s.system_id).all()
    hw = [i for i in inv_all if i.item_type == "hardware"]
    sw = [i for i in inv_all if i.item_type == "software"]
    scans = Scan.query.filter_by(system_id=s.system_id) \
        .order_by(Scan.scan_date.asc()).all()
    user_ids = {s.isso_id, s.issm_id, s.sca_id, s.ao_id} - {None}
    users = {u.user_id: u for u in User.query.filter(User.user_id.in_(user_ids)).all()} if user_ids else {}

    try:
        file_bytes, fname, mime = gen(
            system=s, controls=controls, poams=poams,
            inv=inv_all, hw=hw, sw=sw, scans=scans, users=users)
    except ImportError as exc:
        flash(f"Generation failed: {exc}. Run 'pip install -r requirements.txt' "
              f"to install python-docx and openpyxl.", "err")
        return redirect(url_for("system_artifacts", system_id=s.system_id))
    except Exception as exc:
        flash(f"Generation failed: {exc}", "err")
        return redirect(url_for("system_artifacts", system_id=s.system_id))

    art_id = uid()
    safe_name = fname.replace("/", "_").replace("\\", "_")
    storage_path = _os.path.join(ARTIFACT_STORAGE_DIR, f"{art_id}_{safe_name}")
    with open(storage_path, "wb") as f:
        f.write(file_bytes)

    # Version bump if same artifact_key already exists
    prior = (Artifact.query.filter_by(system_id=s.system_id, artifact_key=key)
             .order_by(Artifact.version_number.desc()).first())
    next_ver = (prior.version_number + 1) if prior and prior.version_number else 1
    art = Artifact(
        artifact_id=art_id, artifact_key=key, name=tpl["name"],
        type=tpl["format"], system_id=s.system_id,
        version=f"{next_ver}.0", version_number=next_ver,
        uploaded_by=current_user().name,
        approval_status="draft",
        file_path=storage_path,
        control_mappings_json=json.dumps(tpl.get("control_mappings", [])),
        emass_location=tpl.get("emass_location"),
        supersedes_id=prior.artifact_id if prior else None,
        generated_from_template=True,
    )
    db.session.add(art)
    if prior and prior.approval_status != "superseded":
        prior.approval_status = "superseded"
    db.session.commit()
    flash(f"Generated {tpl['name']} v{next_ver}.0 ({fname}).", "ok")
    return redirect(url_for("system_artifact_detail",
                             system_id=s.system_id, artifact_id=art_id))


@app.route("/system/<system_id>/artifacts/upload", methods=["POST"])
@login_required
@system_access_required
def system_artifact_upload(system_id):
    """FR-5.4 - manual upload of an artifact, with version tracking."""
    s = System.query.get_or_404(system_id)
    key = request.form.get("template_key", "").strip()
    tpl = get_template_def(key) if key else None
    file = request.files.get("artifact_file")
    if not file or not file.filename:
        flash("No file uploaded.", "err")
        return redirect(url_for("system_artifacts", system_id=s.system_id))

    art_id = uid()
    # Reject anything not on the allowlist, then sanitize the name with
    # werkzeug.secure_filename to strip path traversal and unsafe characters.
    incoming_ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if incoming_ext not in ALLOWED_UPLOAD_EXTENSIONS:
        flash(f"File type '.{incoming_ext or '?'}' is not allowed.", "err")
        return redirect(url_for("system_artifacts", system_id=s.system_id))
    safe_name = secure_filename(file.filename) or f"{art_id}.{incoming_ext}"
    storage_path = _os.path.join(ARTIFACT_STORAGE_DIR, f"{art_id}_{safe_name}")
    file.save(storage_path)

    prior = None
    if key:
        prior = (Artifact.query.filter_by(system_id=s.system_id, artifact_key=key)
                 .order_by(Artifact.version_number.desc()).first())
    next_ver = (prior.version_number + 1) if prior and prior.version_number else 1

    ext = safe_name.rsplit(".", 1)[-1].lower() if "." in safe_name else ""
    art = Artifact(
        artifact_id=art_id, artifact_key=key or None,
        name=tpl["name"] if tpl else safe_name,
        type=ext, system_id=s.system_id,
        version=f"{next_ver}.0", version_number=next_ver,
        uploaded_by=current_user().name, approval_status="draft",
        file_path=storage_path,
        control_mappings_json=json.dumps(tpl.get("control_mappings", []) if tpl else []),
        emass_location=tpl.get("emass_location") if tpl else None,
        supersedes_id=prior.artifact_id if prior else None,
        generated_from_template=False,
    )
    db.session.add(art)
    if prior and prior.approval_status != "superseded":
        prior.approval_status = "superseded"
    db.session.commit()
    flash(f"Uploaded '{art.name}' v{next_ver}.0.", "ok")
    return redirect(url_for("system_artifact_detail",
                             system_id=s.system_id, artifact_id=art_id))


@app.route("/system/<system_id>/artifacts/<artifact_id>")
@login_required
@system_access_required
def system_artifact_detail(system_id, artifact_id):
    s = System.query.get_or_404(system_id)
    art = Artifact.query.get_or_404(artifact_id)
    if art.system_id != s.system_id:
        abort(404)
    tpl = get_template_def(art.artifact_key) if art.artifact_key else None
    flags = _artifact_flags(art)
    versions = (Artifact.query.filter_by(system_id=s.system_id,
                                          artifact_key=art.artifact_key)
                .order_by(Artifact.version_number.desc()).all()
                if art.artifact_key else [art])
    try:
        mappings = json.loads(art.control_mappings_json or "[]")
    except (ValueError, TypeError):
        mappings = []
    return render_template("system_artifact_detail.html", system=s, art=art,
                            tpl=tpl, flags=flags, versions=versions,
                            mappings=mappings,
                            statuses=ARTIFACT_APPROVAL_STATUSES,
                            status_labels=ARTIFACT_APPROVAL_LABELS)


@app.route("/system/<system_id>/artifacts/<artifact_id>/approve",
           methods=["POST"])
@login_required
@role_required("ISSM", "SCA")
@system_access_required
def system_artifact_approve(system_id, artifact_id):
    """FR-5.4 - approval workflow."""
    s = System.query.get_or_404(system_id)
    art = Artifact.query.get_or_404(artifact_id)
    if art.system_id != s.system_id:
        abort(404)
    new_status = request.form.get("status", "")
    if new_status not in ARTIFACT_APPROVAL_STATUSES:
        abort(400)
    art.approval_status = new_status
    if new_status == "approved":
        art.approver = current_user().name
        art.approved_date = now()
    exp = request.form.get("expiration_date", "").strip()
    if exp:
        try:
            art.expiration_date = datetime.strptime(exp, "%Y-%m-%d").date()
        except ValueError:
            pass
    db.session.commit()
    flash(f"Artifact marked {ARTIFACT_APPROVAL_LABELS[new_status]}.", "ok")
    return redirect(url_for("system_artifact_detail",
                             system_id=s.system_id, artifact_id=art.artifact_id))


@app.route("/system/<system_id>/artifacts/<artifact_id>/download")
@login_required
@system_access_required
def system_artifact_download(system_id, artifact_id):
    s = System.query.get_or_404(system_id)
    art = Artifact.query.get_or_404(artifact_id)
    if art.system_id != s.system_id:
        abort(404)
    if not art.file_path or not _os.path.exists(art.file_path):
        flash("File not found on disk.", "err")
        return redirect(url_for("system_artifact_detail",
                                 system_id=s.system_id,
                                 artifact_id=art.artifact_id))
    from flask import send_file
    download_name = _os.path.basename(art.file_path).split("_", 1)[-1]
    return send_file(art.file_path, as_attachment=True,
                      download_name=download_name)


# ---------------------------------------------------------------------------
# Module 3 - eMASS support hub (FR-3.1 / 3.2 / 3.3 / 3.4 / 3.5 / 3.6)
# ---------------------------------------------------------------------------
EMASS_DISCLAIMER = ("This application is NOT eMASS. Exports prepare data for "
                    "manual entry or bulk upload. Validate every field in "
                    "eMASS before submission. (FR-3.5)")


@app.route("/emass")
@login_required
def emass_hub():
    systems = System.query.order_by(System.created_date.desc()).all()
    cards = []
    for s in systems:
        # Use the lighter validator output to color the card
        controls = Control.query.filter_by(system_id=s.system_id).all()
        poams = POAM.query.filter_by(system_id=s.system_id).all()
        vulns = Vulnerability.query.filter_by(system_id=s.system_id).all()
        inv = InventoryItem.query.filter_by(system_id=s.system_id).all()
        arts = Artifact.query.filter_by(system_id=s.system_id).all()
        findings = emass_validate(s, controls, poams, vulns, inv, arts)
        cards.append({"system": s, "score": emass_readiness_score(findings),
                       "summary": emass_summarize(findings)})
    return render_template("emass_hub.html", cards=cards,
                            disclaimer=EMASS_DISCLAIMER)


@app.route("/emass/common-mistakes")
@login_required
def emass_mistakes():
    by_area = {}
    for m in COMMON_MISTAKES:
        by_area.setdefault(m["area"], []).append(m)
    return render_template("emass_mistakes.html", mistakes=COMMON_MISTAKES,
                            by_area=by_area, disclaimer=EMASS_DISCLAIMER)


@app.route("/emass/field-guides")
@login_required
def emass_field_guides():
    return render_template("emass_guides.html", guides=FIELD_GUIDES,
                            disclaimer=EMASS_DISCLAIMER)


@app.route("/system/<system_id>/emass-readiness")
@login_required
@system_access_required
def system_emass(system_id):
    s = System.query.get_or_404(system_id)
    controls = Control.query.filter_by(system_id=s.system_id).all()
    poams = POAM.query.filter_by(system_id=s.system_id).all()
    vulns = Vulnerability.query.filter_by(system_id=s.system_id).all()
    inv = InventoryItem.query.filter_by(system_id=s.system_id).all()
    arts = Artifact.query.filter_by(system_id=s.system_id).all()
    findings = emass_validate(s, controls, poams, vulns, inv, arts)
    summary = emass_summarize(findings)
    score = emass_readiness_score(findings)
    findings_by_area = {}
    for f in findings:
        findings_by_area.setdefault(f["area"], []).append(f)
    return render_template("system_emass.html", system=s, findings=findings,
                            findings_by_area=findings_by_area,
                            summary=summary, score=score,
                            disclaimer=EMASS_DISCLAIMER)


@app.route("/system/<system_id>/emass/controls.csv")
@login_required
@system_access_required
def system_emass_controls_csv(system_id):
    """FR-3.4 - controls CSV with eMASS-aligned columns."""
    import io as _io
    s = System.query.get_or_404(system_id)
    controls = (Control.query.filter_by(system_id=s.system_id)
                .order_by(Control.nist_id.asc()).all())
    buf = _io.StringIO()
    w = csv.writer(buf)
    w.writerow([
        "System ID", "System Name", "Control ID", "Control Title",
        "Family", "Baseline", "Control Type",
        "Implementation Status", "Implementation Statement",
        "Owner", "Last Reviewed",
    ])
    for c in controls:
        w.writerow([
            s.acronym or s.system_id, s.name,
            c.nist_id or "", c.title or "",
            c.family or "", c.baseline or "", c.control_type or "",
            c.implementation_status or "",
            (c.implementation_statement or "").replace("\n", " ")[:8000],
            c.owner_id or "",
            c.last_reviewed.isoformat() if c.last_reviewed else "",
        ])
    fname = f"emass_controls_{s.acronym or 'system'}_{datetime.now().strftime('%Y%m%d')}.csv"
    return app.response_class(
        buf.getvalue(), mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={fname}"})


@app.route("/system/<system_id>/emass/artifacts.csv")
@login_required
@system_access_required
def system_emass_artifacts_csv(system_id):
    """FR-3.4 - artifacts CSV with eMASS-aligned columns."""
    import io as _io
    s = System.query.get_or_404(system_id)
    arts = (Artifact.query.filter_by(system_id=s.system_id)
            .order_by(Artifact.upload_date.desc()).all())
    buf = _io.StringIO()
    w = csv.writer(buf)
    w.writerow([
        "System ID", "System Name", "Artifact ID", "Artifact Name",
        "Template Key", "Format", "Version", "Approval Status",
        "Approver", "Approved Date", "Expiration Date",
        "Control Mappings", "eMASS Upload Location", "Origin",
    ])
    for a in arts:
        try:
            mappings = json.loads(a.control_mappings_json or "[]")
        except (ValueError, TypeError):
            mappings = []
        w.writerow([
            s.acronym or s.system_id, s.name, a.artifact_id, a.name,
            a.artifact_key or "", a.type or "", a.version or "",
            a.approval_status or "", a.approver or "",
            a.approved_date.isoformat() if a.approved_date else "",
            a.expiration_date.isoformat() if a.expiration_date else "",
            ", ".join(mappings),
            a.emass_location or "",
            "generated" if a.generated_from_template else "uploaded",
        ])
    fname = f"emass_artifacts_{s.acronym or 'system'}_{datetime.now().strftime('%Y%m%d')}.csv"
    return app.response_class(
        buf.getvalue(), mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={fname}"})


# ---------------------------------------------------------------------------
# Module 9 - Role dashboards (FR-9.2 / FR-9.3 / FR-9.4 / FR-9.5)
# ---------------------------------------------------------------------------
def _system_health(s):
    """Aggregate the per-system metrics every dashboard reuses."""
    poams = POAM.query.filter_by(system_id=s.system_id).all()
    vulns = Vulnerability.query.filter_by(system_id=s.system_id).all()
    arts  = Artifact.query.filter_by(system_id=s.system_id).all()
    controls = Control.query.filter_by(system_id=s.system_id).all()
    inv = InventoryItem.query.filter_by(system_id=s.system_id).all()

    open_poams = [p for p in poams if p.status not in ("closed","risk_accepted")]
    cat1 = [p for p in open_poams if p.severity == "CAT I"]
    cat2 = [p for p in open_poams if p.severity == "CAT II"]

    today = datetime.now(timezone.utc).date()
    overdue_poams = [p for p in open_poams
                     if p.scheduled_completion and p.scheduled_completion < today]
    expiring_30 = [p for p in open_poams
                   if p.scheduled_completion
                   and 0 <= (p.scheduled_completion - today).days <= 30]

    open_vulns = [v for v in vulns if v.status == "open"]
    crit_vulns = [v for v in open_vulns if v.severity == "critical"]
    high_vulns = [v for v in open_vulns if v.severity == "high"]

    art_pending_review = [a for a in arts if a.approval_status == "in_review"]
    art_approved = [a for a in arts if a.approval_status == "approved"]
    art_expired = [a for a in arts if a.expiration_date
                   and a.expiration_date < today
                   and a.approval_status != "superseded"]
    art_expiring_30 = [a for a in arts if a.expiration_date
                       and 0 <= (a.expiration_date - today).days <= 30]

    poam_pending_closure = [p for p in poams if p.status == "completed"]

    findings = emass_validate(s, controls, poams, vulns, inv, arts)
    score = emass_readiness_score(findings)

    ato_expiring = (s.ato_expiration is not None and
                    0 <= (s.ato_expiration - today).days <= 90)
    ato_expired = (s.ato_expiration is not None and s.ato_expiration < today)

    # Risk score 0-100 (lower = riskier) based on severity counts
    risk = 100
    risk -= 12 * len(cat1)
    risk -= 4  * len(cat2)
    risk -= 8  * len(crit_vulns)
    risk -= 3  * len(high_vulns)
    risk -= 5  * len(overdue_poams)
    risk = max(0, min(100, risk))

    return {
        "system": s,
        "poams_total": len(poams),
        "open_poams": len(open_poams),
        "cat1": len(cat1), "cat2": len(cat2),
        "overdue_poams": len(overdue_poams),
        "expiring_30_poams": len(expiring_30),
        "open_vulns": len(open_vulns),
        "crit_vulns": len(crit_vulns),
        "high_vulns": len(high_vulns),
        "art_pending_review": len(art_pending_review),
        "art_approved": len(art_approved),
        "art_expired": len(art_expired),
        "art_expiring_30": len(art_expiring_30),
        "poam_pending_closure": len(poam_pending_closure),
        "controls_total": len(controls),
        "controls_implemented": len([c for c in controls
                                      if c.implementation_status == "implemented"]),
        "readiness_score": score,
        "ato_expiring": ato_expiring,
        "ato_expired": ato_expired,
        "risk_score": risk,
    }


def _ao_recommendation(h):
    """Plain-English recommendation. Never replaces the AO decision (FR-4.5)."""
    if h["ato_expired"]:
        return ("renewal_required",
                "ATO has expired. Recommend immediate renewal action.")
    if h["cat1"] >= 1 or h["crit_vulns"] >= 1:
        return ("conditions",
                "Open CAT I or Critical vulnerability findings. Recommend ATO with conditions or denial pending remediation.")
    if h["readiness_score"] < 60:
        return ("conditions",
                "eMASS readiness score below 60. Recommend conditions until validator findings are addressed.")
    if h["overdue_poams"] >= 3:
        return ("conditions",
                "Multiple POA&Ms past scheduled completion. Recommend conditions tied to POA&M closure.")
    if h["readiness_score"] >= 90 and h["cat1"] == 0:
        return ("recommend_ato",
                "No CAT I findings; readiness score >= 90. Package recommended for ATO.")
    return ("review",
            "Package requires AO review. No automatic blockers detected, but residual risk warrants discussion.")


@app.route("/dashboards/issm")
@login_required
def dashboard_issm():
    """FR-9.2 - portfolio oversight."""
    systems = _visible_systems('issm_id')
    health = [_system_health(s) for s in systems]

    # Roll-ups
    portfolio = {
        "total_systems": len(systems),
        "open_cat1": sum(h["cat1"] for h in health),
        "open_cat2": sum(h["cat2"] for h in health),
        "open_critical_vulns": sum(h["crit_vulns"] for h in health),
        "open_high_vulns": sum(h["high_vulns"] for h in health),
        "ato_expiring_90": sum(1 for h in health if h["ato_expiring"]),
        "ato_expired": sum(1 for h in health if h["ato_expired"]),
        "art_pending_review": sum(h["art_pending_review"] for h in health),
        "poam_pending_closure": sum(h["poam_pending_closure"] for h in health),
    }
    high_risk = sorted(health, key=lambda h: h["risk_score"])[:5]
    return render_template("dashboard_issm.html", health=health,
                            portfolio=portfolio, high_risk=high_risk,
                            scope_role="ISSM",
                            is_admin=(current_user().role_name == "Admin"))


@app.route("/dashboards/sca")
@login_required
def dashboard_sca():
    """FR-9.3 - independent assessment view."""
    systems = _visible_systems('sca_id')
    health = [_system_health(s) for s in systems]

    # Per-system SAR/SAP status from Module 5 artifacts
    rows = []
    for h in health:
        s = h["system"]
        sar = (Artifact.query.filter_by(system_id=s.system_id, artifact_key="sar")
               .order_by(Artifact.upload_date.desc()).first())
        sap = (Artifact.query.filter_by(system_id=s.system_id, artifact_key="sap")
               .order_by(Artifact.upload_date.desc()).first())
        rows.append({
            "h": h, "sap": sap, "sar": sar,
            "in_assess": s.current_step == 4,
            "evidence_unsigned": Artifact.query.filter_by(
                system_id=s.system_id, approval_status="draft").count(),
        })

    queue_pending = sum(r["h"]["art_pending_review"] for r in rows)
    in_assess = sum(1 for r in rows if r["in_assess"])
    sar_missing = sum(1 for r in rows if not r["sar"])
    sap_missing = sum(1 for r in rows if not r["sap"])

    return render_template("dashboard_sca.html", rows=rows,
                            queue_pending=queue_pending,
                            in_assess=in_assess,
                            sar_missing=sar_missing,
                            sap_missing=sap_missing,
                            scope_role="SCA",
                            is_admin=(current_user().role_name == "Admin"))


@app.route("/dashboards/ao")
@login_required
def dashboard_ao():
    """FR-9.4 - AO risk view. Recommendations only; AO decisions are recorded by the AO."""
    systems = _visible_systems('ao_id')
    health = [_system_health(s) for s in systems]

    rows = []
    for h in health:
        rec_key, rec_text = _ao_recommendation(h)
        rows.append({"h": h, "rec_key": rec_key, "rec_text": rec_text})

    portfolio = {
        "recommend_ato": sum(1 for r in rows if r["rec_key"] == "recommend_ato"),
        "conditions": sum(1 for r in rows if r["rec_key"] == "conditions"),
        "renewal_required": sum(1 for r in rows if r["rec_key"] == "renewal_required"),
        "review": sum(1 for r in rows if r["rec_key"] == "review"),
        "open_cat1_total": sum(h["cat1"] for h in health),
        "ato_expiring_90": sum(1 for h in health if h["ato_expiring"]),
        "ato_expired": sum(1 for h in health if h["ato_expired"]),
    }
    return render_template("dashboard_ao.html", rows=rows,
                            portfolio=portfolio,
                            scope_role="AO",
                            is_admin=(current_user().role_name == "Admin"))


# ---------------------------------------------------------------------------
# Audit log viewer - AIInteraction (FR-4.4 / NFR-2.8)
# ---------------------------------------------------------------------------
AI_REVIEW_STATUSES = ["unreviewed", "reviewed", "rejected"]
AI_REVIEW_LABELS = {
    "unreviewed": "Unreviewed",
    "reviewed":   "Reviewed (accepted)",
    "rejected":   "Rejected",
}

# Roles that can see all interactions across the org. ISSO sees only their own.
AI_AUDIT_FULL_VIEW_ROLES = ("ISSM", "SCA", "AO", "Admin")


def _ai_audit_can_view_all():
    u = current_user()
    return bool(u and u.role_name in AI_AUDIT_FULL_VIEW_ROLES)


@app.route("/audit/ai")
@login_required
def audit_ai_list():
    user = current_user()
    q = AIInteraction.query
    if not _ai_audit_can_view_all():
        q = q.filter_by(user_id=user.user_id)

    f_user   = request.args.get("user", "").strip() or None
    f_system = request.args.get("system", "").strip() or None
    f_mode   = request.args.get("mode", "").strip() or None
    f_status = request.args.get("status", "").strip() or None
    f_search = request.args.get("q", "").strip() or None
    f_from   = request.args.get("date_from", "").strip() or None
    f_to     = request.args.get("date_to", "").strip() or None

    if f_user and _ai_audit_can_view_all():
        q = q.filter_by(user_id=f_user)
    if f_system:
        q = q.filter_by(system_id=f_system)
    if f_mode:
        q = q.filter_by(assistant_mode=f_mode)
    if f_status:
        q = q.filter_by(review_status=f_status)
    if f_search:
        like = f"%{f_search}%"
        q = q.filter(db.or_(AIInteraction.prompt_text.ilike(like),
                            AIInteraction.response_text.ilike(like)))
    if f_from:
        try:
            d_from = datetime.strptime(f_from, "%Y-%m-%d")
            q = q.filter(AIInteraction.timestamp >= d_from)
        except ValueError:
            pass
    if f_to:
        try:
            d_to = datetime.strptime(f_to, "%Y-%m-%d")
            d_to = d_to.replace(hour=23, minute=59, second=59)
            q = q.filter(AIInteraction.timestamp <= d_to)
        except ValueError:
            pass

    rows = q.order_by(AIInteraction.timestamp.desc()).limit(500).all()

    # Look up display names for users and systems referenced
    user_ids = {r.user_id for r in rows if r.user_id}
    sys_ids  = {r.system_id for r in rows if r.system_id}
    users_by_id = {u.user_id: u for u in
                   User.query.filter(User.user_id.in_(user_ids)).all()} if user_ids else {}
    systems_by_id = {s.system_id: s for s in
                     System.query.filter(System.system_id.in_(sys_ids)).all()} if sys_ids else {}

    # Summary counts (over the unfiltered scope visible to the user)
    base = (AIInteraction.query if _ai_audit_can_view_all()
            else AIInteraction.query.filter_by(user_id=user.user_id))
    summary = {
        "total":       base.count(),
        "unreviewed":  base.filter_by(review_status="unreviewed").count(),
        "reviewed":    base.filter_by(review_status="reviewed").count(),
        "rejected":    base.filter_by(review_status="rejected").count(),
    }

    # Filter dropdown options (limit to whatever the user can see)
    if _ai_audit_can_view_all():
        all_users = User.query.order_by(User.name.asc()).all()
    else:
        all_users = [user]
    all_systems = System.query.order_by(System.name.asc()).all()
    all_modes = list(AI_MODES.keys())

    return render_template("audit_ai_list.html", rows=rows,
                            users_by_id=users_by_id,
                            systems_by_id=systems_by_id,
                            summary=summary,
                            all_users=all_users,
                            all_systems=all_systems,
                            all_modes=all_modes,
                            ai_modes_labels=AI_MODES,
                            review_statuses=AI_REVIEW_STATUSES,
                            review_labels=AI_REVIEW_LABELS,
                            full_view=_ai_audit_can_view_all(),
                            filters={
                                "user": f_user, "system": f_system,
                                "mode": f_mode, "status": f_status,
                                "q": f_search or "",
                                "date_from": f_from or "", "date_to": f_to or "",
                            })


@app.route("/audit/ai/<interaction_id>")
@login_required
def audit_ai_detail(interaction_id):
    ai = AIInteraction.query.get_or_404(interaction_id)
    user = current_user()
    if not _ai_audit_can_view_all() and ai.user_id != user.user_id:
        abort(403)
    user_obj = User.query.get(ai.user_id) if ai.user_id else None
    sys_obj = System.query.get(ai.system_id) if ai.system_id else None
    try:
        sources = json.loads(ai.sources_cited_json or "[]")
    except (ValueError, TypeError):
        sources = []
    return render_template("audit_ai_detail.html", ai=ai,
                            user_obj=user_obj, sys_obj=sys_obj,
                            sources=sources,
                            ai_modes_labels=AI_MODES,
                            review_statuses=AI_REVIEW_STATUSES,
                            review_labels=AI_REVIEW_LABELS)


@app.route("/audit/ai/<interaction_id>/review", methods=["POST"])
@login_required
@role_required("ISSM", "SCA", "AO")
def audit_ai_review(interaction_id):
    """Record a reviewer action. Admin always passes through role_required."""
    ai = AIInteraction.query.get_or_404(interaction_id)
    new_status = request.form.get("status", "")
    if new_status not in AI_REVIEW_STATUSES:
        abort(400)
    notes = (request.form.get("notes", "") or "").strip()
    ai.review_status = new_status
    ai.reviewer_name = current_user().name
    ai.review_timestamp = now()
    if notes:
        ai.review_notes = notes
    db.session.commit()
    flash(f"Interaction marked {AI_REVIEW_LABELS[new_status]}.", "ok")
    return redirect(url_for("audit_ai_detail", interaction_id=ai.interaction_id))


# ---------------------------------------------------------------------------
# /me/* - per-user navigation aids (My Systems, My Queue)
# ---------------------------------------------------------------------------
def _all_assigned_systems(user):
    """Every system where the user has ANY role assignment. Admin sees all."""
    if user.role_name == "Admin":
        return System.query.order_by(System.created_date.desc()).all()
    from sqlalchemy import or_
    return (System.query.filter(or_(
        System.isso_id == user.user_id,
        System.issm_id == user.user_id,
        System.sca_id  == user.user_id,
        System.ao_id   == user.user_id,
    )).order_by(System.created_date.desc()).all())


@app.route("/me/systems")
@login_required
def me_systems():
    user = current_user()
    systems = _all_assigned_systems(user)
    rows = []
    for s in systems:
        roles = _user_roles_on_system(s, user)
        rows.append({"system": s, "roles": roles,
                      "is_admin_view": user.role_name == "Admin"})
    return render_template("me_systems.html", rows=rows,
                            is_admin=(user.role_name == "Admin"),
                            total=len(rows))


@app.route("/me/queue")
@login_required
def me_queue():
    """Aggregated to-do across every system + role the user holds."""
    user = current_user()
    systems = _all_assigned_systems(user)
    today = datetime.now(timezone.utc).date()

    cards = []
    totals = {"isso": 0, "issm": 0, "sca": 0, "ao": 0}

    for s in systems:
        roles = _user_roles_on_system(s, user)
        if not roles:
            continue

        poams = POAM.query.filter_by(system_id=s.system_id).all()
        vulns = Vulnerability.query.filter_by(system_id=s.system_id).all()
        arts  = Artifact.query.filter_by(system_id=s.system_id).all()

        # ISSO actions
        isso_items = []
        if "ISSO" in roles or user.role_name == "Admin":
            for p in poams:
                if (p.status not in ("closed", "risk_accepted")
                        and p.scheduled_completion
                        and p.scheduled_completion < today):
                    days = (today - p.scheduled_completion).days
                    isso_items.append({
                        "title": f"POA&M overdue: {(p.weakness or '')[:80]}",
                        "detail": f"{p.severity or 'severity ?'} - "
                                  f"scheduled {p.scheduled_completion} "
                                  f"({days}d ago)",
                        "url": url_for("poam_detail",
                                        system_id=s.system_id,
                                        poam_id=p.poam_id),
                        "kind": "poam_overdue",
                    })
            crit_high_no_poam = [v for v in vulns
                                  if v.severity in ("critical", "high")
                                  and not v.poam_id and v.status == "open"]
            if crit_high_no_poam:
                isso_items.append({
                    "title": f"{len(crit_high_no_poam)} Critical/High vuln(s) "
                              f"without POA&M",
                    "detail": "Auto-create POA&M drafts from the vulnerability "
                              "dashboard or open them manually.",
                    "url": url_for("vulnerabilities", system_id=s.system_id),
                    "kind": "vuln_no_poam",
                })
            # incomplete required step tasks for the current step
            from json import loads as _json_loads
            current_step_tasks = TASK_CATALOG.get(s.current_step or 0, [])
            done_keys = {t.task_key for t in
                         StepTask.query.filter_by(system_id=s.system_id)
                         .filter(StepTask.completed_at.isnot(None)).all()}
            open_gate_tasks = [t for t in current_step_tasks
                                if t.get("gate") and t["key"] not in done_keys]
            if open_gate_tasks:
                isso_items.append({
                    "title": f"Step {s.current_step} has "
                              f"{len(open_gate_tasks)} open gate task(s)",
                    "detail": "; ".join(t["title"] for t in open_gate_tasks[:3])
                               + ("..." if len(open_gate_tasks) > 3 else ""),
                    "url": url_for("rmf_step", system_id=s.system_id,
                                    step=s.current_step or 0),
                    "kind": "step_tasks",
                })

        # ISSM actions
        issm_items = []
        if "ISSM" in roles or user.role_name == "Admin":
            pending_closure = [p for p in poams if p.status == "completed"]
            if pending_closure:
                issm_items.append({
                    "title": f"{len(pending_closure)} POA&M closure(s) "
                              f"awaiting your approval",
                    "detail": "Submitted by ISSO; only ISSM can approve.",
                    "url": url_for("poams", system_id=s.system_id),
                    "kind": "poam_closure",
                })
            arts_review = [a for a in arts if a.approval_status == "in_review"]
            if arts_review:
                issm_items.append({
                    "title": f"{len(arts_review)} artifact(s) in review",
                    "detail": "Approve, reject, or send back to draft.",
                    "url": url_for("system_artifacts", system_id=s.system_id),
                    "kind": "artifact_review",
                })

        # SCA actions
        sca_items = []
        if "SCA" in roles or user.role_name == "Admin":
            sap = (Artifact.query.filter_by(system_id=s.system_id,
                                             artifact_key="sap")
                    .order_by(Artifact.upload_date.desc()).first())
            sar = (Artifact.query.filter_by(system_id=s.system_id,
                                             artifact_key="sar")
                    .order_by(Artifact.upload_date.desc()).first())
            if s.current_step == 4 and not sap:
                sca_items.append({
                    "title": "SAP missing on a system in Step 4 (Assess)",
                    "detail": "Develop the Security Assessment Plan and "
                              "submit it for AO approval.",
                    "url": url_for("system_artifacts", system_id=s.system_id),
                    "kind": "sap_missing",
                })
            if s.current_step == 4 and not sar:
                sca_items.append({
                    "title": "SAR missing on a system in Step 4 (Assess)",
                    "detail": "Generate the Security Assessment Report.",
                    "url": url_for("system_artifacts", system_id=s.system_id),
                    "kind": "sar_missing",
                })
            arts_review = [a for a in arts if a.approval_status == "in_review"]
            if arts_review:
                sca_items.append({
                    "title": f"{len(arts_review)} artifact(s) in review "
                              f"for evidence sufficiency",
                    "detail": "PASS / CONDITIONAL / FAIL the evidence.",
                    "url": url_for("system_artifacts", system_id=s.system_id),
                    "kind": "evidence_review",
                })

        # AO actions
        ao_items = []
        if "AO" in roles or user.role_name == "Admin":
            if s.ato_expiration:
                days_until = (s.ato_expiration - today).days
                if days_until < 0:
                    ao_items.append({
                        "title": f"ATO expired {-days_until}d ago",
                        "detail": "Renewal action recommended.",
                        "url": url_for("dashboard_ao"),
                        "kind": "ato_expired",
                    })
                elif days_until <= 90:
                    ao_items.append({
                        "title": f"ATO expires in {days_until}d",
                        "detail": "Begin renewal coordination.",
                        "url": url_for("dashboard_ao"),
                        "kind": "ato_expiring",
                    })
            cat1_open = [p for p in poams
                         if p.status not in ("closed", "risk_accepted")
                         and p.severity == "CAT I"]
            crit_open = [v for v in vulns
                          if v.severity == "critical" and v.status == "open"]
            if cat1_open or crit_open:
                ao_items.append({
                    "title": f"{len(cat1_open)} CAT I POA&M / "
                              f"{len(crit_open)} Critical vuln(s) open",
                    "detail": "Recommendation: ATO with conditions or denial "
                              "pending remediation.",
                    "url": url_for("dashboard_ao"),
                    "kind": "ao_blockers",
                })

        if isso_items or issm_items or sca_items or ao_items:
            cards.append({
                "system": s,
                "roles": roles,
                "isso_items": isso_items,
                "issm_items": issm_items,
                "sca_items": sca_items,
                "ao_items": ao_items,
            })
            totals["isso"] += len(isso_items)
            totals["issm"] += len(issm_items)
            totals["sca"]  += len(sca_items)
            totals["ao"]   += len(ao_items)

    grand_total = sum(totals.values())
    return render_template("me_queue.html", cards=cards, totals=totals,
                            grand_total=grand_total,
                            assigned_count=len(systems))


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------
def _light_migrate():
    """Bring an existing SQLite database up to the current schema by adding
    any columns the model expects that the live table is missing. SQLite
    supports ALTER TABLE ADD COLUMN, so this is a safe in-place upgrade."""
    from sqlalchemy import inspect, text
    insp = inspect(db.engine)

    def _ensure_cols(table_name, expected):
        if not insp.has_table(table_name):
            return
        existing = {c["name"] for c in insp.get_columns(table_name)}
        with db.engine.begin() as conn:
            for col_name, col_type in expected.items():
                if col_name not in existing:
                    conn.execute(text(
                        f"ALTER TABLE {table_name} ADD COLUMN "
                        f"{col_name} {col_type}"))
                    print(f"  + added {table_name}.{col_name} ({col_type})")

    # Vulnerability columns added in Module 8
    _ensure_cols("vulnerability", {
        "host": "VARCHAR(120)",
        "port": "VARCHAR(20)",
        "cat": "VARCHAR(8)",
        "comments": "TEXT",
        "remediation_date": "DATETIME",
        "poam_id": "VARCHAR",
    })
    # Artifact columns added in Module 5
    _ensure_cols("artifact", {
        "artifact_key": "VARCHAR(60)",
        "version_number": "INTEGER",
        "approver": "VARCHAR(120)",
        "approved_date": "DATETIME",
        "expiration_date": "DATE",
        "supersedes_id": "VARCHAR",
        "generated_from_template": "BOOLEAN",
    })
    # AIInteraction columns added with the audit log viewer
    _ensure_cols("ai_interaction", {
        "reviewer_name": "VARCHAR(120)",
        "review_timestamp": "DATETIME",
        "review_notes": "TEXT",
    })
    # POAM columns added in Module 7
    _ensure_cols("poam", {
        "comments": "TEXT",
        "closure_evidence_id": "VARCHAR",
        "closure_submitted_by": "VARCHAR",
        "closure_submitted_at": "DATETIME",
        "closure_approver": "VARCHAR",
        "closure_approved_at": "DATETIME",
        "date_identified": "DATE",
        "updated_at": "DATETIME",
    })


def seed_control_catalog_if_missing():
    """Idempotent. Populates ControlCatalog from controls_catalog_data."""
    if ControlCatalog.query.count() > 0:
        return
    for c in CATALOG_SEED:
        db.session.add(ControlCatalog(
            nist_id=c["nist_id"],
            title=c["title"],
            family=c["family"],
            family_name=c["family_name"],
            baseline_low=c["baseline_low"],
            baseline_mod=c["baseline_mod"],
            baseline_high=c["baseline_high"],
            control_type_default=c["control_type_default"],
            rmf_step=c.get("rmf_step", 3),
            statement=c["statement"],
            expected_artifacts=json.dumps(c["expected_artifacts"]),
            evidence_examples=json.dumps(c["evidence_examples"]),
            assessment_methods=json.dumps(c["assessment_methods"]),
            responsible_roles=json.dumps(c["responsible_roles"]),
            emass_location=c["emass_location"],
            common_mistakes=json.dumps(c["common_mistakes"]),
            poam_triggers=json.dumps(c["poam_triggers"]),
            conmon_metric=c["conmon_metric"],
        ))
    db.session.commit()


def seed_step_tasks_if_missing():
    """Idempotent: seed demo Step 0/1 tasks even if base seed already ran."""
    demo = System.query.filter_by(acronym="MPS").first()
    if not demo:
        return
    if StepTask.query.filter_by(system_id=demo.system_id).count() > 0:
        return
    for key in ("p_assign_isso", "p_assign_issm", "p_assign_ao",
                "p_stakeholder_matrix", "p_emass_setup",
                "c_info_types", "c_data_types"):
        step = 0 if key.startswith("p_") else 1
        db.session.add(StepTask(system_id=demo.system_id, step=step,
                                task_key=key, completed_at=now(),
                                completed_by="demo-isso"))
    db.session.commit()


def seed():
    if Organization.query.count() > 0:
        seed_step_tasks_if_missing()
        return
    org = Organization(name="Demo Wing / 99 OG", type="DAF Wing",
                       command="ACC", ao_name="Col Demo")
    db.session.add(org)
    db.session.flush()
    for r in DEFAULT_ROLES:
        db.session.add(Role(name=r, org_id=org.org_id))
    isso = User(name="Demo ISSO", email="isso@demo.mil",
                cac_edipi="1000000001", role_name="ISSO", org_id=org.org_id)
    issm = User(name="Demo ISSM", email="issm@demo.mil",
                cac_edipi="1000000002", role_name="ISSM", org_id=org.org_id)
    sca = User(name="Demo SCA", email="sca@demo.mil",
               cac_edipi="1000000003", role_name="SCA", org_id=org.org_id)
    ao = User(name="Col Demo (AO)", email="ao@demo.mil",
              cac_edipi="1000000004", role_name="AO", org_id=org.org_id)
    db.session.add_all([isso, issm, sca, ao])
    db.session.flush()

    demo = System(
        name="Mission Planning System",
        acronym="MPS",
        system_type="Major Application",
        impact_level="Moderate",
        cia_confidentiality="Moderate",
        cia_integrity="Moderate",
        cia_availability="Moderate",
        ato_type="Initial",
        current_step=2,
        boundary_statement=("All MPS application servers, database hosts, and "
                            "user workstations within the demo enclave."),
        mission_desc=("Supports squadron mission planning, route briefing, "
                      "and tasking-order distribution for assigned units."),
        data_types="CUI, FOUO",
        is_nss=False,
        org_id=org.org_id, isso_id=isso.user_id, issm_id=issm.user_id,
        sca_id=sca.user_id, ao_id=ao.user_id,
    )
    db.session.add(demo)
    db.session.flush()

    db.session.add_all([
        InventoryItem(system_id=demo.system_id, item_type="hardware",
                      name="MPS App Server 01", vendor="Dell", version="R750",
                      ip_address="10.10.20.11", os="RHEL", os_version="9.3",
                      owner="Sysadmin Team", location="Demo DC Row 4"),
        InventoryItem(system_id=demo.system_id, item_type="software",
                      name="PostgreSQL", vendor="PGDG", version="15.6",
                      license="PostgreSQL", component_origin="oss"),
        InventoryItem(system_id=demo.system_id, item_type="firmware",
                      name="iDRAC", vendor="Dell", version="6.10.00.00"),
        InventoryItem(system_id=demo.system_id, item_type="sbom",
                      name="openssl", vendor="OpenSSL Project", version="3.0.13",
                      license="Apache-2.0", component_origin="oss"),
    ])
    db.session.add(POAM(
        system_id=demo.system_id, control_nist_id="AC-2",
        weakness="Quarterly account review cadence not documented.",
        source="ISSM internal review", severity="CAT II", risk_level="Moderate",
        status="open",
    ))
    # Pre-complete a few Step 0 and Step 1 tasks to show the wizard mid-flow
    for key in ("p_assign_isso", "p_assign_issm", "p_assign_ao",
                "p_stakeholder_matrix", "p_emass_setup",
                "c_info_types", "c_data_types"):
        step = 0 if key.startswith("p_") else 1
        db.session.add(StepTask(system_id=demo.system_id, step=step,
                                task_key=key, completed_at=now(),
                                completed_by="demo-isso"))
    db.session.commit()


with app.app_context():
    db.create_all()
    _light_migrate()
    seed_control_catalog_if_missing()
    seed()


if __name__ == "__main__":
    # Debug is OFF by default. The Werkzeug debugger allows remote code execution,
    # so only enable it locally by setting FLASK_DEBUG=1.
    debug = os.environ.get("FLASK_DEBUG", "").lower() in ("1", "true", "yes")
    app.run(debug=debug, host="127.0.0.1", port=5000)
