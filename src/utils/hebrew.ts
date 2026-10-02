/**
 * Utilities for Hebrew and general text normalization and fuzzy comparison.
 */

// Regex covering Hebrew Niqqud (vowel points) and Cantillation marks (Ta'amim)
const HEBREW_DIACRITICS_REGEX = /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g;

// Normalize quotes, geresh, gershayim and hyphens
const QUOTES_REGEX = /[\u05F3\u2019\u2018`]/g; // Geresh / single quote variants
const GERSHAYIM_REGEX = /[\u05F4\u201C\u201D]/g; // Gershayim / double quote variants

/**
 * Normalizes a string for fair comparison:
 * 1. Strips Hebrew niqqud and cantillation marks
 * 2. Normalizes punctuation marks (geresh, gershayim, quotes, hyphens)
 * 3. Trims whitespace and collapses multiple spaces into one
 * 4. Lowercases Latin characters
 */
export function normalizeText(text: string): string {
  if (!text) return '';

  return text
    .replace(HEBREW_DIACRITICS_REGEX, '')
    .replace(QUOTES_REGEX, "'")
    .replace(GERSHAYIM_REGEX, '"')
    .replace(/[-–—_\u05BE]/g, ' ')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Computes standard Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) {
    row[j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }

  return row[b.length];
}

export interface MatchResult {
  isMatch: boolean;
  isTypo: boolean;
  distance: number;
}

/**
 * Compares user input against the target name.
 * Supports:
 * - Exact normalized match
 * - Word-order variations (e.g. "ישראל ישראלי" vs "ישראלי ישראל")
 * - Minor typo tolerance (1 character edit distance when allowTypo is enabled)
 */
export function checkNameMatch(input: string, targetName: string, allowTypo: boolean = false): MatchResult {
  const normInput = normalizeText(input);
  const normTarget = normalizeText(targetName);

  if (!normInput || !normTarget) {
    return { isMatch: false, isTypo: false, distance: Math.max(normInput.length, normTarget.length) };
  }

  // 1. Exact match after normalization
  if (normInput === normTarget) {
    return { isMatch: true, isTypo: false, distance: 0 };
  }

  // 2. Word order reversal (First Last vs Last First)
  const inputWords = normInput.split(' ').filter(Boolean);
  const targetWords = normTarget.split(' ').filter(Boolean);

  if (inputWords.length > 1 && inputWords.length === targetWords.length) {
    const reversedInput = [...inputWords].reverse().join(' ');
    if (reversedInput === normTarget) {
      return { isMatch: true, isTypo: false, distance: 0 };
    }
  }

  // 3. Typo tolerance evaluation
  const distance = levenshteinDistance(normInput, normTarget);

  if (allowTypo) {
    // Single typo allowed if the name has at least 3 characters
    if (distance === 1 && normTarget.length >= 3) {
      return { isMatch: true, isTypo: true, distance };
    }

    // Check word-by-word typo tolerance (e.g. 1 typo in first name or last name)
    if (inputWords.length === targetWords.length && inputWords.length > 1) {
      let totalWordDistance = 0;
      for (let i = 0; i < inputWords.length; i++) {
        totalWordDistance += levenshteinDistance(inputWords[i], targetWords[i]);
      }
      if (totalWordDistance <= 1) {
        return { isMatch: true, isTypo: true, distance: totalWordDistance };
      }
    }
  }

  return { isMatch: false, isTypo: false, distance };
}

/**
 * Checks if a string contains Hebrew characters.
 */
export function containsHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}
