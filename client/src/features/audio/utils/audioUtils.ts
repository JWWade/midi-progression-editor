import type { ChordNoteInfo } from "@/features/chord/types";
import type { AudioParams } from "../constants/audioConfig";
import { DEFAULT_AUDIO_PARAMS } from "../constants/audioConfig";

export interface PlayOptions {
  duration?: number;
  octave?: number;
  audioParams?: AudioParams;
}

let activeOscillators: OscillatorNode[] = [];
let activeEnvelopeGain: GainNode | null = null;
let activeMasterGain: GainNode | null = null;
let activeCompressor: DynamicsCompressorNode | null = null;
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

/** Stops all playing oscillators and disconnects every active audio node. */
export function stopChord(): void {
  for (const osc of activeOscillators) {
    try {
      osc.stop();
    } catch {
      // already stopped
    }
    try {
      osc.disconnect();
    } catch {
      // already disconnected
    }
  }
  activeOscillators = [];

  try {
    activeEnvelopeGain?.disconnect();
  } catch {
    // already disconnected
  }
  try {
    activeMasterGain?.disconnect();
  } catch {
    // already disconnected
  }
  try {
    activeCompressor?.disconnect();
  } catch {
    // already disconnected
  }
  activeEnvelopeGain = null;
  activeMasterGain = null;
  activeCompressor = null;
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

  // Track nodes so stopChord() can disconnect them if called early
  activeEnvelopeGain = envelopeGainNode;
  activeMasterGain = masterGainNode;
  activeCompressor = compressor;

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

  // Snapshot this call's oscillator list so the cleanup closure below doesn't
  // accidentally disconnect nodes that belong to a subsequent playChord call.
  const oscillatorsForThisCall = activeOscillators.slice();

  return new Promise((resolve) => {
    setTimeout(() => {
      // Disconnect oscillators created in this call (local snapshot).
      // stopChord() may have already disconnected these; the try-catch silently
      // swallows errors from nodes that are already disconnected.
      for (const osc of oscillatorsForThisCall) {
        try {
          osc.disconnect();
        } catch {
          // already disconnected by stopChord
        }
      }

      // Disconnect the shared audio chain using local closure references so we
      // always clean up even when stopChord() already cleared the module refs.
      // The try-catch handles the case where stopChord() disconnected first.
      try {
        envelopeGainNode.disconnect();
      } catch {
        // already disconnected by stopChord
      }
      try {
        masterGainNode.disconnect();
      } catch {
        // already disconnected by stopChord
      }
      try {
        compressor.disconnect();
      } catch {
        // already disconnected by stopChord
      }

      // Clear module-level refs only if they still point to our nodes —
      // a subsequent playChord call may have already replaced them.
      if (activeEnvelopeGain === envelopeGainNode) activeEnvelopeGain = null;
      if (activeMasterGain === masterGainNode) activeMasterGain = null;
      if (activeCompressor === compressor) activeCompressor = null;

      resolve();
    }, duration);
  });
}
