# Client/src Component Architecture Overview

## Executive Summary

This is a **React 19 + TypeScript** web application for editing MIDI chord progressions. The codebase follows a **feature-based modular architecture** with strict separation of concerns. Key characteristics:

- **19 feature modules** organized by domain (chord, audio, scale, etc.)
- **Component-level accessibility**: ARIA labels, roles, live regions, keyboard navigation
- **Interactive SVG visualization**: Chromatic circle with 12 note nodes, animated chord polygons
- **Compose-first workspace**: circle, current chord panel, and progression sidebar are always visible
- **Audio playback**: Web Audio API with chord and arpeggiated modes
- **MIDI export**: Voice-leading optimized notation export

---

## Root Application Structure

### Entry Point: `main.tsx`
```typescript
ThemeProvider
  → EnharmonicProvider
    → TutorialProvider
      → App (root component)
```

### Context Providers
| Provider | Purpose | Config Source |
|----------|---------|---|
| **ThemeProvider** | Light/Dark/Retro theme switching | `app/providers/ThemeProvider.tsx` |
| **EnharmonicProvider** | Sharp/Flat note notation toggle | `app/providers/EnharmonicProvider.tsx` |
| **TutorialProvider** | Onboarding tutorial steps & state | `features/tutorial/TutorialProvider.tsx` |

---

## Main App Layout (`App.tsx`)

### Component Hierarchy
```
<App>
  ├── <AppHeader />               # Theme + visualization toggles
  ├── Settings Toggle Bar
  │   ├── <KeyContextPanel />     # Root + mode selector
  │   └── <AudioDebugPanel />     # Dev-only audio parameter tweaks
  │
  ├── Primary Flow Container     # always-on 3-column compose workflow
  │   ├── <ChromaticCircle />     # SVG chord editor (always visible)
  │   ├── <CurrentChordPanel />   # Chord details & Add button
  │   └── <ProgressionSidebar />  # Chord progression list (always visible)
  │
  ├── Toast Notifications        # undo, errors, import status
  └── [Dev only]
      └── <DevDiagnosticsPanel /> # Alt+D to toggle, shows internal state
```

### App State

**Core state managed in App.tsx:**
```typescript
// Chord & key context
currentChord: Chord | null
keyRoot: number (0–11)                    // C=0, C♯=1, ..., B=11
keyScale: ScaleType                       // major|minor|harmonicMinor|...

// Progression management
chords: Chord[]                           // max 8 chords
sendBackChord: Chord | null               // send chord TO circle from sidebar

// Visualization toggles
showCentroid: boolean
showIntervals: boolean
showLegend: boolean
isSettingsOpen: boolean

// Playback state (delegated to audio feature hooks)
isPlaying: boolean
playingIndex: number | null
loop: boolean
arpeggioEnabled: boolean
arpeggioPattern: ArpeggioPattern

// Audio settings
audioParams: AudioParams                  // gain, attack, release
bpm: number (40–240)
beatsPerChord: number
voiceLeadingConfig: VoiceLeadingConfig
```

### Key Event Handlers
- `handleCurrentChordChange()` — fires `chordSelected` tutorial event
- `handleAddChord()` — adds chord to progression
- `handleSendChordToCircle()` — loads chord FROM sidebar TO circle, fires `chordClicked`
- `setKeyContext()` — **single write path for key state** (E12-02 pattern)
- Keyboard shortcuts: `A` add, `P` play, Arrow keys navigate sidebar

---

## Shared Components & Utilities

### Shared Components

| Component | File | Purpose |
|-----------|------|---------|
| **PillToggle** | `shared/components/PillToggle/` | Accessible toggle switch with label |
| **Toast** | `shared/components/Toast/` | Notification popover with optional action button |

### Key Shared Hooks
- `useTheme()` — access `theme`, `toggleTheme()`
- `useEnharmonic()` — access `useFlats`, `toggleEnharmonic()`, `pitchClasses[]`

### Shared Types
- `Chord` — `{ root: 0–11, quality, customNotes?, primitiveShape? }`
- `ScaleContext` — `{ root: number, mode: ScaleType }`
- Types in `shared/types/`

---

## Feature Modules (19 Total)

Each feature module follows a consistent structure:
```
features/MODULE/
├── components/          # React components
├── hooks/              # Feature-specific custom hooks
├── types/              # TypeScript interfaces
├── utils/              # Pure functions & constants
├── constants/          # Config values
└── index.ts            # Public API exports
```

