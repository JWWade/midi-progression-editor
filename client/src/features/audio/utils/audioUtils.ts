import type { AudioParams } from "../constants/audioConfig";
import { DEFAULT_AUDIO_PARAMS } from "../constants/audioConfig";

export interface PlayOptions {
  duration?: number;
  octave?: number;
  audioParams?: AudioParams;
}

let audioCtx: AudioContext | null = null;

interface PlaybackSession {
  done: Promise<void>;
  registerOscillator: (oscillator: OscillatorNode) => void;
  registerNode: (node: AudioNode) => void;
  scheduleTimeout: (callback: () => void, delayMs: number) => void;
  stop: () => void;
}

let activeSession: PlaybackSession | null = null;

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
  activeSession?.stop();
  activeSession = null;
}

export interface ArpeggioHandle {
  /** Cancels ongoing arpeggio playback immediately. */
  cancel: () => void;
  /** Resolves when all notes have finished (or playback was cancelled). */
  done: Promise<void>;
}

interface PlayArpeggioOptions extends PlayOptions {
  startOffsetsMs?: ReadonlyArray<number>;
  noteDurationsMs?: ReadonlyArray<number>;
  totalDurationMs?: number;
}

function createPlaybackSession(): PlaybackSession {
  const oscillators: OscillatorNode[] = [];
  const nodes: AudioNode[] = [];
  const timeoutIds: number[] = [];
  let isStopped = false;
  let resolveDone: (() => void) | null = null;

  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  const session: PlaybackSession = {
    done,
    registerOscillator: (oscillator) => {
      oscillators.push(oscillator);
    },
    registerNode: (node) => {
      nodes.push(node);
    },
    scheduleTimeout: (callback, delayMs) => {
      const timeoutId = window.setTimeout(callback, delayMs);
      timeoutIds.push(timeoutId);
    },
    stop: () => {
      if (isStopped) {
        return;
      }

      isStopped = true;

      for (const timeoutId of timeoutIds) {
        window.clearTimeout(timeoutId);
      }

      for (const oscillator of oscillators) {
        try {
          oscillator.stop();
        } catch {
          // already stopped
        }
        try {
          oscillator.disconnect();
        } catch {
          // already disconnected
        }
      }

      for (const node of nodes) {
        try {
          node.disconnect();
        } catch {
          // already disconnected
        }
      }

      if (activeSession === session) {
        activeSession = null;
      }
      resolveDone?.();
      resolveDone = null;
    },
  };

  return session;
}

function createOutputChain(
  ctx: AudioContext,
  audioParams: AudioParams,
  session: PlaybackSession,
): GainNode {
  const masterGainNode = ctx.createGain();
  masterGainNode.gain.value = audioParams.masterVolume;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = audioParams.compressorThreshold;
  compressor.ratio.value = audioParams.compressorRatio;
  compressor.knee.value = 6;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  masterGainNode.connect(compressor);
  compressor.connect(ctx.destination);

  session.registerNode(masterGainNode);
  session.registerNode(compressor);

  return masterGainNode;
}

function scheduleEnvelope(
  envelopeGainNode: GainNode,
  startTime: number,
  durationSec: number,
  scaleFactor: number,
  audioParams: AudioParams,
): void {
  const endTime = startTime + Math.max(0, durationSec);
  const attackPeakGain = audioParams.attackPeak * scaleFactor;
  const sustainGain = audioParams.sustainLevel * scaleFactor;
  const attackEndTime = Math.min(endTime, startTime + audioParams.attackTime);
  const decayEndTime = Math.min(endTime, attackEndTime + audioParams.decayTime);
  const releaseStartTime = Math.max(
    decayEndTime,
    endTime - Math.min(audioParams.releaseTime, durationSec),
  );

  envelopeGainNode.gain.setValueAtTime(0, startTime);

  if (attackEndTime > startTime) {
    envelopeGainNode.gain.linearRampToValueAtTime(attackPeakGain, attackEndTime);
  } else {
    envelopeGainNode.gain.setValueAtTime(attackPeakGain, attackEndTime);
  }

  if (decayEndTime > attackEndTime) {
    envelopeGainNode.gain.linearRampToValueAtTime(sustainGain, decayEndTime);
  } else {
    envelopeGainNode.gain.setValueAtTime(sustainGain, decayEndTime);
  }

  if (releaseStartTime > decayEndTime) {
    envelopeGainNode.gain.setValueAtTime(sustainGain, releaseStartTime);
  }

  envelopeGainNode.gain.linearRampToValueAtTime(0, endTime);
}

