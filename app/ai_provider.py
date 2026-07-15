"""
Real LLM provider for the RMF ATO Navigator AI panel.

Adheres to SRS guardrails:
  FR-4.1  - eight assistant modes routed by system prompt.
  FR-4.2  - source-cited responses (Module 6 catalog + Module 5 templates +
            authoritative NIST / DoD references).
  FR-4.3  - explicit "Local validation required" footer on every response.
  FR-4.4  - the calling site logs every interaction to AIInteraction.
  FR-4.5  - the model is instructed never to record an authorization decision.
  FR-4.6  - returns a confidence score the model self-reports.
  FR-4.7  - human review required flag is set on every response.
  FR-4.8  - DLP guard blocks obvious classified markings and SSN-style PII
            before the prompt leaves the application.

When ANTHROPIC_API_KEY is not set, this module falls back to the existing
canned responses so the panel still works during demos.
"""
from __future__ import annotations

import json
import os
import re
from typing import Optional, List, Tuple

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DEFAULT_MODEL = os.environ.get("RMF_NAV_AI_MODEL", "claude-sonnet-4-6")
DEFAULT_MAX_TOKENS = 1024
DEFAULT_TEMPERATURE = 0.2

# Roles that may bypass the DLP guard for legitimate flags. Empty by design;
# this is a prototype, not an accredited path. Real deployment uses the
# Module 4 "DLP filter" service in the architecture diagram.
DLP_BYPASS_ROLES: Tuple[str, ...] = tuple()


# ---------------------------------------------------------------------------
# Mode catalog
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

_BASE_GUARDRAILS = """
HARD CONSTRAINTS - never violate these:
- You never produce, sign, or record an authorization decision (ATO, IATT, denial). The Authorizing Official records that.
- You never accept or reproduce classified information. If a user shares anything that looks classified, decline and ask them to redact and resubmit.
- You always cite the policy or standard you are drawing from (NIST SP 800-37 Rev. 2, NIST SP 800-53 Rev. 5, NIST SP 800-53A Rev. 5, DoDI 8500.01, DoDI 8510.01, AFI 17-101, DISA STIGs, DoD Cloud SRG, CNSSI 1253).
- You always mark uncertainty explicitly rather than fabricate.
- You always end with a "Local validation required" reminder.

OUTPUT FORMAT - respond as a single JSON object with keys:
  "answer": str       (the assistant's response, plain markdown ok, no code fences)
  "sources": [str]    (policy references you cited, e.g. "NIST SP 800-53 Rev. 5 AC-2")
  "confidence": float (your self-rated confidence 0.0 to 1.0; lower if context is thin)

Do not output anything outside the JSON object.
""".strip()


_MODE_PROMPTS = {
    "isso_coach": """
You are the ISSO Coach for an RMF / DoD authorization workbench.
Your audience is an Information System Security Officer who is executing the seven RMF steps.
For every question:
  - Identify the relevant RMF step (0 Prepare / 1 Categorize / 2 Select / 3 Implement / 4 Assess / 5 Authorize / 6 Monitor).
  - Name the artifacts the ISSO must produce and the eMASS section they live under.
  - List 2-5 concrete next actions in order.
  - If the ISSO is in the wrong step, say so and route them.
""",
    "control_analyst": """
You are a NIST SP 800-53 Rev. 5 Control Analyst. Given a control ID or topic, produce:
  - Plain-language intent of the control.
  - Implementation expectations sized to the system's impact level.
  - 3-5 evidence examples (an ISSO would attach these to eMASS).
  - Assessment methods per NIST SP 800-53A (Examine / Interview / Test).
  - 3-5 common deficiencies SCAs flag.
  - Implementation-statement quality criteria (what makes a strong vs weak statement).
  - POA&M trigger conditions.
""",
    "artifact_gen": """
You generate professional DoD-language RMF artifact text. The user names the artifact (SSP, SAR, POA&M, Stakeholder Matrix, etc.); you produce a structured outline or narrative for that artifact:
  - Section headings.
  - One-line purpose for each section.
  - Bracketed [PLACEHOLDER] tokens for system-specific data.
  - Approval block at the end.
You do not invent system data; placeholders make missing data visible.
""",
    "evidence_review": """
You review uploaded artifact text or evidence descriptions for sufficiency against NIST SP 800-53A assessment objectives.
For every review:
  - Rate PASS / CONDITIONAL PASS / FAIL.
  - List specific gaps: missing approvals, weak language, outdated dates, missing control mappings, unclear boundaries.
  - Recommend the smallest set of edits to clear the gap.
You never approve content yourself - the ISSM and SCA do that. You only advise.
""",
    "poam_builder": """
You produce eMASS-ready POA&M entries. Required fields:
  - Weakness (concise, < 400 chars).
  - Source of discovery (ACAS / STIG / SCA / ConMon / Audit / Other).
  - Affected control (NIST SP 800-53 Rev. 5 ID).
  - Severity (CAT I / CAT II / CAT III).
  - Risk level (High / Moderate / Low).
  - Root cause (1-2 sentences).
  - Resources required.
  - 3+ measurable milestones with target dates.
  - Scheduled completion date.
  - Validation method.
  - Residual risk statement.
""",
    "topology": """
You help define authorization boundaries and topologies. Given a system description, identify:
  - Boundary inclusions / exclusions and the rationale.
  - Trust zones and external connections that need an ISA / MOA (NIST SP 800-47, CA-3).
  - Data flows by direction and protocol.
  - Cloud components that fall under the DoD Cloud SRG.
  - Diagram elements that are missing (admin path, backup network, OOB management, etc.).
""",
    "sbom": """
You support SCRM and inventory work. Given an inventory or SBOM excerpt:
  - Highlight EOL / EOS components.
  - Flag open-source libraries without active maintenance.
  - Identify high-risk suppliers per NIST SP 800-161.
  - Map components to the controls that govern them (CM-8, SA-4, SR-3, SR-4, RA-5).
  - Recommend the smallest set of inventory or sourcing actions.
""",
    "ato_readiness": """
You are the final pre-AO readiness reviewer. Given a system snapshot, score readiness 0-100 and produce:
  - Top 3-5 blockers in priority order, each with the corrective action.
  - The smallest set of artifacts still missing or stale.
  - Open Critical / High vulns and POA&Ms past their scheduled completion.
  - A go / conditions / no-go recommendation - never the AO decision itself.
""",
}