### Feature Module Reference

#### **chromatic-circle** — Interactive 12-note SVG visualization
**File:** `features/chromatic-circle/`

**Components:**
- `ChromaticCircle` — Main SVG with 12 note nodes, chord polygon, centroid, playback ring
- `NoteNode` — Single note circle with drag/click/keyboard interactions
- `ChordPolygon` — Animated polygon connecting selected chord tones
- `ChordVertex` — Draggable endpoint on polygon
- `CircleDefs` — SVG `<defs>` for gradients, patterns
- `CircleControls` — Transform toolbar (rotate, mirror, mutate, templates) + chord grid selector

**Interactive Elements:**
- **Click note** → select tone for inspection
- **Drag note** → edit chord custom selection
- **`R` key** → re-root chord at selected tone
- **`I`/`S` keys** → toggle cursor modes (inspect/select)
- **Rotate buttons** → rotate chord ±30°
- **Mirror dropdown** → reflect chord around selected axis
- **Mutate button** → randomize custom chord
- **Template buttons** → snap to equilateral triangle, square, pentagon, etc.
- **Chord grid selector** → pick named chord from template

**Accessibility:**
- `role="button"` on note nodes
- `aria-label` with tone role (root, 3rd, 5th, etc.)
- `aria-pressed` state on selected tone
- Keyboard: Enter/Space to select, R to re-root, I/S mode switches
- Escape to deselect tone

**Key Props:**
```typescript
externalChord?: Chord              // Override internal selection for playback
loadChord?: Chord                  // Programmatic load from sidebar
isPlaybackActive: boolean          // Show pulsing playback ring
playingPitchClass?: number | null  // Highlight currently sounding note
showCentroid: boolean              // Display geometric centroid
showIntervals: boolean             // Show interval labels
controlsLayout: 'below' | 'side'   // Responsive layout
```

#### **current-chord** — Chord details panel & Add button
**File:** `features/current-chord/`

**Components:**
- `CurrentChordPanel` — Main display + Add/Play controls
- `ChordThumbnail` — Mini chromatic circle visualization
- `CurrentChordPanel.test.tsx` — Vitest coverage

**Interactive Elements:**
- **Add button** — Append chord to progression
- **Play button** — Audio playback of current chord
- **Stop button** — Stop playback
- **Set as tonic** — Snap key root to chord root (E12-03)
- **Copy button** — Clipboard write of note names (visual feedback)

**Displays:**
- Chord name (e.g., "F♯ Minor 7")
- Pitch classes / note names (C-G-B♭-D)
- Interval analysis (Root, M3, P5, m7)
- Roman numeral relative to key (e.g., "ii in F Major")
- Chord thumbnail (small polygon)
- Diatonic indicator (dot on thumbnail if in key)

**Accessibility:**
- `aria-disabled` on Add button when progression full
- `aria-label` on all buttons
- Play state indicated in button text
- Copy feedback ephemeral badge
- Roman numeral analysis with tooltip

#### **progression-sidebar** — Chord progression list & playback controls
**File:** `features/progression-sidebar/`

**Components:**
- `ProgressionSidebar` — Main sidebar container
- `ChordTile` — Individual chord card (name, controls, staff chart)
- `ChordInfoHeader` — Chord name + note tokens
- `PlaybackControls` — Play chord / Play arpeggio buttons
- `ChordStaffChart` — Piano staff visualization
- `BridgeGapRow` — Gap between two chords with metrics
- `BridgeSuggestionIcon` — Expands to suggestion popover
- `BridgeSuggestionPopover` — Bridge preview & insertion
- `PairMetricBadge` — Voice-leading metric visualization
- `ArpeggioPatternEditor` — Direction/subdivision/swing controls

**Interactive Elements (ChordTile):**
- **Move Up/Down buttons** — Reorder progression
- **Delete button** — Remove chord
- **Send back to circle** — Load into chromatic circle
- **Play chord button** — Inline audio playback
- **Play arpeggio button** — Inline arpeggiated playback
- **Show staff chart toggle** — Reveal/hide MIDI voicing

**Interactive Elements (Sidebar):**
- **Play All button** — Play progression from start
- **Stop button** — Stop playback
- **Loop toggle** — Repeat at end
- **BPM slider** — 40–240 range with visual gradient fill
- **Beats per chord slider** — Duration per chord
- **Arpeggio toggle** — Enable arpeggiated playback
- **Arpeggio pattern editor** → Direction, subdivision, swing %
- **Bridge gaps** → Suggest ii-V, turnarounds, etc.

