# RMF COMMANDER — Web Operator UI Kit

Hi-fi recreation of the **RMF Commander web operator console** — the surface an ISSM/ISSO uses at their desk to monitor portfolio posture, triage POA&Ms, review AI-drafted control language, and generate AO briefings.

This is an interpretive recreation. No live code or Figma was provided; screens are extrapolated from the PRD's functional requirements and the visual language of the AO Proposal Briefing deck.

## Files

| File | What it is |
|---|---|
| `index.html` | Click-thru demo — load this to see the full app |
| `styles.css` | Kit-local styles (extends `colors_and_type.css`) |
| `App.jsx` | Top-level state + screen router (mock data only) |
| `ClassBanner.jsx` | Top + bottom classification banner — never removable |
| `Chrome.jsx` | Sidebar + topbar (brand, nav, AO query, alerts, user) |
| `Dashboard.jsx` | Portfolio grid + alerts feed |
| `SystemCard.jsx` | Status tile (the signature component) |
| `SystemDetail.jsx` | Per-system view — controls, POA&Ms, scan, history |
| `AIAssistant.jsx` | AI Documentation Assistant — drafting + approval gate |
| `Common.jsx` | Pill, Icon helpers, severity squares |

## Screens included

1. **Portfolio dashboard** — `/dashboard` — landing screen; 6 system status cards + alerts feed + executive summary strip.
2. **System detail** — `/systems/AFSVC-LODGING-API-04` — controls posture, POA&M list, scan freshness, ATO history.
3. **AI Documentation Assistant** — `/assistant` — RAG-grounded drafting with the mandatory human-approval gate.
4. **Smart alerts feed** — surfaced inside the dashboard topbar dropdown.

## Out of scope intentionally

- Mobile app (PRD Phase 3 — separate UI kit when needed)
- eMASS write-back UI (Phase 2+, post-pilot)
- Vulnerability triage (Phase 3)
- Executive briefing generator (Phase 3)
- Login / CAC/PIV / MDM enrollment (deferred — assumed authenticated)

These are intentionally left blank or stubbed rather than invented, per UI-kit-fidelity rules.
