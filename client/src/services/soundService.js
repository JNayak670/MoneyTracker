/**
 * MoneyTracker Sound & Haptic Service
 * 
 * Provides crisp, high-fidelity notification chime sounds and haptic vibration feedback
 * when notifications, approvals, or friend requests arrive.
 * 
 * Includes:
 * 1. Automatic user-gesture audio context unlock (critical for mobile Chrome & Safari).
 * 2. Dual-engine playback: HTML5 Audio file playback with fallback to Web Audio API synthesis.
 * 3. Haptic vibration feedback for mobile phones (navigator.vibrate).
 * 4. User sound preference toggle (saved in localStorage).
 * 5. Debounce/cooldown to prevent audio clipping on burst events.
 */

const STORAGE_KEY = 'moneytracker_sound_enabled';
const NOTIFICATION_SOUND_URL = '/sounds/notification.wav';

let sharedAudioContext = null;
let sharedAudioElement = null;
let isAudioUnlocked = false;
let lastPlayTime = 0;

/**
 * Check if sound is currently enabled by user preference
 */
export function isSoundEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch (e) {
    return true;
  }
}

/**
 * Toggle or set sound enabled preference
 */
export function setSoundEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('sound-preference-changed', { detail: { enabled } }));
  } catch (e) {
    // ignore storage error
  }
}

export function toggleSound() {
  const current = isSoundEnabled();
  setSoundEnabled(!current);
  return !current;
}

/**
 * Pre-warm and unlock audio on first user touch/click.
 * Browsers require a user gesture before background audio playback is permitted.
 */
export function unlockAudio() {
  if (isAudioUnlocked) return;

  try {
    // 1. Unlock Web Audio Context
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      if (!sharedAudioContext) {
        sharedAudioContext = new AudioContextClass();
      }
      if (sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume().then(() => {
          isAudioUnlocked = true;
        }).catch(() => {});
      } else {
        isAudioUnlocked = true;
      }
    }

    // 2. Pre-load Audio element
    if (!sharedAudioElement && typeof Audio !== 'undefined') {
      sharedAudioElement = new Audio(NOTIFICATION_SOUND_URL);
      sharedAudioElement.preload = 'auto';
      sharedAudioElement.volume = 0.75;
    }
  } catch (err) {
    // ignore unlock error
  }
}

// Auto-register touch/click listeners to unlock audio on first interaction
if (typeof window !== 'undefined') {
  const unlockEvents = ['click', 'touchstart', 'touchend', 'keydown'];
  const handleFirstInteraction = () => {
    unlockAudio();
    unlockEvents.forEach(evt => window.removeEventListener(evt, handleFirstInteraction));
  };
  unlockEvents.forEach(evt => window.addEventListener(evt, handleFirstInteraction, { passive: true, once: true }));
}

/**
 * Synthesize a crystal-clear melodic chime using Web Audio API
 * Plays an uplifting triad: A5 (880Hz) -> D6 (1174.6Hz) -> A6 (1760Hz)
 */
function playSynthesizedChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new AudioContextClass();
    }

    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume();
    }

    const ctx = sharedAudioContext;
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.4, now);
    masterGain.connect(ctx.destination);

    // Three notes: uplifting bell chime
    const notes = [
      { start: 0.00, freq: 880.00, dur: 0.35, gain: 0.5 },  // A5
      { start: 0.08, freq: 1174.66, dur: 0.45, gain: 0.65 }, // D6
      { start: 0.18, freq: 1760.00, dur: 0.70, gain: 0.85 }  // A6
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      // Fast 4ms attack, smooth exponential decay
      gain.gain.setValueAtTime(0.001, now + note.start);
      gain.gain.linearRampToValueAtTime(note.gain, now + note.start + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.dur);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur);
    });
  } catch (err) {
    // Ignore audio error
  }
}

/**
 * Trigger mobile haptic vibration
 */
function triggerHaptic() {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      // Gentle double pulse pattern: 70ms vibrate, 50ms pause, 90ms vibrate
      navigator.vibrate([70, 50, 90]);
    }
  } catch (err) {
    // Ignore vibration unsupported
  }
}

/**
 * Play notification chime sound & trigger haptic feedback
 * 
 * @param {boolean} force - If true, bypasses user mute preference (e.g. for user testing the sound)
 */
export function playNotificationSound(force = false) {
  if (!force && !isSoundEnabled()) {
    return;
  }

  // Prevent sound stutter if multiple notifications arrive in rapid succession (500ms cooldown)
  const now = Date.now();
  if (!force && now - lastPlayTime < 500) {
    return;
  }
  lastPlayTime = now;

  // Trigger mobile vibration
  triggerHaptic();

  // Try playing high-fidelity WAV file first
  try {
    if (!sharedAudioElement && typeof Audio !== 'undefined') {
      sharedAudioElement = new Audio(NOTIFICATION_SOUND_URL);
      sharedAudioElement.volume = 0.75;
    }

    if (sharedAudioElement) {
      sharedAudioElement.currentTime = 0;
      sharedAudioElement.volume = 0.75;
      const playPromise = sharedAudioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback to Web Audio API synthesis if file playback was rejected
          playSynthesizedChime();
        });
        return;
      }
    }
  } catch (err) {
    // Fallback to Web Audio synthesis
  }

  // Fallback: Web Audio synthesis
  playSynthesizedChime();
}

/**
 * Test play notification sound (forces playback even if muted)
 */
export function testNotificationSound() {
  unlockAudio();
  playNotificationSound(true);
}

export default {
  playNotificationSound,
  testNotificationSound,
  unlockAudio,
  isSoundEnabled,
  setSoundEnabled,
  toggleSound
};
