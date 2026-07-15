# RMF Commander

Tooling to help ISSOs and ISSMs run the DoD Risk Management Framework (RMF)
authorization process without living in spreadsheets. This repository holds two
related components plus the supporting design and documentation.

## Components

### `app/` — RMF ATO Navigator (Flask backend)
A local web application for NIST SP 800-53 Rev 5 control tracking, POA&M
management, an RMF step wizard, role-aware dashboards (ISSO / ISSM / SCA / AO),
eMASS readiness exports, and an AI documentation assistant with a human-approval
gate. SQLite persistence, server-rendered templates.

Run it:
```bash
cd app
python -m venv .venv && . .venv/Scripts/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# optional: set ANTHROPIC_API_KEY to enable live AI drafting
python app.py            # http://127.0.0.1:5000  (seeds demo data on first run)
```

### `operator-console/` — RMF Commander Operator Console (single-page UI)
A React operator console (portfolio dashboard, per-system detail, AI assistant).
- `RMF-Commander-Operator-Console.html` — self-contained, opens offline, no setup. Use this for demos.
- `rmf-commander-final.html` — original source that loads React/Lucide from CDNs (needs internet).

Currently runs on mock / sandbox data; not yet wired to the Flask backend.

## Layout
```
app/               Flask application (code, templates, static)
operator-console/  Single-page console (self-contained build + source)
design-system/     UI kits, flows, tokens, brand assets, slides, screenshots
docs/              PRD, requirements, onboarding/rubric packages, SSP template packs, 800-53 reference
```

## Status & known work (see project review)
This is prototype-grade. Before any real deployment, address:
- Auth is a simulated role picker — no password/CAC/PIV/MFA.
- `SECRET_KEY` is hardcoded and `debug=True`; move to env, disable debug.
- No CSRF protection; file-upload hardening and tests still needed.
- Section 508 / WCAG gaps in the operator console.
- Connect the operator console to the Flask backend (highest-value next step).

All data shown is mock / sandbox. No production eMASS data is present.
