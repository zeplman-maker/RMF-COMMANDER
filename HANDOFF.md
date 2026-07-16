# RMF Commander — Session Handoff

_Last updated: 2026-07-16. Read this first when resuming in a new session._

## What this project is

Two related but SEPARATE things. Do not confuse them (this caused real confusion before):

1. **RMF Commander — Operator Console.** A single-page React UI (portfolio dashboard,
   per-system detail, AI documentation assistant, ATO countdown, executive briefing
   generator, audit log). Now DUAL-MODE: double-clicked as a file it runs on built-in
   demo data (gray "DEMO DATA" badge in the top bar); served from the Flask app at
   `/console` it runs on live database data (green "LIVE DATA" badge).
2. **RMF ATO Navigator.** A Flask + SQLite backend (35+ routes, role-based dashboards,
   800-53 catalog, POA&M kanban, artifact library, eMASS prep, AI assistant with a
   human-approval gate). This is the functional prototype. It is NOT the operator console.

## Key locations

- **Git repo (source of truth):** `C:\Users\Zeplman\RMF-COMMANDER`
  - GitHub: https://github.com/zeplman-maker/RMF-COMMANDER (private)
  - Layout: `app/` (Flask), `operator-console/`, `design-system/`, `docs/`
- **Leadership demo file (zero setup):**
  `operator-console/RMF-Commander-Operator-Console.html` — self-contained, double-click
  to open, no install/wifi. Libraries (React/ReactDOM) and logo are inlined.
- **Leadership package (built 2026-07-16):**
  `operator-console/RMF-Commander-Demo.zip` — the demo HTML + `START-HERE.html`
  (styled, non-technical instructions page with a 5-minute tour). The zip is
  deliberately untracked; START-HERE.html is committed.
