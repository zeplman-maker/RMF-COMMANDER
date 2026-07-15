# RMF Commander — UI Kit

Click-through prototype of the **RMF Commander web console** for ISSMs, ISSOs, AO reps and SCAs. Mirrors the proposal's product capabilities:

- Portfolio Dashboard (ATO status, POA&M, control posture, scan freshness)
- Smart Alert feed (90/60/30 ATO, POA&M slips, workflow changes)
- System detail (control posture, POA&M list, AI drafts)
- AI Documentation Assistant (drafts with AI-DRAFTED label + approval gate)
- Natural-Language Query (⌘K palette)
- Executive Briefing Generator (PDF/PPTX preview)

## Files

```
index.html              Entry — wires React + all components, click-through routing
shared.jsx              Icon, Button, Badge, Card, Pill, Banner, KPI primitives
layout.jsx              TopBar, Sidebar, ClassBanner, CommandPalette
dashboard.jsx           DashboardScreen — KPIs, SystemGrid, AlertFeed
system_detail.jsx       SystemDetailScreen — header, posture, POA&M list
ai_assistant.jsx        AiAssistantScreen — draft panel + approval gate
briefing.jsx            BriefingScreen — exec briefing preview
```

## Operating rules

- Dark mode is the default. Light mode is supported but secondary.
- Every screen is wrapped in the **classification banner** (top + bottom).
- AI output is **always** labeled `AI-DRAFTED` until an ISSM/ISSO approves.
- No production data is rendered; all values are mock.
- Click-through routing is local state, not a router — keeps the kit single-file.

## Design fidelity

- Pulled from `colors_and_type.css` design tokens.
- Iconography is Lucide 1.5px stroke, drawn inline (no external dep for offline reliability).
- Spacing on the 8-px grid.
- Numeric data uses the **stat-pair** rhythm (large numeral + tiny mono ALL-CAPS label).
