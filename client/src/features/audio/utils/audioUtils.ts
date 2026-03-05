import type { ChordNoteInfo } from "@/features/chord/types";

export interface PlayOptions {
  duration?: number;
  octave?: number;
}

let activeOscillators: OscillatorNode[] = [];
let audioCtx: AudioContext | null = null;

export function initAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function noteIndexToFrequency(noteIndex: number, octave: number): number {
  // noteIndex is 0-11 (chromatic), root MIDI note is 60 (middle C, octave 4)
  const rootMidi = 12 * (octave + 1); // octave 4 → MIDI 60
  const midiNote = rootMidi + noteIndex;
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export function stopChord(): void {
  for (const osc of activeOscillators) {
    try {
      osc.stop();
    } catch {
      // already stopped
    }
  }
  activeOscillators = [];
}

export async function playChord(
  notes: ChordNoteInfo[],
  options: PlayOptions = {},
): Promise<void> {
  const { duration = 1200, octave = 4 } = options;

  stopChord();

  const ctx = initAudioContext();

  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  const gainNode = ctx.createGain();
  gainNode.connect(ctx.destination);

  const now = ctx.currentTime;
  const durationSec = duration / 1000;

  // ADSR-style envelope
  const attackTime = 0.05;
  const decayTime = 0.2;
  const sustainLevel = 0.4;
  const releaseTime = 0.2;

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.7, now + attackTime);
  gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
  gainNode.gain.setValueAtTime(sustainLevel, now + durationSec - releaseTime);
  gainNode.gain.linearRampToValueAtTime(0, now + durationSec);

  for (const note of notes) {
    const frequency = noteIndexToFrequency(note.index, octave);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = frequency;
    osc.connect(gainNode);
    osc.start(now);
    osc.stop(now + durationSec);
    activeOscillators.push(osc);
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      activeOscillators = [];
      resolve();
    }, duration);
  });
}