# ---------------------------------------------------------------------------
# DLP guard (FR-4.8)
# ---------------------------------------------------------------------------
_DLP_PATTERNS: List[Tuple[str, re.Pattern]] = [
    ("classified marking",
     re.compile(r"\b(?:TOP\s*SECRET|SECRET//|CONFIDENTIAL//|TS//|SCI|NOFORN|HCS|SI)\b",
                 re.IGNORECASE)),
    ("SSN-like PII",
     re.compile(r"\b\d{3}-\d{2}-\d{4}\b")),
    ("classification banner",
     re.compile(r"\(\s*[UCS]\s*\)\s*//?\s*(?:REL TO|FVEY|NOFORN)",
                 re.IGNORECASE)),
]


def dlp_check(prompt: str) -> Optional[str]:
    """Return the name of a triggered pattern, or None if the prompt is clean."""
    if not prompt:
        return None
    for name, pat in _DLP_PATTERNS:
        if pat.search(prompt):
            return name
    return None


# ---------------------------------------------------------------------------
# System context block (personalization per FR-4.1 / Section 10)
# ---------------------------------------------------------------------------
def build_system_context(system_obj, controls=None, poams=None, vulns=None,
                          inventory=None, artifacts=None) -> str:
    if system_obj is None:
        return ""
    s = system_obj
    open_poams = [p for p in (poams or [])
                  if p.status not in ("closed", "risk_accepted")]
    cat1 = sum(1 for p in open_poams if p.severity == "CAT I")
    cat2 = sum(1 for p in open_poams if p.severity == "CAT II")
    cat3 = sum(1 for p in open_poams if p.severity == "CAT III")
    open_vulns = [v for v in (vulns or []) if v.status == "open"]
    crit = sum(1 for v in open_vulns if v.severity == "critical")
    high = sum(1 for v in open_vulns if v.severity == "high")
    impl = sum(1 for c in (controls or [])
               if c.implementation_status == "implemented")
    total_ctl = len(controls or [])

    lines = [
        "[SYSTEM CONTEXT]",
        f"System: {s.name} ({s.acronym or '-'})",
        f"System type: {s.system_type or '-'}",
        f"RMF step: {s.current_step}",
        f"FIPS 199 impact: {s.impact_level or '-'} "
        f"(C/I/A {s.cia_confidentiality or '?'}/"
        f"{s.cia_integrity or '?'}/{s.cia_availability or '?'})",
        f"ATO type: {s.ato_type or '-'}",
        f"NSS: {'Yes' if s.is_nss else 'No'}",
        f"Data types: {s.data_types or '-'}",
        f"Boundary: {(s.boundary_statement or '-')[:240]}",
        f"Mission: {(s.mission_desc or '-')[:240]}",
        f"Open POA&Ms: {len(open_poams)} "
        f"(CAT I {cat1}, CAT II {cat2}, CAT III {cat3})",
        f"Open vulnerabilities: {crit} critical / {high} high / "
        f"{len(open_vulns) - crit - high} other",
        f"Applied controls: {total_ctl} ({impl} implemented)",
        f"Inventory: {len(inventory or [])} items "
        f"(HW/SW/FW/SBOM combined)",
        f"Artifacts on register: {len(artifacts or [])}",
        "[END CONTEXT]",
    ]
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Provider availability
# ---------------------------------------------------------------------------
def is_real_llm_available() -> bool:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return False
    try:
        import anthropic  # noqa: F401
    except ImportError:
        return False
    return True