**Accessibility:**
- `aria-label="Chord playback"` on control groups
- `aria-pressed` for toggle states
- `aria-valuemin/max/now` on sliders
- Focus management: tabbing through tiles, bridge popover focus restore
- Keyboard: Escape closes bridge popover

#### **scale** — Scale/mode context & tonic marker
**File:** `features/scale/`

**Components:**
- `KeyContextPanel` — Root note selector + mode dropdown + randomize
- `ModePersonalityPanel` — Scale characteristic description
- `ScalePlaceholder` — (Deprecated/unused)

**Interactive Elements:**
- **Randomize button (⚄)** — Pick random tonic
- **Root selector** — Dropdown, 12 chromatic pitches, respects sharp/flat setting
- **Mode selector** — Dropdown, 8 modes (Major, Natural Minor, Harmonic Minor, Melodic Minor, Dorian, Phrygian, Lydian, Mixolydian)

**Accessibility:**
- `aria-label` on all dropdowns and randomize button
- Title tooltips on hover
- Focus outline on buttons/selects

**Derived State:**
- Diatonic indices calculated from root + mode
- Roman numeral analysis derived from diatonic indices

#### **audio** — Web Audio API playback
**File:** `features/audio/`

**Components:**
- `AudioDebugPanel` — Dev-only parameter tweaker (gain, attack, release)

**Hooks:**
- `useAudioPlayback()` — Single chord playback with play/stop
- `useProgressionPlayback()` — Multi-chord sequence with loop, arpeggio

**Functions:**
- `playChord(notes, audioParams)` — Immediate chord playback
- `playArpeggio(notes, pattern, tempo)` → Returns `{ cancel() }`
- `stopChord()` — Immediate stop

**Interactive Elements:**
- Play/Stop buttons in tiles and panels
- Arpeggio toggle in sidebar
- Arpeggio pattern editor (direction, subdivision, swing)

#### **midi-export** — MIDI file generation & export
**File:** `features/midi-export/`

**Components:**
- `MidiExportControls` — BPM, beats/chord, export buttons
- `NoteValueSelector` — Note duration picker (dropdown or buttons)
- Links to `VoiceLeadingPanel` for voicing options

**Interactive Elements:**
- **MIDI Export button** — Triggers `useMidiExport()` hook, downloads .mid
- **JSON Export dropdown** → Export session snapshot
- **BPM slider** — 40–240 range
- **Beats per chord slider**
- **Voice-leading panel** — Collapsible, see below

**MIDI Generation Pipeline:**
1. Voice-leading solver picks optimal MIDI octaves
2. Arpeggiation (if enabled) spreads voices over beats
3. Quantized to note duration
4. Exported via Web Audio MIDI library

#### **voice-leading** — Polyphonic voicing optimization
**File:** `features/voice-leading/`

**Components:**
- `VoiceLeadingPanel` — Collapsible control panel

**Interactive Elements:**
- **Style selector** — Dropdown (Smooth Stepwise, Tightly Stacked, Wide & Spacious, Flexible)
- **Tie-break radio group** — ↑ ↓ — (up/neutral/down preference)
- **Extension register policy selector** — Strict (keep 9/11/13 high) vs. Relaxed (allow fold)
- **Start octave spinner** — 2–6 range
- **Preset buttons** → Classic SATB, Keyboard-Friendly, Bass-Led

**Types:**
- `VoiceLeadingStyle` = 'minimal' | 'close' | 'open' | 'flexible'
- `MotionBias` = 'up' | 'neutral' | 'down'
- `ExtensionRegisterPolicy` = 'strict' | 'relaxed'

#### **chord** — Chord data model & utilities
**File:** `features/chord/`

**Key Exports:**
- `ChordType` = 'major' | 'minor' | 'dim' | 'aug' | 'sus2' | 'maj7' | 'maj6' | ... | 'quartal'
- `CHORD_INTERVALS[quality]` — Semitone array from root
- `getChordName(root, quality, pitchClasses?)` → "F♯ Minor 7"
- `transposeChord(intervals, root)` → MIDI note indices
- `rerootChord(chord, newRoot)` → Restructured chord

**Component:**
- `ChordGrid` — 12-note picker button matrix for custom chord selection

