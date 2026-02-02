/**
 * Question Mapping Tests
 * BizHealth.ai LIL Pipeline
 */

import { describe, test, expect } from 'vitest';
import {
  LIL_QUESTION_MAPPING,
  getQuestionsByCategory,
  getQuestionsByChapter,
  getQuestionById,
  CATEGORY_CODES,
  CHAPTER_CODES
} from '../../data/question-category-mapping-lil.js';
import { LIL_PIPELINE_CONFIG } from '../../config/lil-pipeline.config.js';

describe('LIL Pipeline Question Mapping', () => {

  describe('Total Question Count', () => {
    test('should have exactly 45 questions', () => {
      expect(LIL_QUESTION_MAPPING.length).toBe(45);
    });

    test('should match pipeline configuration', () => {
      expect(LIL_QUESTION_MAPPING.length).toBe(LIL_PIPELINE_CONFIG.totalQuestions);
    });
  });

  describe('Question ID Coverage', () => {
    test('should cover all question IDs from LQ001 to LQ045', () => {
      const questionIds = LIL_QUESTION_MAPPING.map(q => q.questionId);
      for (let i = 1; i <= 45; i++) {
        const expectedId = `LQ${String(i).padStart(3, '0')}`;
        expect(questionIds).toContain(expectedId);
      }
    });

    test('should have no duplicate question IDs', () => {
      const questionIds = LIL_QUESTION_MAPPING.map(q => q.questionId);
      const uniqueIds = new Set(questionIds);
      expect(uniqueIds.size).toBe(questionIds.length);
    });

    test('should have sequential question numbers', () => {
      const sorted = [...LIL_QUESTION_MAPPING].sort((a, b) => a.questionNumber - b.questionNumber);
      sorted.forEach((q, index) => {
        expect(q.questionNumber).toBe(index + 1);
      });
    });
  });

  describe('Category Coverage', () => {
    test('should have all 12 categories represented', () => {
      const categories = new Set(LIL_QUESTION_MAPPING.map(q => q.categoryCode));
      expect(categories.size).toBe(12);
      CATEGORY_CODES.forEach(code => {
        expect(categories.has(code)).toBe(true);
      });
    });

    // Individual category counts (CORRECTED VALUES)
    const expectedCounts: Record<string, number> = {
      STR: 4, SAL: 6, MKT: 5, CXP: 3,  // Growth Engine: 18
      OPS: 4, FIN: 7,                   // Performance & Health: 11
      HRS: 3, LDG: 2,                   // People & Leadership: 5
      TIN: 4, ITD: 2, RMS: 3, CMP: 2   // Resilience & Safeguards: 11
    };

    Object.entries(expectedCounts).forEach(([category, expectedCount]) => {
      test(`${category} should have ${expectedCount} questions`, () => {
        const questions = getQuestionsByCategory(category as any);
        expect(questions.length).toBe(expectedCount);
      });
    });
  });

  describe('Chapter Distribution', () => {
    test('Growth Engine (GE) should have 18 questions', () => {
      const questions = getQuestionsByChapter('GE');
      expect(questions.length).toBe(18);
    });

    test('Performance & Health (PH) should have 11 questions', () => {
      const questions = getQuestionsByChapter('PH');
      expect(questions.length).toBe(11);
    });

    test('People & Leadership (PL) should have 5 questions', () => {
      const questions = getQuestionsByChapter('PL');
      expect(questions.length).toBe(5);
    });

    test('Resilience & Safeguards (RS) should have 11 questions', () => {
      const questions = getQuestionsByChapter('RS');
      expect(questions.length).toBe(11);
    });
  });

  describe('Critical Corrections (Feb 2026)', () => {
    test('Marketing should have exactly 5 questions (not 9)', () => {
      const mktQuestions = getQuestionsByCategory('MKT');
      expect(mktQuestions.length).toBe(5);
      expect(mktQuestions.map(q => q.questionId)).toEqual([
        'LQ011', 'LQ012', 'LQ013', 'LQ014', 'LQ015'
      ]);
    });

    test('Compliance should have exactly 2 questions (not 8)', () => {
      const cmpQuestions = getQuestionsByCategory('CMP');
      expect(cmpQuestions.length).toBe(2);
      expect(cmpQuestions.map(q => q.questionId)).toEqual([
        'LQ044', 'LQ045'
      ]);
    });
  });

  describe('Question Properties', () => {
    test('all questions should have required properties', () => {
      LIL_QUESTION_MAPPING.forEach(q => {
        expect(q.questionId).toBeDefined();
        expect(q.questionNumber).toBeDefined();
        expect(q.categoryCode).toBeDefined();
        expect(q.chapterCode).toBeDefined();
        expect(q.questionText).toBeDefined();
        expect(q.responseType).toBeDefined();
        expect(q.weight).toBeGreaterThan(0);
        expect(typeof q.benchmarkable).toBe('boolean');
      });
    });

    test('weights should be between 0.5 and 2.0', () => {
      LIL_QUESTION_MAPPING.forEach(q => {
        expect(q.weight).toBeGreaterThanOrEqual(0.5);
        expect(q.weight).toBeLessThanOrEqual(2.0);
      });
    });
  });

  describe('getQuestionById', () => {
    test('should return correct question for valid ID', () => {
      const question = getQuestionById('LQ001');
      expect(question).toBeDefined();
      expect(question?.questionNumber).toBe(1);
      expect(question?.categoryCode).toBe('STR');
    });

    test('should return undefined for invalid ID', () => {
      const question = getQuestionById('LQ999');
      expect(question).toBeUndefined();
    });
  });

  describe('Chapter Totals Verification', () => {
    test('all chapter question counts should sum to 45', () => {
      const geCount = getQuestionsByChapter('GE').length;
      const phCount = getQuestionsByChapter('PH').length;
      const plCount = getQuestionsByChapter('PL').length;
      const rsCount = getQuestionsByChapter('RS').length;

      expect(geCount + phCount + plCount + rsCount).toBe(45);
    });
  });
});
