# ISSUE-E9-11 — Add Page-Level `<h1>` Heading (WCAG 2.4.6 AA)

## Objective

Add a visible or visually-hidden `<h1>` element to establish proper heading hierarchy and allow screen reader users to quickly identify the page's primary purpose.

## Background

The June 2026 accessibility audit identified that the application lacks a top-level `<h1>` heading. The heading hierarchy currently begins at `<h2>` (the "Progression" sidebar heading), breaking WCAG 2.4.6 (AA) and disrupting the document outline for assistive technology users.

## Success Criteria

- [ ] An `<h1>` element exists in the DOM
- [ ] The heading text identifies the application's purpose (e.g., "Apeirograph — Build and Export MIDI Chord Progressions" or similar)
- [ ] If visually hidden, the heading is placed early in the `<body>` order (e.g., first child of `<main>` or inside `<header>`)
- [ ] Screen reader testing confirms the heading is exposed and announces correctly
- [ ] Heading hierarchy is now: `<h1>` → `<h2>` (Progression) → `<h3>` (Tone Info)

## Options

### Option A: Visible Heading in AppHeader
```jsx
// Inside AppHeader or App component:
<h1 className={styles.pageTitle}>
  Apeirograph
</h1>
```
Style with CSS to match the existing brand styling. Consider font size, color, and placement.

### Option B: Visually Hidden Heading
```jsx
// In App.tsx, first element inside <main>:
<h1 style={{ 
  position: 'absolute', 
  width: '1px', 
  height: '1px', 
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  border: 0
}}>
  Apeirograph — Build and Export MIDI Chord Progressions
</h1>
```
This approach preserves the current visual layout while fixing the heading structure.

## Implementation Notes

- Prefer Option A (visible) if it aligns with design goals
- If choosing Option B, consider adding a `.sr-only` utility class to `shared/` for consistent screen-reader-only styling
- Verify with screen reader (NVDA, VoiceOver) after implementation

## WCAG Criteria

- 2.4.6 Headings and Labels (AA)
- 1.3.1 Info and Relationships (A)

## Estimated Effort

- Low (< 1 hour)

## Files to Modify

- `client/src/app/App.tsx` (or `AppHeader.tsx`)
- Optionally: `client/src/styles/index.css` or component-level CSS module