**Accessibility:**
- `ChordGrid` tiles: `role="button"`, `aria-pressed` when selected

#### **chord-animation** — Smooth polygon morphing
**File:** `features/chord-animation/`

**Hook:**
- `useChordMorphing(fromPitchClasses, toPitchClasses)` → Animated coordinate interpolation over 350ms easeInOutQuad

**Respects:**
- `prefers-reduced-motion` media query (instant snapshots instead)

#### **chord-geometry** — Polygon vertex calculation
**File:** `features/chord-geometry/`

**Key Function:**
- `calculatePolygonPoints(pitchClasses)` → { x, y } array on 12-node ring
- `orderPolygonNoteIndices(pitchClasses)` → Sorted indices for proper polygon winding

#### **chord-inspection** — Tone info panel
**File:** `features/chord-inspection/`

**Components:**
- `ToneInfoPanel` — Display frequency, role (Root, 3rd, 5th, ...), enharmonic equivalent

**Interactive Elements:**
- **Frequency copy button** → Tooltip "Copied!"
- **Close button (✕)** → Dismiss panel

**Accessibility:**
- `role="status"`, `aria-live="polite"` for copy feedback

#### **color-language** — Quality-based color system
**File:** `features/color-language/`

**Key Functions:**
- `getChordColor(quality, complexity)` → HSL color string
- `getChordComplexity(chord)` → 0–1 saturation factor
- `getAccessibleTextColor(background)` → WCAG contrast-compliant text color

**Colors:**
- Major: Blue tones
- Minor: Green/teal tones
- Diminished: Purple
- Augmented: Red/orange
- Dominant 7: Yellow-orange
- Extensions: Higher saturation

#### **chord-intervals** — Interval naming
**File:** `features/chord-intervals/`

**Key Function:**
- `getIntervalName(semitones)` → "Root", "Minor 3rd", "Perfect 5th", "Major 7th", etc.

#### **chord-morphing** — Polygon animation hooks
**File:** `features/chord-morphing/`

Similar to `chord-animation`; separate module for organizational clarity.

#### **chromatic-circle colors** — Note appearance system
**File:** `features/chromatic-circle/utils/circleColors.ts`

**State Variables:**
- Chord-tone opacity: `DIATONIC_OPACITY` (0.85) vs `CHROMATIC_OPACITY` (0.4)
- Root-note marker color: gold
- Drop-target highlight: semi-transparent accent

#### **legend** — Visual language guide
**File:** `features/legend/`

**Component:**
- `VisualLegend` — Aside panel explaining polygon shapes, opacity, colors

**Sections:**
1. Quality Spectrum → Colored bands with micro polygon glyphs
2. Opacity Gradient → Diatonic (bright) vs chromatic (faded)
3. Polygon → Triangle (triad) vs quad (seventh)
4. Node Fill → Chord tone vs non-chord tone

#### **tutorial** — Onboarding & help system
**File:** `features/tutorial/`

**Components:**
- `TutorialProvider` — Context manager
- `TutorialModal` — Full-screen overlay for step display
- `TutorialTooltip` — Inline callout with positioning

**Interactive Elements:**
- **Next button** — Advance to next step
- **Skip button** → Skip current step
- **Disable hints button** → Opt out of future hints
- **Snooze button** → 30-minute pause
- **Keyboard: Escape** → Dismiss modal
- **Focus trap** → Tab stays within modal

**Accessibility:**
- `role="dialog"`, `aria-modal="true"` on modal
- Focus restoration after close
- Keyboard focus trap (Shift+Tab at start → end)
- Input method tracking (keyboard vs pointer)

#### **harmonic-graph** — (No UI currently)
**File:** `features/harmonic-graph/`

Utilities module; no interactive components.

#### **ii-v-suggestions** — Bridge suggestion engine
**File:** `features/ii-v-suggestions/`

Utilities module; integrated into `BridgeSuggestionPopover`.

#### **intent-capture** — User interaction analytics
**File:** `features/intent-capture/`

(Likely for future analytics; minimal current usage)

#### **negative-harmony** — Mirror chord feature
**File:** `features/negative-harmony/`

Utilities module; integrated into `CircleControls` mirror action.

---

## Interactive Controls Inventory

