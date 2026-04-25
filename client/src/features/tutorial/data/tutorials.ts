import type {
  TutorialDefinition,
  TutorialStep,
  TutorialTrigger,
  TutorialAppContext,
  TutorialCondition,
} from '../types';

// ── Shared content version ────────────────────────────────────────────────
// Bump this when you make breaking changes to the tutorial content so that
// any persisted progress is automatically reset for all users.
export const TUTORIAL_CONTENT_VERSION = '1.0.0';

// ── Per-feature tutorial definitions ─────────────────────────────────────

const TUTORIAL_DEFINITIONS: TutorialDefinition[] = [
  {
    version: TUTORIAL_CONTENT_VERSION,
    feature: 'progression-sidebar',
    steps: [
      {
        id: 'add-first-chord',
        feature: 'progression-sidebar',
        title: 'Add your first chord',
        description:
          'Select a note on the chromatic circle, then click "Add to Progression" to build your chord progression.',
        trigger: {
          type: 'composite',
          mode: 'all',
          conditions: [
            { type: 'onState', condition: 'emptyProgression' },
            { type: 'onIdle', idleSeconds: 3 },
          ],
        },
        priority: 10,
        uiType: 'modal',
      },
      {
        id: 'play-progression',
        feature: 'progression-sidebar',
        title: 'Play your progression',
        description:
          'Click the play button in the progression sidebar to hear your chords in sequence. Adjust the tempo with the BPM slider.',
        trigger: { type: 'onAction', action: 'chordAdded' },
        priority: 8,
        uiType: 'tooltip',
        targetSelector: '#chord-progression',
      },
      {
        id: 'progression-full',
        feature: 'progression-sidebar',
        title: 'Progression is full',
        description:
          'You have reached the maximum number of chords. Export your MIDI or delete a chord to add more.',
        trigger: {
          type: 'composite',
          mode: 'all',
          conditions: [
            { type: 'onState', condition: 'fullProgression' },
            { type: 'onIdle', idleSeconds: 3 },
          ],
        },
        priority: 6,
        uiType: 'tooltip',
        targetSelector: '#chord-progression',
      },
    ],
  },
  {
    version: TUTORIAL_CONTENT_VERSION,
    feature: 'chromatic-circle',
    steps: [
      {
        id: 'explore-circle',
        feature: 'chromatic-circle',
        title: 'Explore the chromatic circle',
        description:
          'Click any note on the circle to set your root note. Use the chord type selector below to choose major, minor, dominant 7th, and more.',
        trigger: {
          type: 'composite',
          mode: 'all',
          conditions: [
            { type: 'onState', condition: 'emptyProgression' },
            { type: 'onIdle', idleSeconds: 5 },
          ],
        },
        priority: 5,
        uiType: 'tooltip',
        targetSelector: '#chromatic-circle',
      },
    ],
  },
  {
    version: TUTORIAL_CONTENT_VERSION,
    feature: 'chord-inspection',
    steps: [
      {
        id: 'inspect-chord',
        feature: 'chord-inspection',
        title: 'Inspect a chord',
        description:
          'Switch to "Info" mode (keyboard shortcut I) and click a note on the circle to see its role in the current chord and scale.',
        trigger: { type: 'onAction', action: 'chordClicked' },
        priority: 4,
        uiType: 'tooltip',
        targetSelector: '#chromatic-circle',
      },
    ],
  },
  {
    version: TUTORIAL_CONTENT_VERSION,
    feature: 'midi-export',
    steps: [
      {
        id: 'export-midi',
        feature: 'midi-export',
        title: 'Export your progression as MIDI',
        description:
          'Once you have added a few chords, use the Export MIDI button in the progression sidebar to download a MIDI file.',
        trigger: {
          type: 'composite',
          mode: 'all',
          conditions: [
            { type: 'onState', condition: 'shortProgression' },
            { type: 'onIdle', idleSeconds: 8 },
          ],
        },
        priority: 3,
        uiType: 'tooltip',
        targetSelector: '#chord-progression',
      },
    ],
  },
  {
    version: TUTORIAL_CONTENT_VERSION,
    feature: 'audio',
    steps: [
      {
        id: 'preview-chord-audio',
        feature: 'audio',
        title: 'Hear your chord',
        description:
          'Click the speaker icon or press the play button to preview how your current chord sounds before adding it to the progression.',
        trigger: { type: 'onAction', action: 'chordSelected' },
        priority: 7,
        uiType: 'tooltip',
        targetSelector: '#current-chord',
      },
    ],
  },
];

// ── Flatten all steps for easy lookup ─────────────────────────────────────

export const ALL_TUTORIAL_STEPS: TutorialStep[] = TUTORIAL_DEFINITIONS.flatMap(
  (def) => def.steps,
);

// ── Trigger serialisation helper (used in tests) ──────────────────────────

export function describesTrigger(trigger: TutorialTrigger): string {
  switch (trigger.type) {
    case 'onAction':
      return `action:${trigger.action}`;
    case 'onState':
      return `state:${trigger.condition}`;
    case 'onIdle':
      return `idle:${trigger.idleSeconds}s`;
    case 'composite': {
      const parts = trigger.conditions.map(describesTrigger).join(`,`);
      return `composite(${trigger.mode})[${parts}]`;
    }
  }
}

export { TUTORIAL_DEFINITIONS };

// ── App-context condition predicates ─────────────────────────────────────

export function evaluateCondition(
  condition: TutorialCondition,
  ctx: TutorialAppContext,
): boolean {
  switch (condition) {
    case 'emptyProgression':
      return ctx.progressionLength === 0;
    case 'shortProgression':
      return ctx.progressionLength >= 1 && ctx.progressionLength <= 2;
    case 'fullProgression':
      return ctx.progressionLength >= 8;
    case 'isPlaying':
      return ctx.isPlaying;
  }
}