- **Consolidated working set (OneDrive):**
  `C:\Users\Zeplman\OneDrive\Documents\RMF Commander\_CONSOLIDATED_2026-07-15\`
- **Original scattered working folder (OneDrive):**
  `C:\Users\Zeplman\OneDrive\Documents\RMF Commander\` (has `.venv`, database,
  marketing media — not in the repo)

## Current status (all committed + pushed)

Git history on `main` / `origin/main`:
- `5315558` Initial commit (repo created, cleaned, structured)
- `abefc38` Security hardening
- `28f1b11` Hardening + restored 800-53 controls route
- `f9381d7` Add `/api/console/portfolio` and `/console` routes for the operator console
- `d688834` (HEAD) Operator console: dual-mode data loading + START-HERE.html

**Console-to-backend wiring done and verified live (2026-07-16):**
- `GET /api/console/portfolio` (login-gated) returns live JSON in the console's exact
  demo-data shape: `systems` (daysToATO, POA&M counts by severity, scan freshness days,
  CIA cat string), derived `alerts` (ATO 90/60/30 windows, expired ATOs, stale scans
  >7d, unreviewed AI interactions), open `poams`, and `controls` (catalog family names,
  status mapped to compliant/partial/noncompliant). Scoped via `_all_assigned_systems`
  (Admin sees all). Code lives in a marked section of `app/app.py` just before the Seed
  section.
- `GET /console` serves the operator console HTML behind the session login.
- The console HTML boots via `loadLiveData()`: fetch succeeds → live data + LIVE DATA
  badge; fetch fails (file:// or backend down) → demo data + DEMO DATA badge. All
  components read from a `DATA` object (`DATA.systems/alerts/poams/controls`);
  per-system POA&M/control filtering via `poamsForSystem(sys.id)` /
  `controlsForSystem(sys.id)` (filter only in live mode). Null-safe helpers for systems
  without an ATO date (`severityForDays`/`labelForDays`/`pad3` accept null →
  'NO ATO DATE' / '—').
- Leo verified BOTH modes in the browser: /console live with seeded data, and the
  double-clicked file in demo mode.

**Known limitation of live mode:** only the four datasets are live. The AI Assistant,
NL Query, Briefings, Audit Log, and Settings screens still show canned demo content
even when served from Flask. Wiring those (especially the AI assistant to
`/api/ai-chat` and the audit screen to the AIInteraction log) is the natural next step.

**Flask app hardening (previous session, still in place):** SECRET_KEY from env,
debug opt-in, hardened session cookies, upload allowlist + secure_filename, CSRF via
Flask-WTF (meta tag + AJAX header + global submit-injector), and the restored
`controls` / `control_detail` routes (73 controls, 20 families).

## How a leader evaluates it

Hand them `operator-console/RMF-Commander-Demo.zip`. It contains the console HTML and
START-HERE.html (open-first instructions: how to launch, the DEMO DATA badge, a
numbered 5-minute tour, what it demonstrates, and a note that a live-data version
exists). Zero setup, works offline, all data fictitious.

## Next step candidates (none started)

1. **Wire the remaining console screens to the backend** — AI Assistant → `/api/ai-chat`
   (already has a real Anthropic provider + approval gate), Audit Log → AIInteraction
   data, Briefings → live portfolio metrics.
2. Section 508 / WCAG accessibility on the console (fixed 1280px width, no ARIA,
   unlabeled icons).
3. Automated tests (none exist).
4. Split the ~2,800-line `app.py` monolith into blueprints.
5. Optional demo packaging (one-click .bat, PyInstaller .exe, recorded walkthrough) —
   only "if interest demands."

## Environment gotchas for the next session (important)

- **To run the Flask app:** `cd C:\Users\Zeplman\RMF-COMMANDER\app` then
  `pip install -r requirements.txt` then `python app.py` → http://127.0.0.1:5000.
  Use `python -m pip` if `pip` targets the wrong interpreter. The server only runs
  while that terminal is open. Live console: log in first, then /console.
- **Git + OneDrive don't mix.** The repo was moved OUT of OneDrive to
  `C:\Users\Zeplman\RMF-COMMANDER` because OneDrive blocked git's file operations
  (index.lock unlink errors). Keep it out of OneDrive.
- **`C:\Users\Zeplman\Desktop` does not exist** — the Desktop is OneDrive-redirected.
  Don't write outputs there; use the repo or OneDrive paths.
- **git showed every file "modified"** after the move due to permission-bit changes.
  Fixed with `git config core.fileMode false`. If it recurs, that's the fix.
  LF→CRLF warnings on add are harmless.
- **The repo mount is unreliable for the sandbox shell** (`mcp__workspace__bash`):
  it reads root-level files only and CANNOT descend into subfolders (`app/`,
  `operator-console/`). Mounting a subfolder directly also fails to appear in bash.
  Use the host file tools (Read/Write/Edit/Grep/Glob) for all repo work. To run/test
  code in the sandbox, reconstruct or extract the needed pieces into the session
  `outputs/` folder (bash CAN read that) — that's how the 2026-07-16 console edits
  were syntax-checked (node --check + smoke tests on extracted regions).
- **web_fetch truncates at ~61KB** — large JS libraries come back cut off. But
  **npm registry IS reachable** from the sandbox (`npm pack react react-dom lucide
  @babel/standalone` works) even though unpkg/jsdelivr/cdnjs are blocked. That's how
  the offline console was built: pull UMD builds from npm tarballs, inline them,
  verify render with jsdom.
- **Verification history:** the offline console was verified headless in jsdom (React
  mounted, real content, no errors). CSRF verified with curl (tokenless POST → 400,
  valid → 200) + jsdom (injector stamps token). Dual-mode wiring verified by Leo live
  in the browser (both badges).

## Deliberately excluded from the repo

`.venv/`, the SQLite `instance/database.db`, marketing videos (`*.mp4`), the old draft
reel/v1 previews, caches, and `operator-console/RMF-Commander-Demo.zip` (generated
deliverable) — gitignored or left untracked. The stale `source/` docs folder
(duplicate of `source_docs/`) was not carried over.
