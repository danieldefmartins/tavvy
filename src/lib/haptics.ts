/**
 * Mobile haptic feedback utility
 * Uses the Web Vibration API for Android and AudioContext trick for iOS
 * Gracefully degrades on unsupported platforms
 */

type HapticIntensity = 'light' | 'medium' | 'heavy';

// Check if the device supports vibration
const supportsVibration = typeof navigator !== 'undefined' && 'vibrate' in navigator;

// Check if we're on iOS
const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

// AudioContext for iOS haptic-like feedback (creates a subtle audio pulse)
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (!isIOS) return null;
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioContext;
}

// Vibration patterns by intensity (in milliseconds)
const vibrationPatterns: Record<HapticIntensity, number> = {
  light: 10,
  medium: 25,
  heavy: 50,
};

/**
 * Trigger haptic feedback
 * @param intensity - 'light' | 'medium' | 'heavy' (default: 'light')
 */
export function haptic(intensity: HapticIntensity = 'light'): void {
  try {
    // Try native vibration first (Android)
    if (supportsVibration) {
      navigator.vibrate(vibrationPatterns[intensity]);
      return;
    }

    // iOS fallback using AudioContext
    // This creates a very brief, silent oscillation that can sometimes trigger subtle haptics
    if (isIOS) {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'running') {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        
        // Silent but rapid oscillation
        gain.gain.value = 0.001;
        oscillator.frequency.value = intensity === 'light' ? 100 : intensity === 'medium' ? 150 : 200;
        
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.01);
      }
    }
  } catch {
    // Silently fail - haptics are non-critical
  }
}

/**
 * Light haptic - for toggles, selections, micro-interactions
 */
export function hapticLight(): void {
  haptic('light');
}

/**
 * Medium haptic - for confirmations, important actions
 */
export function hapticMedium(): void {
  haptic('medium');
}

/**
 * Heavy haptic - for errors, warnings, destructive actions
 */
export function hapticHeavy(): void {
  haptic('heavy');
}
