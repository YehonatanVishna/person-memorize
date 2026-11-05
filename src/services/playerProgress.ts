/**
 * Player progression, XP, leveling, and achievements system.
 * Persisted in localStorage.
 */

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  iconName: 'Award' | 'Target' | 'Zap' | 'Flame' | 'Crown' | 'BookOpen' | 'Shuffle' | 'Sparkles';
  badgeColor: string;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: 'FIRST_WIN',
    title: 'צעד ראשון',
    description: 'סיימת סבב משחק ראשון בהצלחה',
    iconName: 'Award',
    badgeColor: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'PERFECT_ROUND',
    title: 'בול פגיעה 🎯',
    description: 'השגת 100% דיוק בסבב של 4 שאלות לפחות',
    iconName: 'Target',
    badgeColor: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'SPEED_DEMON',
    title: 'במהירות הברק ⚡',
    description: 'ענית נכון בתוך פחות מ-2.5 שניות',
    iconName: 'Zap',
    badgeColor: 'from-amber-400 to-yellow-600',
  },
  {
    id: 'STREAK_5',
    title: 'להבה בוערת 🔥',
    description: 'הגעת לרצף של 5 תשובות נכונות ברציפות',
    iconName: 'Flame',
    badgeColor: 'from-orange-500 to-rose-600',
  },
  {
    id: 'STREAK_10',
    title: 'בלתי מנוצח 👑',
    description: 'הגעת לרצף מדהים של 10 תשובות נכונות ברציפות',
    iconName: 'Crown',
    badgeColor: 'from-purple-500 to-pink-600',
  },
  {
    id: 'FLASHCARD_PRO',
    title: 'מאסטר כרטיסיות 🃏',
    description: 'סיימת סבב כרטיסיות זיכרון מלא',
    iconName: 'BookOpen',
    badgeColor: 'from-fuchsia-500 to-purple-600',
  },
  {
    id: 'MIX_CHAMP',
    title: 'אלוף המשולב 🎲',
    description: 'סיימת סבב משולב מעורב בהצלחה',
    iconName: 'Shuffle',
    badgeColor: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'SHARP_TYPER',
    title: 'חד כמו תער ✍️',
    description: 'הקלדת תשובה נכונה באופן מושלם ללא שגיאות',
    iconName: 'Sparkles',
    badgeColor: 'from-violet-500 to-indigo-700',
  },
];

export interface LevelInfo {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
}

export const LEVELS: readonly LevelInfo[] = [
  { level: 1, title: 'טירון זיכרון', minXP: 0, maxXP: 250 },
  { level: 2, title: 'סייר שמות', minXP: 250, maxXP: 650 },
  { level: 3, title: 'בלש פרצופים', minXP: 650, maxXP: 1250 },
  { level: 4, title: 'אלוף הזיהוי', minXP: 1250, maxXP: 2100 },
  { level: 5, title: 'מוח על', minXP: 2100, maxXP: 3200 },
  { level: 6, title: 'מאסטר פוטוגרפי', minXP: 3200, maxXP: 4600 },
  { level: 7, title: 'מומחה שמות ות"ז', minXP: 4600, maxXP: 6300 },
  { level: 8, title: 'אגדת הזיכרון 🏆', minXP: 6300, maxXP: 999999 },
];

export interface PlayerProfile {
  totalXP: number;
  level: number;
  levelTitle: string;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
  gamesPlayed: number;
  totalCorrect: number;
  highestStreakEver: number;
  unlockedAchievements: Record<string, { unlockedAt: number }>;
}

const STORAGE_KEY = 'pm_player_profile_v1';

export function calculateLevelFromXP(totalXP: number): {
  level: number;
  title: string;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
} {
  let matched = LEVELS[0];
  for (const l of LEVELS) {
    if (totalXP >= l.minXP) {
      matched = l;
    }
  }

  const span = matched.maxXP - matched.minXP;
  const currentInLevel = Math.max(0, totalXP - matched.minXP);
  const progressPercent =
    matched.level === LEVELS[LEVELS.length - 1].level
      ? 100
      : Math.min(100, Math.round((currentInLevel / span) * 100));

  return {
    level: matched.level,
    title: matched.title,
    currentLevelXP: currentInLevel,
    nextLevelXP: matched.maxXP === 999999 ? span : span,
    progressPercent,
  };
}