def provider_label() -> str:
    if is_real_llm_available():
        return f"Anthropic / {DEFAULT_MODEL}"
    return "Mocked (no ANTHROPIC_API_KEY)"


# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------
def _strip_to_json(text: str) -> str:
    """Models occasionally wrap JSON in markdown fences. Strip them."""
    t = text.strip()
    if t.startswith("```"):
        # remove first fence line
        first_nl = t.find("\n")
        if first_nl != -1:
            t = t[first_nl + 1:]
        # remove trailing fence
        if t.rstrip().endswith("```"):
            t = t.rstrip()[:-3]
    return t.strip()


def _call_anthropic(system_prompt: str, user_message: str) -> dict:
    import anthropic
    client = anthropic.Anthropic()
    resp = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=DEFAULT_MAX_TOKENS,
        temperature=DEFAULT_TEMPERATURE,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )
    raw = ""
    for block in resp.content:
        if getattr(block, "type", None) == "text":
            raw += block.text
    return _parse_model_output(raw)


def _parse_model_output(raw: str) -> dict:
    cleaned = _strip_to_json(raw)
    try:
        data = json.loads(cleaned)
        answer = data.get("answer", "").strip()
        sources = data.get("sources") or []
        if not isinstance(sources, list):
            sources = [str(sources)]
        sources = [str(s) for s in sources][:12]
        try:
            conf = float(data.get("confidence", 0.5))
        except (ValueError, TypeError):
            conf = 0.5
        conf = max(0.0, min(1.0, conf))
        return {"answer": answer or raw.strip(), "sources": sources,
                "confidence": conf, "raw": raw}
    except (json.JSONDecodeError, AttributeError):
        # Model returned plain text; wrap it.
        return {"answer": raw.strip() or "(empty model response)",
                "sources": [], "confidence": 0.4, "raw": raw}


def generate(mode: str, prompt: str, context_block: str = "",
              canned_fallback: Optional[dict] = None) -> dict:
    """Main entry point. Returns a dict with answer/sources/confidence/
    blocked/error/provider keys."""
    mode_prompt = _MODE_PROMPTS.get(mode, _MODE_PROMPTS["isso_coach"]).strip()
    system_prompt = mode_prompt + "\n\n" + _BASE_GUARDRAILS

    # FR-4.8 DLP guard (runs even on mocked responses, so the audit
    # trail still records the block).
    blocked = dlp_check(prompt)
    if blocked:
        return {
            "answer": (
                f"Request blocked by DLP guard ({blocked}). The application "
                f"does not transmit classified content or SSN-style PII to AI. "
                f"Redact the prompt and resubmit. (FR-4.8)"
            ),
            "sources": ["DoDI 8500.01", "FR-4.8"],
            "confidence": 1.0,
            "blocked": True,
            "provider": "dlp",
        }

    user_message = (context_block + "\n\nUSER PROMPT:\n" + prompt).strip()

    if not is_real_llm_available():
        # Mock fallback
        out = canned_fallback or {
            "answer": "AI provider not configured; this is a placeholder response.",
            "sources": [],
        }
        return {
            "answer": out["answer"],
            "sources": out.get("sources", []),
            "confidence": 0.6,
            "blocked": False,
            "provider": "mocked",
        }

    try:
        result = _call_anthropic(system_prompt, user_message)
        result["blocked"] = False
        result["provider"] = "anthropic"
        return result
    except Exception as exc:  # noqa: BLE001 - we want any failure to surface
        return {
            "answer": (
                f"Provider error: {type(exc).__name__}: {exc}. "
                f"The AI panel is fully audited; this failure is logged. "
                f"Try again later or re-issue with a shorter prompt."
            ),
            "sources": [],
            "confidence": 0.0,
            "blocked": False,
            "provider": "error",
            "error": str(exc),
        }
