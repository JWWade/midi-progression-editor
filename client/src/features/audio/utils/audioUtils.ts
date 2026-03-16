import type { ChordNoteInfo } from "@/features/chord/types";
import type { AudioParams } from "../constants/audioConfig";
import { DEFAULT_AUDIO_PARAMS } from "../constants/audioConfig";

export interface PlayOptions {
  duration?: number;
  octave?: number;
  audioParams?: AudioParams;
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
  const { duration = 1200, octave = 4, audioParams = DEFAULT_AUDIO_PARAMS } = options;

  stopChord();

  const ctx = initAudioContext();

  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  const now = ctx.currentTime;
  const durationSec = duration / 1000;

  // Create envelope (ADSR) gain node
  const envelopeGainNode = ctx.createGain();

  // Create master volume node
  const masterGainNode = ctx.createGain();
  masterGainNode.gain.value = audioParams.masterVolume;

  // Create and connect compressor for safety (always on)
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = audioParams.compressorThreshold;
  compressor.ratio.value = audioParams.compressorRatio;
  compressor.knee.value = 6;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  // Signal chain: envelope → master volume → compressor → output
  envelopeGainNode.connect(masterGainNode);
  masterGainNode.connect(compressor);
  compressor.connect(ctx.destination);

  // Scale the attack peak by note count if enabled
  const scaleFactor = audioParams.scaleGainByNoteCount ? 1 / notes.length : 1;
  const attackPeakGain = audioParams.attackPeak * scaleFactor;

  // ADSR envelope on the envelope gain node
  envelopeGainNode.gain.setValueAtTime(0, now);
  envelopeGainNode.gain.linearRampToValueAtTime(attackPeakGain, now + audioParams.attackTime);
  envelopeGainNode.gain.linearRampToValueAtTime(
    audioParams.sustainLevel * scaleFactor,
    now + audioParams.attackTime + audioParams.decayTime,
  );
  envelopeGainNode.gain.setValueAtTime(
    audioParams.sustainLevel * scaleFactor,
    now + durationSec - audioParams.releaseTime,
  );
  envelopeGainNode.gain.linearRampToValueAtTime(0, now + durationSec);

  // Create and start oscillators
  for (const note of notes) {
    const frequency = noteIndexToFrequency(note.index, octave);
    const osc = ctx.createOscillator();
    osc.type = audioParams.oscillatorType;
    osc.frequency.value = frequency;
    osc.connect(envelopeGainNode);
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