function scheduleNotePlayback(
  ctx: AudioContext,
  session: PlaybackSession,
  masterGainNode: GainNode,
  noteIndex: number,
  octave: number,
  startTime: number,
  durationSec: number,
  audioParams: AudioParams,
  simultaneousNoteCount: number,
): void {
  const envelopeGainNode = ctx.createGain();
  envelopeGainNode.connect(masterGainNode);
  session.registerNode(envelopeGainNode);

  const scaleFactor = audioParams.scaleGainByNoteCount
    ? 1 / Math.max(1, simultaneousNoteCount)
    : 1;
  scheduleEnvelope(envelopeGainNode, startTime, durationSec, scaleFactor, audioParams);

  const oscillator = ctx.createOscillator();
  oscillator.type = audioParams.oscillatorType;
  oscillator.frequency.value = noteIndexToFrequency(noteIndex, octave);
  oscillator.connect(envelopeGainNode);
  oscillator.start(startTime);
  oscillator.stop(startTime + durationSec);
  session.registerOscillator(oscillator);
}

/**
 * Plays the given notes one by one in sequence (arpeggiated).
 *
 * Returns a handle with:
 * - `cancel()` — stop playback early and silence any playing note.
 * - `done` — a Promise that resolves once all notes have played or playback
 *   is cancelled.
 *
 * @param notes        Ordered list of note indices to play.
 * @param options      Standard `PlayOptions`; `duration` is per-note (default 280 ms).
 */
export function playArpeggio(
  notes: ReadonlyArray<{ index: number }>,
  options: PlayArpeggioOptions = {},
): ArpeggioHandle {
  const { duration = 280, octave = 4, audioParams = DEFAULT_AUDIO_PARAMS } = options;
  stopChord();

  const run = async (): Promise<ArpeggioHandle> => {
    const ctx = initAudioContext();

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const session = createPlaybackSession();
    activeSession = session;

    const now = ctx.currentTime;
    const masterGainNode = createOutputChain(ctx, audioParams, session);
    const startOffsetsMs = notes.map((_, index) => options.startOffsetsMs?.[index] ?? index * duration);
    const noteDurationsMs = notes.map((_, index) => Math.max(0, options.noteDurationsMs?.[index] ?? duration));
    const fallbackTotalDurationMs = notes.reduce((maxEnd, _, index) => {
      const end = (startOffsetsMs[index] ?? 0) + (noteDurationsMs[index] ?? duration);
      return Math.max(maxEnd, end);
    }, 0);
    const totalDurationMs = Math.max(
      0,
      options.totalDurationMs ?? fallbackTotalDurationMs,
    );

    notes.forEach((note, index) => {
      scheduleNotePlayback(
        ctx,
        session,
        masterGainNode,
        note.index,
        octave,
        now + (startOffsetsMs[index] ?? 0) / 1000,
        (noteDurationsMs[index] ?? duration) / 1000,
        audioParams,
        1,
      );
    });

    session.scheduleTimeout(() => session.stop(), totalDurationMs);

    return {
      cancel: () => session.stop(),
      done: session.done,
    };
  };

  const pendingHandle = run();

  return {
    cancel: () => {
      pendingHandle.then((handle) => handle.cancel());
    },
    done: pendingHandle.then((handle) => handle.done),
  };
}

export async function playChord(
  notes: ReadonlyArray<{ index: number }>,
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
  const session = createPlaybackSession();
  activeSession = session;
  const masterGainNode = createOutputChain(ctx, audioParams, session);

  for (const note of notes) {
    scheduleNotePlayback(
      ctx,
      session,
      masterGainNode,
      note.index,
      octave,
      now,
      durationSec,
      audioParams,
      notes.length,
    );
  }

  session.scheduleTimeout(() => session.stop(), duration);
  return session.done;
}
