import { describe, expect, it } from 'vitest';
import { checkNameMatch, containsHebrew, levenshteinDistance, normalizeText } from './hebrew';

describe('Hebrew and Text Normalization', () => {
  it('strips Hebrew niqqud and vowel points', () => {
    // "יִשְׂרָאֵל יִשְׂרָאֵלִי" with full niqqud
    const withNiqqud = 'יִשְׂרָאֵל יִשְׂרָאֵלִי';
    const plain = 'ישראל ישראלי';
    expect(normalizeText(withNiqqud)).toBe(plain);
  });

  it('normalizes excess spaces and punctuation', () => {
    expect(normalizeText('  שרה   כהן  ')).toBe('שרה כהן');
    expect(normalizeText('יוסי-חיים')).toBe('יוסי חיים');
    expect(normalizeText("ג'ורג'")).toBe("ג'ורג'");
  });

  it('computes Levenshtein distance accurately', () => {
    expect(levenshteinDistance('יונתן', 'יונתן')).toBe(0);
    expect(levenshteinDistance('יונתן', 'יונתנ')).toBe(1);
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
  });

  it('matches exact and niqqud variations', () => {
    const target = 'נועה לוי';
    const inputWithNiqqud = 'נוֹעָה לֵוִי';
    const match = checkNameMatch(inputWithNiqqud, target, false);
    expect(match.isMatch).toBe(true);
    expect(match.isTypo).toBe(false);
  });

  it('handles reversed first and last names', () => {
    const target = 'ישראל ישראלי';
    const inputReversed = 'ישראלי ישראל';
    const match = checkNameMatch(inputReversed, target, false);
    expect(match.isMatch).toBe(true);
    expect(match.isTypo).toBe(false);
  });

  it('handles typo tolerance when enabled', () => {
    const target = 'אלכסנדר גולדמן';
    // Single typo in first name: אלכסנדד instead of אלכסנדר
    const typoInput = 'אלכסנדד גולדמן';

    const strictResult = checkNameMatch(typoInput, target, false);
    expect(strictResult.isMatch).toBe(false);

    const lenientResult = checkNameMatch(typoInput, target, true);
    expect(lenientResult.isMatch).toBe(true);
    expect(lenientResult.isTypo).toBe(true);
  });

  it('detects Hebrew script correctly', () => {
    expect(containsHebrew('דניאל')).toBe(true);
    expect(containsHebrew('Daniel')).toBe(false);
    expect(containsHebrew('John Doe (ישראל)')).toBe(true);
  });
});
