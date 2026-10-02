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
});
