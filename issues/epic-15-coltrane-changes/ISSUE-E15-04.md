# ISSUE-E15-04 — Add Explanation, Naming, and Accessibility Support for Advanced Bridge Suggestions

## Objective

Ensure Coltrane bridge suggestions are understandable, well-labeled, and accessible to a wide range of users.

## Background

Coltrane changes are musically rich but can feel opaque if presented only as a sequence of surprising chords. The feature should help users understand what it is doing without demanding advanced theory knowledge.

## Scope

1. Add plain-language explanation for the bridge type.
2. Use naming and labels that communicate both function and intent.
3. Ensure the feature remains accessible by keyboard and assistive technology.
4. Avoid relying on audio-only understanding.

## Requirements

### Content

- Explain the technique in plain language where appropriate.
- Keep the educational layer concise and optional.
- Make the bridge feel exciting, not intimidating.

### Accessibility

- Labels must expose name, role, and value where applicable.
- Any tooltip or explanatory affordance must be keyboard reachable.
- Users should be able to understand the suggestion even with audio muted.

## Acceptance Criteria

- [ ] Coltrane bridge suggestions are clearly named and framed in the UI.
- [ ] Users can access a short explanation of the technique.
- [ ] The feature remains accessible to keyboard and assistive-technology users.
- [ ] Understanding the result does not depend solely on audio playback.