### Buttons & Button-like Elements
| Control | Type | Location | Action |
|---------|------|----------|--------|
| **Centroid toggle** | Switch | AppHeader | Show/hide chord centroid |
| **Intervals toggle** | Switch | AppHeader | Show/hide interval labels |
| **Legend toggle** | Switch | AppHeader | Show/hide visual legend |
| **Load JSON** | Button | AppHeader | File picker for snapshot import |
| **Theme toggle** | Button | AppHeader | Cycle light → dark → retro |
| **Enharmonic toggle** | Button | AppHeader | Switch sharp ↔ flat |
| **Settings toggle (⚙)** | Button | Key Context Bar | Show/hide KeyContextPanel |
| **Randomize key root (⚄)** | Button | KeyContextPanel | Random tonic |
| **Rotate CW/CCW** | Button x2 | CircleControls | Rotate chord ±30° |
| **Mirror** | Button | CircleControls | Expand axis picker |
| **Mutate (☣)** | Button | CircleControls | Randomize custom chord |
| **Template shapes** | Button group | CircleControls | Snap to primitive |
| **Play current chord** | Button | CurrentChordPanel | Audio playback |
| **Set as tonic** | Button | CurrentChordPanel | Snap key root |
| **Copy notes** | Button | CurrentChordPanel | Clipboard write |
| **Add chord** | Button | CurrentChordPanel | Append to progression |
| **Move chord up/down** | Button x2 | ChordTile | Reorder |
| **Delete chord** | Button | ChordTile | Remove from progression |
| **Send back to circle** | Button | ChordTile | Load into chromatic circle |
| **Play tile chord** | Button | ChordTile | Inline playback |
| **Play tile arpeggio** | Button | ChordTile | Inline arpeggio |
| **Play all chords** | Button | ProgressionSidebar | Start sequence |
| **Stop playback** | Button | ProgressionSidebar | Halt sequence |
| **Loop toggle** | Switch | ProgressionSidebar | Repeat mode |
| **Arpeggio toggle** | Switch | ProgressionSidebar | Enable arpeggiation |
| **MIDI export** | Button | MidiExportControls | Download .mid |
| **JSON export** | Button (dropdown) | MidiExportControls | Download .json |

### Sliders & Range Inputs
| Control | Range | Location | Purpose |
|---------|-------|----------|---------|
| **BPM** | 40–240 | MidiExportControls | Tempo in beats/min |
| **Beats per chord** | 1–? | MidiExportControls | Quarter notes per chord |
| **Arpeggio swing** | 0–100% | ArpeggioPatternEditor | Rhythmic swing on arpeggios |
| **Start octave** | 2–6 | VoiceLeadingPanel | MIDI octave range |

### Dropdowns & Selects
| Control | Options | Location | Purpose |
|---------|---------|----------|---------|
| **Key root** | C, C♯, D, ... B (12) | KeyContextPanel | Tonic pitch class |
| **Key mode** | Major, Natural Minor, Harmonic Minor, Melodic Minor, Dorian, Phrygian, Lydian, Mixolydian (8) | KeyContextPanel | Scale type |
| **Voice-leading style** | Smooth Stepwise, Tightly Stacked, Wide & Spacious, Flexible | VoiceLeadingPanel | Voicing algorithm |
| **Extension register policy** | Strict, Relaxed | VoiceLeadingPanel | Extension folding |
| **Arpeggio subdivision** | Quarter, Eighth, Sixteenth, Triplet | ArpeggioPatternEditor | Note spacing |
| **Chord grid selector** | All named chords (maj, min, dom7, etc.) | CircleControls | Named chord picker |

### Radio Groups
| Control | Options | Location | Purpose |
|---------|---------|----------|---------|
| **Arpeggio direction** | Up, Down, Up-Down, Random (4) | ArpeggioPatternEditor | Note order |
| **Motion bias (tie-break)** | ↑, —, ↓ | VoiceLeadingPanel | Note preference on tie |

### Interactive SVG Elements
| Element | Interaction | Location | Result |
|---------|-------------|----------|--------|
| **Note node (circle)** | Click | ChromaticCircle | Select tone, show ToneInfoPanel |
| **Note node** | Drag | ChromaticCircle | Edit custom chord selection |
| **Chord polygon** | None (visual only) | ChromaticCircle | Animated connection of chord tones |
| **Chord vertex** | Drag | ChromaticCircle | Move individual tone (if custom) |

