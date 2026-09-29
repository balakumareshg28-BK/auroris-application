/**
 * Audio Alert Utility
 * Uses Web Audio API to play subtle, non-intrusive sound cues
 * when station health transitions from ONLINE to DEGRADED or OFFLINE.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (err) {
    console.warn('Web Audio API not supported or permitted:', err);
    return null;
  }
}

/**
 * Play a subtle, non-intrusive harmonic alert tone.
 * - 'DEGRADED': Gentle dual-tone cautionary chime (warm sine wave, 520Hz -> 440Hz, soft decay).
 * - 'OFFLINE': Slightly lower dual-tone alert (440Hz -> 330Hz, soft decay).
 */
export function playStationHealthAlert(targetStatus: 'DEGRADED' | 'OFFLINE' | 'TEST'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master volume gain - keeps the chime soft and non-intrusive
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.08, now + 0.02); // 8% peak volume: soft & discreet
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    // Subtle low-pass filter to eliminate harsh high-frequency clicks
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);

    // Oscillator 1: Primary melodic tone
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';

    // Oscillator 2: Soft harmonic overtone for a refined acoustic feel
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';

    if (targetStatus === 'DEGRADED') {
      // Gentle downward minor chime: 523.25 Hz (C5) gliding to 440 Hz (A4)
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(440.0, now + 0.25);

      osc2.frequency.setValueAtTime(659.25, now);
      osc2.frequency.exponentialRampToValueAtTime(554.37, now + 0.28);
    } else if (targetStatus === 'OFFLINE') {
      // Calm, deeper alert tone: 440 Hz (A4) gliding to 329.63 Hz (E4)
      osc1.frequency.setValueAtTime(440.0, now);
      osc1.frequency.exponentialRampToValueAtTime(329.63, now + 0.3);

      osc2.frequency.setValueAtTime(554.37, now);
      osc2.frequency.exponentialRampToValueAtTime(415.3, now + 0.32);
    } else {
      // Test preview chime: 587.33 Hz (D5) to 523.25 Hz (C5)
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(523.25, now + 0.22);

      osc2.frequency.setValueAtTime(739.99, now);
      osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.24);
    }

    // Connect audio graph
    osc1.connect(masterGain);
    osc2.connect(masterGain);
    masterGain.connect(filter);
    filter.connect(ctx.destination);

    // Schedule start & stop
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.58);
    osc2.stop(now + 0.58);
  } catch (e) {
    console.warn('Audio alert playback error:', e);
  }
}
