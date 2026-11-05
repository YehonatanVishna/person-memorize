import { describe, expect, it } from 'vitest';
import type { Person } from '../types/person';
import {
  applyFiftyFifty,
  buildQuestionQueue,
  calculateScoreReward,
  evaluateAnswer,
  generateQuestionOptions,
  getDistractors,
  getHintClue,
  getNumberFromKeyEvent,
  shuffle,
} from './gameEngine';

const mockPeople: Person[] = [
  { id: '1', name: 'ישראל ישראלי', photoBlob: new Blob(), photoUrl: 'blob:1' },
  { id: '2', name: 'נועה לוי', photoBlob: new Blob(), photoUrl: 'blob:2' },
  { id: '3', name: 'איתי כהן', photoBlob: new Blob(), photoUrl: 'blob:3' },
  { id: '4', name: 'מאיה אברהם', photoBlob: new Blob(), photoUrl: 'blob:4' },
  { id: '5', name: 'דניאל פרידמן', photoBlob: new Blob(), photoUrl: 'blob:5' },
];

describe('Game Engine Utilities', () => {
  it('shuffles elements immutably and preserves length', () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffle(original);
    expect(shuffled).toHaveLength(5);
    expect(shuffled).toEqual(expect.arrayContaining(original));
  });

  it('selects valid distractors excluding the target', () => {
    const target = mockPeople[0];
    const distractors = getDistractors(target, mockPeople, 3);
    expect(distractors).toHaveLength(3);
    expect(distractors.some((d) => d.id === target.id)).toBe(false);
  });

  it('handles small pools with fewer than 4 items gracefully', () => {
    const twoPeople = [mockPeople[0], mockPeople[1]];
    const options = generateQuestionOptions(twoPeople[0], twoPeople, 3);
    expect(options).toHaveLength(2);
    expect(options.some((p) => p.id === twoPeople[0].id)).toBe(true);
    expect(options.some((p) => p.id === twoPeople[1].id)).toBe(true);
  });

  it('always includes target in generated options', () => {
    const target = mockPeople[2];
    const options = generateQuestionOptions(target, mockPeople, 3);
    expect(options).toHaveLength(4);
    expect(options.some((p) => p.id === target.id)).toBe(true);
  });

  it('builds question queue with clamped count and correct modes', () => {
    const queue3 = buildQuestionQueue(mockPeople, 3, false, 'name-to-id');
    expect(queue3).toHaveLength(3);
    expect(queue3[0].person).toBeDefined();
    expect(queue3[0].mode).toBe('name-to-id');

    const queueAll = buildQuestionQueue(mockPeople, -1, false, 'photo-to-id');
    expect(queueAll).toHaveLength(5);
    expect(queueAll.every((q) => q.mode === 'photo-to-id')).toBe(true);

    const queueOverflow = buildQuestionQueue(mockPeople, 100);
    expect(queueOverflow).toHaveLength(5);
  });

  it('builds mixed mode queue assigning diverse concrete modes', () => {
    const mixedQueue = buildQuestionQueue(mockPeople, 5, false, 'mix');
    expect(mixedQueue).toHaveLength(5);
    const assignedModes = mixedQueue.map((q) => q.mode);
    // Modes should be concrete modes (not 'mix')
    expect(assignedModes.every((m) => (m as string) !== 'mix')).toBe(true);
    // Across 5 questions, there should be multiple distinct modes
    const uniqueModes = new Set(assignedModes);
    expect(uniqueModes.size).toBeGreaterThan(1);
  });

  it('evaluates Mode 1 (Photo to Name) with Hebrew normalization', () => {
    const target = mockPeople[0]; // ישראל ישראלי
    const evalExact = evaluateAnswer('photo-to-name', target, 'ישראל ישראלי');
    expect(evalExact.isCorrect).toBe(true);

    const evalNiqqud = evaluateAnswer('photo-to-name', target, 'יִשְׂרָאֵל יִשְׂרָאֵלִי');
    expect(evalNiqqud.isCorrect).toBe(true);

    const evalWrong = evaluateAnswer('photo-to-name', target, 'אלי כהן');
    expect(evalWrong.isCorrect).toBe(false);
  });

  it('evaluates Mode 2 (Name to ID) correctly', () => {
    const target = mockPeople[1]; // id: '2'
    const evalCorrect = evaluateAnswer('name-to-id', target, '2');
    expect(evalCorrect.isCorrect).toBe(true);

    const evalWrong = evaluateAnswer('name-to-id', target, '999');
    expect(evalWrong.isCorrect).toBe(false);
  });

  it('evaluates Mode 3 (Name to Photo) correctly', () => {
    const target = mockPeople[3]; // id: '4'
    const evalCorrect = evaluateAnswer('name-to-photo', target, '4');
    expect(evalCorrect.isCorrect).toBe(true);

    const evalWrong = evaluateAnswer('name-to-photo', target, '1');
    expect(evalWrong.isCorrect).toBe(false);
  });

  it('evaluates photo-to-id, id-to-photo, and id-to-name correctly', () => {
    const target = mockPeople[2]; // id: '3', name: 'איתי כהן'
    const options = generateQuestionOptions(target, mockPeople, 3);

    // photo-to-id
    expect(evaluateAnswer('photo-to-id', target, '3', false, options).isCorrect).toBe(true);
    expect(evaluateAnswer('photo-to-id', target, '1', false, options).isCorrect).toBe(false);

    // id-to-photo
    expect(evaluateAnswer('id-to-photo', target, '3', false, options).isCorrect).toBe(true);
    expect(evaluateAnswer('id-to-photo', target, '4', false, options).isCorrect).toBe(false);

    // id-to-name
    expect(evaluateAnswer('id-to-name', target, '3', false, options).isCorrect).toBe(true);
    expect(evaluateAnswer('id-to-name', target, 'איתי כהן', false, options).isCorrect).toBe(true);
    expect(evaluateAnswer('id-to-name', target, 'נועה לוי', false, options).isCorrect).toBe(false);
  });

  it('evaluates photo-to-id-type with numeric cleaning', () => {
    const target: Person = { id: '012-345-678', name: 'בדיקה', photoBlob: new Blob(), photoUrl: 'blob:test' };
    
    // User types with dashes
    expect(evaluateAnswer('photo-to-id-type', target, '012-345-678').isCorrect).toBe(true);
    // User types clean digits
    expect(evaluateAnswer('photo-to-id-type', target, '012345678').isCorrect).toBe(true);
    // User types with spaces
    expect(evaluateAnswer('photo-to-id-type', target, '  012 345 678  ').isCorrect).toBe(true);
    // Incorrect digits
    expect(evaluateAnswer('photo-to-id-type', target, '999999999').isCorrect).toBe(false);
  });

  it('evaluates photo-to-first-name mode with first-name extraction and typo tolerance', () => {
    const target = mockPeople[0]; // ישראל ישראלי

    const exactFirst = evaluateAnswer('photo-to-first-name', target, 'ישראל');
    expect(exactFirst.isCorrect).toBe(true);
    expect(exactFirst.isTypo).toBe(false);
    expect(exactFirst.correctAnswer).toBe('ישראל');

    const typoFirst = evaluateAnswer('photo-to-first-name', target, 'ישרעל', true);
    expect(typoFirst.isCorrect).toBe(true);
    expect(typoFirst.isTypo).toBe(true);

    const wrongFirst = evaluateAnswer('photo-to-first-name', target, 'נועה', true);
    expect(wrongFirst.isCorrect).toBe(false);
  });

  describe('calculateScoreReward', () => {
    it('returns zero points for incorrect answers', () => {
      const reward = calculateScoreReward(false, 1500, 4);
      expect(reward.points).toBe(0);
      expect(reward.basePoints).toBe(0);
      expect(reward.speedBonus).toBe(0);
      expect(reward.multiplier).toBe(1);
    });

    it('calculates base points and speed bonus under 2.5s', () => {
      const reward = calculateScoreReward(true, 1800, 0);
      expect(reward.basePoints).toBe(100);
      expect(reward.speedBonus).toBe(50);
      expect(reward.multiplier).toBe(1.0);
      expect(reward.points).toBe(150);
    });

    it('calculates medium speed bonus between 2.5s and 5s', () => {
      const reward = calculateScoreReward(true, 3200, 0);
      expect(reward.basePoints).toBe(100);
      expect(reward.speedBonus).toBe(25);
      expect(reward.multiplier).toBe(1.0);
      expect(reward.points).toBe(125);
    });

    it('applies multipliers based on streak thresholds', () => {
      // streak 3 -> 1.5x
      const r3 = calculateScoreReward(true, 6000, 3);
      expect(r3.multiplier).toBe(1.5);
      expect(r3.points).toBe(150); // 100 * 1.5

      // streak 5 -> 2.0x with speed bonus
      const r5 = calculateScoreReward(true, 2000, 5);
      expect(r5.multiplier).toBe(2.0);
      expect(r5.points).toBe(300); // (100 + 50) * 2

      // streak 10 -> 2.5x
      const r10 = calculateScoreReward(true, 6000, 10);
      expect(r10.multiplier).toBe(2.5);
      expect(r10.points).toBe(250); // 100 * 2.5
    });

    it('reduces XP for retry mistake rounds to prevent exploits', () => {
      const retryReward = calculateScoreReward(true, 1500, 0, true);
      expect(retryReward.basePoints).toBe(50);
      expect(retryReward.speedBonus).toBe(25);
      expect(retryReward.points).toBe(75);
    });
  });

  describe('applyFiftyFifty & getHintClue lifelines', () => {
    it('safely reduces 4 options to 2 options including the target', () => {
      const target = mockPeople[0];
      const options = [mockPeople[0], mockPeople[1], mockPeople[2], mockPeople[3]];
      const reduced = applyFiftyFifty(target, options);

      expect(reduced).toHaveLength(2);
      expect(reduced.some((p) => p.id === target.id)).toBe(true);
      expect(reduced.some((p) => p.id !== target.id)).toBe(true);
    });

    it('handles pools with <= 2 options gracefully without crashing', () => {
      const target = mockPeople[0];
      const options2 = [mockPeople[0], mockPeople[1]];
      const reduced2 = applyFiftyFifty(target, options2);
      expect(reduced2).toHaveLength(2);

      const options1 = [mockPeople[0]];
      const reduced1 = applyFiftyFifty(target, options1);
      expect(reduced1).toHaveLength(1);
    });

    it('generates accurate hints for all modes', () => {
      const target: Person = {
        id: '123456789',
        name: 'דניאל כהן',
        photoBlob: new Blob(),
        photoUrl: 'blob:test',
      };

      expect(getHintClue('photo-to-first-name', target)).toContain('ד');
      expect(getHintClue('photo-to-name', target)).toContain('ד');
      expect(getHintClue('name-to-id', target)).toContain('123');
      expect(getHintClue('photo-to-id-type', target)).toContain('123');
      expect(getHintClue('name-to-photo', target)).toContain('דניאל');
    });
  });

  describe('getNumberFromKeyEvent', () => {
    it('extracts number from standard direct key', () => {
      expect(getNumberFromKeyEvent({ key: '1' })).toBe(1);
      expect(getNumberFromKeyEvent({ key: '4' })).toBe(4);
      expect(getNumberFromKeyEvent({ key: '9' })).toBe(9);
    });

    it('extracts number from macOS Hebrew layout where key is a symbol/nikkud but code is DigitX', () => {
      // On Mac with Hebrew keyboard: key 1 -> '!', key 2 -> '@', key 3 -> '#', key 4 -> '$'
      expect(getNumberFromKeyEvent({ key: '!', code: 'Digit1' })).toBe(1);
      expect(getNumberFromKeyEvent({ key: '@', code: 'Digit2' })).toBe(2);
      expect(getNumberFromKeyEvent({ key: '#', code: 'Digit3' })).toBe(3);
      expect(getNumberFromKeyEvent({ key: '$', code: 'Digit4' })).toBe(4);
    });

    it('extracts number from Numpad even when NumLock is off', () => {
      // Numpad with NumLock off: key is 'End', 'Down', etc.
      expect(getNumberFromKeyEvent({ key: 'End', code: 'Numpad1' })).toBe(1);
      expect(getNumberFromKeyEvent({ key: 'Down', code: 'Numpad2' })).toBe(2);
      expect(getNumberFromKeyEvent({ key: 'PageDown', code: 'Numpad3' })).toBe(3);
      expect(getNumberFromKeyEvent({ key: 'Left', code: 'Numpad4' })).toBe(4);
    });

    it('extracts number from legacy keyCode fallback', () => {
      expect(getNumberFromKeyEvent({ keyCode: 49 })).toBe(1); // '1'
      expect(getNumberFromKeyEvent({ keyCode: 52 })).toBe(4); // '4'
      expect(getNumberFromKeyEvent({ keyCode: 97 })).toBe(1); // Numpad 1
      expect(getNumberFromKeyEvent({ keyCode: 100 })).toBe(4); // Numpad 4
    });

    it('extracts number from Hebrew letter shortcuts א, ב, ג, ד', () => {
      expect(getNumberFromKeyEvent({ key: 'א' })).toBe(1);
      expect(getNumberFromKeyEvent({ key: 'ב' })).toBe(2);
      expect(getNumberFromKeyEvent({ key: 'ג' })).toBe(3);
      expect(getNumberFromKeyEvent({ key: 'ד' })).toBe(4);
    });

    it('returns null for non-digit keys', () => {
      expect(getNumberFromKeyEvent({ key: 'Enter', code: 'Enter' })).toBeNull();
      expect(getNumberFromKeyEvent({ key: 'a', code: 'KeyA' })).toBeNull();
      expect(getNumberFromKeyEvent({ key: '0', code: 'Digit0' })).toBeNull();
    });
  });
});
