# Epic 13 — UX Polish: Layout, Hierarchy & Interaction Refinements

## Theme
Address design-expert feedback across the full UI surface. The app already has a strong visual identity and consistent colour system; this epic tightens the *information hierarchy, interaction affordances, and layout balance* so it reads less like "stacked components" and more like a single cohesive tool.

## Motivation
After applying CurrentChordPanel zone-grouping improvements (completed during Epic 13 planning), the most impactful outstanding issues are:

- The chromatic circle has no hover affordance — users can't tell notes are clickable
- Non-diatonic notes are dimmed but not to an aggressive-enough degree; active chord tones lack a corresponding boost
- The AppHeader control bar is an undifferentiated flat list; view controls and system controls compete visually
- Checkboxes in the header feel stylistically mismatched with the rest of the modern UI
- The progression sidebar empty state is informational rather than directive
- The Play All / Loop / Arp / Timing controls inside the sidebar have equal visual weight; Play All needs to read as the primary action

## Already Completed (do not re-implement)
- CurrentChordPanel zone grouping, note chips, button hierarchy, spacing — done before this epic
- Dev Diagnostics panel is already collapsible (Alt+D) — no change needed

## Out of Scope for This Epic
- Drag-and-drop chord into progression (requires dedicated spike)
- Auto-preview on hover (requires dedicated spike on AudioContext latency)
- Role-based colour-system overhaul (cross-cutting architectural change — own epic)
- Double-click quick-add (conflicts with existing click model; needs UX decision)

---

## Issues

| ID | Title | Effort | Depends On |
|---|---|---|---|
| [E13-01](./ISSUE-E13-01.md) | Chromatic circle hover states and pointer cursor | S (2–3 h) | — |
| [E13-02](./ISSUE-E13-02.md) | Increase contrast: dim non-diatonic notes more aggressively | S (1–2 h) | — |
| [E13-03](./ISSUE-E13-03.md) | AppHeader: two-zone layout (view vs system controls) | S (2–3 h) | — |
| [E13-04](./ISSUE-E13-04.md) | Replace AppHeader checkboxes with pill toggles | S (2–4 h) | E13-03 |
| [E13-05](./ISSUE-E13-05.md) | Progression sidebar: actionable empty state | XS (1 h) | — |
| [E13-06](./ISSUE-E13-06.md) | Progression sidebar: playback control hierarchy | S (2–3 h) | — |
| [E13-07](./ISSUE-E13-07.md) | Progression sidebar: Timing section spacing and grouping | XS (1–2 h) | — |

## Execution Order

```
E13-01 ──────────────────────────────► (independent)
E13-02 ──────────────────────────────► (independent)
E13-03 ──► E13-04
E13-05 ──────────────────────────────► (independent)
E13-06 ──────────────────────────────► (independent)
E13-07 ──────────────────────────────► (independent)
```

All issues are independent except E13-04 which should follow E13-03.
