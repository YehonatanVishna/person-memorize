import { beforeEach, describe, expect, it } from 'vitest';
import {
  calculateLevelFromXP,
  getPlayerProfile,
  recordSessionCompletion,
  savePlayerProfile,
} from './playerProgress';

// In-memory mock for localStorage in Node/Vitest environment
const storageMock: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, value: string) => {
    storageMock[key] = value;
  },
  removeItem: (key: string) => {
    delete storageMock[key];
  },
  clear: () => {
    for (const key of Object.keys(storageMock)) {
      delete storageMock[key];
    }
  },
};

describe('Player Progression & Achievements System', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    // @ts-expect-error Mocking window.localStorage for test environment
    globalThis.localStorage = mockLocalStorage;
    // @ts-expect-error Mocking window for test environment
    globalThis.window = globalThis;
  });

  it('calculates level 1 for 0 XP', () => {
    const lvl = calculateLevelFromXP(0);
    expect(lvl.level).toBe(1);
    expect(lvl.title).toBe('טירון זיכרון');
    expect(lvl.progressPercent).toBe(0);
  });

  it('calculates level progression correctly across thresholds', () => {
    // 250 XP -> Level 2
    const lvl2 = calculateLevelFromXP(250);
    expect(lvl2.level).toBe(2);
    expect(lvl2.title).toBe('סייר שמות');

    // 450 XP -> Level 2 midway (250 to 650 span = 400, 200/400 = 50%)
    const lvl2Mid = calculateLevelFromXP(450);
    expect(lvl2Mid.level).toBe(2);
    expect(lvl2Mid.progressPercent).toBe(50);

    // 1300 XP -> Level 4
    const lvl4 = calculateLevelFromXP(1300);
    expect(lvl4.level).toBe(4);
    expect(lvl4.title).toBe('אלוף הזיהוי');
  });

  it('records session completion, awards XP, and unlocks FIRST_WIN', () => {
    const result = recordSessionCompletion({
      xpEarned: 150,
      correctCount: 4,
      totalQuestions: 5,
      highestStreak: 3,
      mode: 'photo-to-name',
    });

    expect(result.xpEarned).toBe(150);
    expect(result.updatedProfile.totalXP).toBe(150);
    expect(result.updatedProfile.gamesPlayed).toBe(1);
    expect(result.updatedProfile.totalCorrect).toBe(4);
    expect(result.updatedProfile.highestStreakEver).toBe(3);

    expect(result.newAchievements.some((a) => a.id === 'FIRST_WIN')).toBe(true);
    expect(result.newAchievements.some((a) => a.id === 'PERFECT_ROUND')).toBe(false);
  });

  it('unlocks PERFECT_ROUND on 100% with >= 4 questions', () => {
    const result = recordSessionCompletion({
      xpEarned: 300,
      correctCount: 5,
      totalQuestions: 5,
      highestStreak: 5,
      mode: 'name-to-id',
      isRetry: false,
    });

    expect(result.newAchievements.some((a) => a.id === 'PERFECT_ROUND')).toBe(true);
    expect(result.newAchievements.some((a) => a.id === 'STREAK_5')).toBe(true);
  });

  it('suppresses PERFECT_ROUND on retry sessions', () => {
    const result = recordSessionCompletion({
      xpEarned: 100,
      correctCount: 4,
      totalQuestions: 4,
      highestStreak: 4,
      mode: 'name-to-id',
      isRetry: true,
    });

    expect(result.newAchievements.some((a) => a.id === 'PERFECT_ROUND')).toBe(false);
  });

  it('unlocks SPEED_DEMON when fastestAnswerMs < 2500', () => {
    const result = recordSessionCompletion({
      xpEarned: 200,
      correctCount: 3,
      totalQuestions: 3,
      highestStreak: 3,
      mode: 'photo-to-id',
      fastestAnswerMs: 1800,
    });

    expect(result.newAchievements.some((a) => a.id === 'SPEED_DEMON')).toBe(true);
  });

  it('detects level up properly', () => {
    // Start at 200 XP (level 1)
    savePlayerProfile({
      ...getPlayerProfile(),
      totalXP: 200,
      level: 1,
    });

    // Add 100 XP -> 300 XP (level 2)
    const result = recordSessionCompletion({
      xpEarned: 100,
      correctCount: 1,
      totalQuestions: 1,
      highestStreak: 1,
      mode: 'mix',
    });

    expect(result.leveledUp).toBe(true);
    expect(result.oldLevel).toBe(1);
    expect(result.newLevel).toBe(2);
  });
});
