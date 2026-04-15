# ISSUE-E14-07 — Add Learning and Explainability Cues for Surfaced Musical Controls

## Objective

Help users understand why the system behaved a certain way so exploration feels educational and intentional rather than opaque.

## Background

The product has strong musical intelligence, but some of its value is currently hidden behind internal logic. Small explanation cues can improve user trust, perceived authorship, and learning without turning the experience into a theory textbook.

## Scope

1. Add plain-language explanation patterns for key moments, such as:
   - why a chord fits the current context
   - what a transformation just did
   - what rule or mode is currently active
2. Ensure explanations are concise, optional, and accessible.
3. Use the current-chord and tutorial surfaces where appropriate.

## Files To Investigate

- `client/src/features/current-chord/`
- `client/src/features/tutorial/`
- `client/src/features/chromatic-circle/`
- `client/src/app/App.tsx`
- relevant docs describing scale context, harmony, and tutorial behavior

## Requirements

### Content Design

- Use plain language first.
- Avoid overloading the UI with dense theory text.
- Make explanations persistent enough to read, but dismissible.

### Accessibility

- Explanations must be available as text, not only visually implied.
- Tooltip-like behavior must remain keyboard accessible.
- Educational content should not depend on hover-only discovery.

## Acceptance Criteria

- [ ] At least one explanation pattern ships with the Epic 14 MVP.
- [ ] Users can understand what changed and why without reading code or docs.
- [ ] Explanation content is available to keyboard and screen-reader users.
- [ ] Learnability improves without increasing cognitive overload.