### Keyboard Shortcuts
| Key | Context | Action |
|-----|---------|--------|
| `A` | Global (not in form) | Add current chord |
| `P` | Global (not in form) | Play current chord |
| `← →` | ProgressionSidebar | Navigate between tiles |
| `I` | ChromaticCircle focused | Switch to Inspect cursor mode |
| `S` | ChromaticCircle focused | Switch to Select cursor mode |
| `R` | ChromaticCircle with tone selected | Re-root chord at selected tone |
| `Escape` | ChromaticCircle | Deselect tone |
| `Escape` | TutorialModal | Dismiss modal |
| `Escape` | BridgeSuggestionPopover | Close popover, stop preview |
| `Tab` | TutorialModal | Focus trap (wraps to start/end) |
| `Alt+D` | Dev mode | Toggle DevDiagnosticsPanel |

---

## Accessibility Patterns & ARIA Implementation

### ARIA Landmarks
```html
<nav aria-label="Skip navigation">
  <a href="#chromatic-circle">Skip to circle</a>
  <a href="#current-chord">Skip to chord panel</a>
  <a href="#chord-progression">Skip to progression</a>
</nav>

<section id="chromatic-circle" role="region" aria-label="Chromatic Circle - ...">
<section id="current-chord" role="region" aria-label="Current Chord - ...">
<section id="chord-progression" role="region" aria-label="Chord Progression - ...">
```

### ARIA Live Regions
```html
<!-- Playback announcements -->
<div aria-live="polite" aria-atomic="true" class="visually-hidden">
  {playbackLiveText}  <!-- e.g., "F♯ Minor 7" on each playback step -->
</div>

<!-- Event-driven announcements -->
<div aria-live="polite" aria-atomic="true" class="visually-hidden">
  {sendBackMessage}  <!-- e.g., "C Major loaded into chromatic circle" -->
</div>

<!-- Toast notifications -->
<div role="status" aria-live="polite">
  {message}
</div>
```

### Interactive Element ARIA
```html
<!-- PillToggle switch -->
<input type="checkbox" role="switch" aria-label="Center" />

<!-- Note node button -->
<g role="button" tabIndex={0} aria-label="C♯, chord tone" aria-pressed={isSelected}>
  <!-- SVG circle + text -->
</g>

<!-- Segmented controls -->
<button aria-pressed={isActive}>Inspect</button>
<button aria-pressed={!isActive}>Compose</button>

<!-- Disabled add button -->
<button disabled aria-disabled={true} aria-label="Add chord">Add</button>

<!-- Playback state -->
<button aria-label={isPlaying ? "Stop chord" : "Play chord"}>
  {isPlaying ? "■ Stop" : "▶ Play"}
</button>

<!-- Voice-leading style selector -->
<select aria-label="Voice-leading style">
  <option>Smooth Stepwise</option>
  ...
</select>

<!-- Range slider -->
<input type="range" min={40} max={240} aria-valuemin={40} aria-valuemax={240} aria-valuenow={bpm} />

<!-- Radio group (arpeggio direction) -->
<fieldset role="radiogroup">
  <label>
    <input type="radio" name="arpeggio-direction" value="up" />
    <span>Up</span>
  </label>
  ...
</fieldset>
```

### Focus Management
- **Key context bar:** Focus on settings toggle, keyboard navigation to dropdowns
- **Bridge popover:** Focus management with `triggerRef` to restore focus after close
- **Tutorial modal:** Focus trap with Tab/Shift+Tab cycling, Escape dismissal
- **ChordTile:** Each tile focusable via tabbing, keyboard support for play/delete

### Color Contrast & Accessibility
- Text colors computed via `getAccessibleTextColor()` to ensure WCAG AA contrast
- Keyboard navigation everywhere interactive
- Reduced motion: `useEffect` checks `prefers-reduced-motion` media query, skips animations

### Semantic HTML
- **Forms:** `<input type="range">`, `<select>`, `<textarea>` labeled with `<label htmlFor>`
- **Buttons:** `<button type="button">` (never submit)
- **Fieldsets:** Radio groups wrapped in `<fieldset role="radiogroup">`
- **Hidden/Skip:** `.visually-hidden` class preserves screen reader access

### Testing Coverage
- `chord-inspection/__tests__/tutorialA11y.test.tsx` — Keyboard, focus, ARIA label tests
- Vitest coverage for keyboard shortcuts, focus traps, input method detection

---

## Data Flow Architecture

### State & Props Patterns

**Lifted State (App.tsx):**
- All app-level state lives in `App` (currentChord, keyRoot, chords, etc.)
- Props flow down to child components
- Callbacks flow up for state changes

