/**
 * Sound synthesis engine using native Web Audio API.
 * Zero external audio files required, runs offline, zero latency, PWA ready.
 */

const STORAGE_KEY = 'pm_sound_muted';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
}

export function toggleSound(): boolean {
  const newMuted = !isSoundMuted();
  setSoundMuted(newMuted);
  if (!newMuted) {
    playPopSound();
  }
  return newMuted;
}

/**
 * Play a pleasant ascending bell chime when an answer is correct.
 * Higher streak = higher musical note/octave!
 */
export function playCorrectSound(streak: number = 0): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const baseFreqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const pitchMultiplier = Math.min(2.0, 1 + Math.min(streak, 10) * 0.08);

    baseFreqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = index % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq * pitchMultiplier, now + index * 0.05);

      gain.gain.setValueAtTime(0, now + index * 0.05);
      gain.gain.linearRampToValueAtTime(0.15, now + index * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.05);
      osc.stop(now + index * 0.05 + 0.36);
    });
  } catch {
    // Graceful fallback if audio is not permitted
  }
}

/**
 * Play a gentle, non-jarring low tone when an answer is wrong.
 */
export function playWrongSound(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now); // A3
    osc.frequency.linearRampToValueAtTime(160, now + 0.25);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.29);
  } catch {
    // Graceful fallback
  }
}

/**
 * Play a sparkling streak milestone chime (for streaks of 3, 5, 10, etc.)
 */
export function playStreakMilestoneSound(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.18, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.31);
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Play a crisp mechanical card flip / swish sound for flashcards.
 */
export function playCardFlipSound(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  } catch {
    // Graceful fallback
  }
}

/**
 * Play a magical harp sparkle chime when activating a lifeline (50:50 / hint).
 */
export function playLifelineSound(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const freqs = [880, 1046.5, 1318.51, 1567.98]; // A5, C6, E6, G6

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);

      gain.gain.setValueAtTime(0.12, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.26);
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Play a triumphant fanfare when an achievement is unlocked or user levels up!
 */
export function playAchievementSound(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Fanfare: C5, G5, C6, E6 chord
    const sequence = [
      { note: 523.25, time: 0, dur: 0.12 },
      { note: 659.25, time: 0.12, dur: 0.12 },
      { note: 783.99, time: 0.24, dur: 0.15 },
      { note: 1046.5, time: 0.40, dur: 0.45 },
    ];

    sequence.forEach(({ note, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, now + time);

      gain.gain.setValueAtTime(0.2, now + time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.01);
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Play a brief UI tap/pop sound.
 */
export function playPopSound(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch {
    // Graceful fallback
  }
}
