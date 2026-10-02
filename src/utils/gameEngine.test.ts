import { describe, expect, it } from 'vitest';
import type { Person } from '../types/person';
import {
  buildQuestionQueue,
  evaluateAnswer,
  generateQuestionOptions,
  getDistractors,
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

  it('builds question queue with clamped count', () => {
    const queue5 = buildQuestionQueue(mockPeople, 3);
    expect(queue5).toHaveLength(3);

    const queueAll = buildQuestionQueue(mockPeople, -1);
    expect(queueAll).toHaveLength(5);

    const queueOverflow = buildQuestionQueue(mockPeople, 100);
    expect(queueOverflow).toHaveLength(5);
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
});