**Hook-based Local State:**
- Individual components use hooks for UI-only state (isExpanded, copied, tilePlayMode, etc.)
- `useChordState()` in ChromaticCircle manages chord selection & transforms
- `useProgression()` in ProgressionSidebar manages progression CRUD
- `useProgressionPlayback()` manages playback sequence

**Derived State:**
```typescript
// Memoized derived data
const diatonicIndices = useMemo(() => getDiatonicIndices(keyRoot, keyScale), [keyRoot, keyScale])
const noteIndices = useMemo(() => getChordPitchClasses(chord), [chord])
const romanAnalysis = getRomanNumeral(root, keyRoot, keyScale, quality)
```

### One-Way Data Flow
1. **User action** → Button click, keystroke, drag
2. **Component handler** → `handleClick()`, `handleKeyDown()`, etc.
3. **Callback passed from parent** → `onAddChord()`, `onChordChange()`, etc.
4. **State update in parent** → `setCurrentChord()`, `setChords()`, etc.
5. **Props re-render** → Child components re-render with new props

### Example: Add Chord Flow
```
User clicks "Add" in CurrentChordPanel
  ↓
CurrentChordPanel.handleClick() fires
  ↓
Callback onAddChord() (passed from App.tsx)
  ↓
App.tsx handleAddChord() fires
  ↓
addChord(currentChord) — calls useProgression hook
  ↓
useProgression updates chords[] in localStorage
  ↓
chords prop updates ProgressionSidebar
  ↓
New ChordTile rendered at end of list
```

---

## Module Interaction Diagram

```
App.tsx (root state)
 ├─ ChromaticCircle (useChordState hook)
 │   ├─ NoteNode x12 (SVG interactive)
 │   ├─ ChordPolygon (animated)
 │   ├─ CircleControls
 │   │   ├─ ChordGrid (chord selector)
 │   │   └─ Transform buttons (rotate, mirror, mutate, templates)
 │   └─ ToneInfoPanel (inspection)
 │
 ├─ CurrentChordPanel
 │   ├─ ChordThumbnail
 │   ├─ Add button
 │   ├─ Play button (useAudioPlayback hook)
 │   ├─ Set as tonic button
 │   └─ Interval inspection
 │
 ├─ ProgressionSidebar (useProgression hook)
 │   ├─ ChordTile x8 (max)
 │   │   ├─ PlaybackControls
 │   │   ├─ ChordStaffChart (voicing)
 │   │   ├─ Move up/down
 │   │   └─ Delete
 │   ├─ BridgeGapRow x7 (between tiles)
 │   │   ├─ BridgeSuggestionIcon
 │   │   └─ BridgeSuggestionPopover (if open)
 │   ├─ Play All / Stop buttons (useProgressionPlayback hook)
 │   ├─ Loop toggle
 │   ├─ Arpeggio toggle + ArpeggioPatternEditor
 │   └─ MidiExportControls
 │       ├─ BPM slider
 │       ├─ Beats per chord slider
 │       ├─ MIDI Export button
 │       ├─ JSON Export dropdown
 │       └─ VoiceLeadingPanel
 │
 ├─ KeyContextPanel (Settings bar)
 │   ├─ Root selector
 │   ├─ Mode selector
 │   ├─ Randomize button
 │   └─ ModePersonalityPanel
 │
 └─ AppHeader
     ├─ Centroid/Intervals/Legend toggles
     ├─ Theme toggle
     ├─ Enharmonic toggle
   └─ Load JSON session
```

---

## Feature Flags & Conditional Rendering

### Dev-Only Components
```typescript
{import.meta.env.DEV && <DevDiagnosticsPanel />}
{import.meta.env.DEV && <AudioDebugPanel />}
```

### Primary Flow Composition
```typescript
<ChromaticCircle />
<CurrentChordPanel />
<ProgressionSidebar />
```

### Settings Panel Conditional
```typescript
{isSettingsOpen && (
  <div>
    <KeyContextPanel />
    <AudioDebugPanel />
  </div>
)}
```

---

## Responsive Design Approach

### Breakpoints (CSS/Container Queries)
- **Container queries** preferred for component-level responsive work
- **Media queries** used for:
  - Page-shell layout (min-width breakpoints)
  - Environment preferences (`prefers-reduced-motion`, `prefers-color-scheme`)
  - Hover/pointer capability detection