export function getPlayerProfile(): PlayerProfile {
  if (typeof window === 'undefined') {
    const lvl = calculateLevelFromXP(0);
    return {
      totalXP: 0,
      level: lvl.level,
      levelTitle: lvl.title,
      currentLevelXP: lvl.currentLevelXP,
      nextLevelXP: lvl.nextLevelXP,
      progressPercent: lvl.progressPercent,
      gamesPlayed: 0,
      totalCorrect: 0,
      highestStreakEver: 0,
      unlockedAchievements: {},
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const lvl = calculateLevelFromXP(parsed.totalXP || 0);
      return {
        totalXP: parsed.totalXP || 0,
        level: lvl.level,
        levelTitle: lvl.title,
        currentLevelXP: lvl.currentLevelXP,
        nextLevelXP: lvl.nextLevelXP,
        progressPercent: lvl.progressPercent,
        gamesPlayed: parsed.gamesPlayed || 0,
        totalCorrect: parsed.totalCorrect || 0,
        highestStreakEver: parsed.highestStreakEver || 0,
        unlockedAchievements: parsed.unlockedAchievements || {},
      };
    }
  } catch (err) {
    console.error('Error reading player profile', err);
  }

  const lvl = calculateLevelFromXP(0);
  return {
    totalXP: 0,
    level: lvl.level,
    levelTitle: lvl.title,
    currentLevelXP: lvl.currentLevelXP,
    nextLevelXP: lvl.nextLevelXP,
    progressPercent: lvl.progressPercent,
    gamesPlayed: 0,
    totalCorrect: 0,
    highestStreakEver: 0,
    unlockedAchievements: {},
  };
}

export function savePlayerProfile(profile: PlayerProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Error saving player profile', err);
  }
}

export interface ProgressUpdateResult {
  updatedProfile: PlayerProfile;
  xpEarned: number;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  newAchievements: AchievementDef[];
}

/**
 * Record completed game round or flashcards, awards XP, checks achievements, and persists profile.
 */
export function recordSessionCompletion({
  xpEarned,
  correctCount,
  totalQuestions,
  highestStreak,
  mode,
  isRetry = false,
  fastestAnswerMs = Infinity,
  hasPerfectTyping = false,
}: {
  xpEarned: number;
  correctCount: number;
  totalQuestions: number;
  highestStreak: number;
  mode: string;
  isRetry?: boolean;
  fastestAnswerMs?: number;
  hasPerfectTyping?: boolean;
}): ProgressUpdateResult {
  const current = getPlayerProfile();
  const oldLevel = current.level;

  const newTotalXP = current.totalXP + xpEarned;
  const newGamesPlayed = current.gamesPlayed + 1;
  const newTotalCorrect = current.totalCorrect + correctCount;
  const newHighestStreak = Math.max(current.highestStreakEver, highestStreak);

  const newlyUnlocked: AchievementDef[] = [];
  const achievements = { ...current.unlockedAchievements };

  const tryUnlock = (id: string) => {
    if (!achievements[id]) {
      achievements[id] = { unlockedAt: Date.now() };
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (def) newlyUnlocked.push(def);
    }
  };

  // Check achievements:
  // 1. FIRST_WIN: Any completed round with at least 1 correct
  if (correctCount > 0) {
    tryUnlock('FIRST_WIN');
  }

  // 2. PERFECT_ROUND: 100% on >= 4 questions (not retry)
  if (!isRetry && totalQuestions >= 4 && correctCount === totalQuestions) {
    tryUnlock('PERFECT_ROUND');
  }

  // 3. SPEED_DEMON: answered in < 2500ms
  if (fastestAnswerMs < 2500) {
    tryUnlock('SPEED_DEMON');
  }

  // 4. STREAK_5
  if (highestStreak >= 5) {
    tryUnlock('STREAK_5');
  }

  // 5. STREAK_10
  if (highestStreak >= 10) {
    tryUnlock('STREAK_10');
  }

  // 6. FLASHCARD_PRO
  if (mode === 'flashcards' && totalQuestions >= 4) {
    tryUnlock('FLASHCARD_PRO');
  }

  // 7. MIX_CHAMP
  if (mode === 'mix' && correctCount > 0) {
    tryUnlock('MIX_CHAMP');
  }

  // 8. SHARP_TYPER
  if (hasPerfectTyping) {
    tryUnlock('SHARP_TYPER');
  }

  const lvl = calculateLevelFromXP(newTotalXP);
  const leveledUp = lvl.level > oldLevel;

  const updatedProfile: PlayerProfile = {
    totalXP: newTotalXP,
    level: lvl.level,
    levelTitle: lvl.title,
    currentLevelXP: lvl.currentLevelXP,
    nextLevelXP: lvl.nextLevelXP,
    progressPercent: lvl.progressPercent,
    gamesPlayed: newGamesPlayed,
    totalCorrect: newTotalCorrect,
    highestStreakEver: newHighestStreak,
    unlockedAchievements: achievements,
  };

  savePlayerProfile(updatedProfile);

  return {
    updatedProfile,
    xpEarned,
    leveledUp,
    oldLevel,
    newLevel: lvl.level,
    newAchievements: newlyUnlocked,
  };
}
