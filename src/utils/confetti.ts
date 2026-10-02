import confetti from 'canvas-confetti';

/**
 * Trigger a celebratory confetti burst for a correct answer.
 */
export function triggerCorrectAnswerConfetti(): void {
  try {
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6'],
      ticks: 150,
      gravity: 1.2,
      scalar: 0.9,
      disableForReducedMotion: true,
    });
  } catch {
    // Graceful fallback if canvas is unavailable (e.g. headless tests)
  }
}

/**
 * Trigger a larger celebration confetti burst for high scores on session completion.
 */
export function triggerCompletionConfetti(): void {
  try {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'],
      ticks: 200,
      disableForReducedMotion: true,
    });
  } catch {
    // Graceful fallback
  }
}