### Layout
- **Compose workflow:** Circle + center + sidebar (3-column or stacked)
- `controlsLayout` prop on ChromaticCircle: `'below' | 'side'` (auto-reverts to below on ≤900px)

---

## Testing Strategy

### Unit Tests (`__tests__/` directories)
- `CurrentChordPanel.test.tsx` — Component rendering, prop changes
- `tutorialA11y.test.tsx` — Keyboard navigation, focus management, ARIA labels

### Test Tools
- **Vitest** — Jest-compatible test runner
- **React Testing Library** — Component DOM testing, `render()`, `fireEvent`, queries

### Test Coverage Areas
- Chord name formatting & Roman numeral generation
- Keyboard shortcut handling
- Focus trap in modals
- Input method detection (keyboard vs pointer)
- Button click handlers
- ARIA attributes presence

---

## Performance Considerations

### Memoization & Re-render Prevention
```typescript
// useCallback for stable function identities
const handleAddChord = useCallback(() => { ... }, [currentChord, addChord, fireEvent])

// useMemo for expensive computations
const diatonicIndices = useMemo(() => getDiatonicIndices(keyRoot, keyScale), [keyRoot, keyScale])

// React.memo for components
const ChordTile = memo(function ChordTile({ ... }) { ... })
const CircleControls = memo(function CircleControls({ ... }) { ... })
```

### Ref Optimization
```typescript
// Ref holds mutable state to avoid stale closures
const noteHandlerStateRef = useRef({ ... })
useLayoutEffect(() => {
  noteHandlerStateRef.current = { ...newState }
}, [dependencies])
```

### Animation Performance
- SVG polygon morphing via `useChordMorphing()` with 350ms duration
- Respects `prefers-reduced-motion` for accessibility

---

## API Integration Points

### Auto-generated Client (`api/generated/index.ts`)
```typescript
import { client } from '@/api/client'

// Scale endpoint
const scale = await client.post('/Scale/from-root', {
  query: { note: 'C' },
  body: { scaleType: 'major' }
})

// Other endpoints used by features
```

**Regenerate with:** `npm run generate:api` (fetches OpenAPI spec from `http://localhost:5110`)

### Never Edit Generated Files
- `client/src/api/generated/index.ts` is auto-generated
- Manual edits will be overwritten

---

## Summary of Key Interactions

### User Journey: Add a Chord

1. Open app → Random diatonic chord loaded
2. Click note on circle → ToneInfoPanel shows frequency & role
3. Drag notes to customize chord (optional)
4. Click "Add" → Chord appended to progression
5. Progression sidebar remains visible for immediate refinement
6. Click chord in sidebar to see details
7. Click "Play" on tile for audio preview
8. Hover bridge gap → Suggestion popover appears
9. Click suggestion → Bridge preview plays
10. Click "Apply" → Bridge inserted, undo toast appears
11. Adjust BPM, beats/chord, voice-leading settings
12. Click "MIDI Export" → Download .mid file
13. Click JSON Export → Download .json snapshot

### User Journey: Explore Key Context

1. Open Settings (⚙)
2. KeyContextPanel appears → C Major active
3. Select different key root → Diatonic dot indicator updates on circle
4. Select different mode → Diatonic set changes
5. Click "Set as tonic" on a chord → Key root updates to chord's root
6. Roman numeral in chord panel updates to reflect new key

---

## Code Organization Best Practices

1. **Feature-first architecture** → Each domain is a feature module
2. **Single responsibility** → Each component does one thing
3. **Composition over inheritance** → Hooks and functional components
4. **Props drilling minimized** → Context providers for global state
5. **Accessible by default** → ARIA, keyboard support baked in
6. **Type-safe** → TypeScript strict mode enforced
7. **Testable** → Hooks extractable, components pure where possible
8. **Performance conscious** → Memoization, refs for optimization

---

## Related Documentation

- See `docs/` folder for:
  - `architecture/frontend-features.md` — Detailed feature specs
  - `feature-module-convention.md` — Module structure standard
  - `design-system-audit.md` — Visual language & colors
  - `accessibility-audit.md` — Full a11y assessment

- See `client/README.md` for:
  - Build instructions
  - Dev server setup
  - TypeScript/ESLint configuration
  - VITE hot module reloading

---

**Last updated:** June 2026  
**Component count:** ~50+ React components  
**Feature modules:** 19  
**Accessibility conformance:** WCAG 2.1 AA (in progress)
