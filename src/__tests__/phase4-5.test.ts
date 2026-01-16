import { describe, it, expect, beforeAll } from 'vitest';
import { executePhase4_5A } from '../orchestration/phase4-5a-orchestrator.js';
import { validateBLUF, validatePhase4_5A_Output } from '../orchestration/phase4-5-validation.js';
import { renderBLUFForReport } from '../orchestration/phase4-5b-renderer.js';
import type { IDM } from '../types/idm.types.js';
import type { Phase4_5A_Output } from '../types/phase4-5.types.js';
import fs from 'fs/promises';
import path from 'path';

describe('Phase 4.5: BLUF Generation & Rendering', () => {
  let sampleIDM: IDM;
  let phase45Output: Phase4_5A_Output;

  beforeAll(async () => {
    // Load sample IDM from fixtures
    const idmPath = path.join(__dirname, '../qa/fixtures/phase4/sample_idm.json');
    const idmData = await fs.readFile(idmPath, 'utf-8');
    sampleIDM = JSON.parse(idmData);
  });

  describe('Phase 4.5A: BLUF Generation', () => {
    it('should generate all 29 BLUFs', async () => {
      phase45Output = await executePhase4_5A(sampleIDM, {
        apiKey: process.env.ANTHROPIC_API_KEY,
        useCache: false
      });

      expect(phase45Output.meta.total_blufs_generated).toBe(29);
    }, 120000); // 2 minute timeout for API calls

    it('should pass validation', () => {
      const validation = validatePhase4_5A_Output(phase45Output);
      expect(validation.isValid).toBe(true);
      expect(validation.summary.failed_validation).toBe(0);
    });

    it('executive BLUFs should have 2-4 paragraphs', () => {
      expect(phase45Output.executive_blufs.comprehensive_report.paragraph_count).toBeGreaterThanOrEqual(2);
      expect(phase45Output.executive_blufs.comprehensive_report.paragraph_count).toBeLessThanOrEqual(4);
      expect(phase45Output.executive_blufs.owner_report.paragraph_count).toBeGreaterThanOrEqual(2);
      expect(phase45Output.executive_blufs.owner_report.paragraph_count).toBeLessThanOrEqual(4);
    });

    it('section BLUFs should have 1-2 paragraphs', () => {
      const chapterBLUF = phase45Output.chapter_blufs.GE;
      expect(chapterBLUF.paragraph_count).toBeGreaterThanOrEqual(1);
      expect(chapterBLUF.paragraph_count).toBeLessThanOrEqual(2);
    });

    it('executive BLUFs should be 150-300 words', () => {
      const compBLUF = phase45Output.executive_blufs.comprehensive_report;
      expect(compBLUF.total_word_count).toBeGreaterThanOrEqual(150);
      expect(compBLUF.total_word_count).toBeLessThanOrEqual(300);
    });

    it('section BLUFs should be 50-150 words', () => {
      const chapterBLUF = phase45Output.chapter_blufs.GE;
      expect(chapterBLUF.total_word_count).toBeGreaterThanOrEqual(50);
      expect(chapterBLUF.total_word_count).toBeLessThanOrEqual(150);
    });

    it('all BLUFs should contain quantitative evidence', () => {
      const allBLUFs = [
        phase45Output.executive_blufs.comprehensive_report,
        phase45Output.executive_blufs.owner_report,
        ...Object.values(phase45Output.chapter_blufs)
      ];

      for (const bluf of allBLUFs) {
        expect(bluf.full_text).toMatch(/\d+/); // Contains numbers
      }
    });

    it('should not contain placeholder text', () => {
      const allBLUFs = [
        phase45Output.executive_blufs.comprehensive_report,
        phase45Output.executive_blufs.owner_report,
        ...Object.values(phase45Output.chapter_blufs)
      ];

      for (const bluf of allBLUFs) {
        expect(bluf.full_text.toLowerCase()).not.toContain('lorem ipsum');
        expect(bluf.full_text.toLowerCase()).not.toContain('tbd');
        expect(bluf.full_text.toLowerCase()).not.toContain('todo');
      }
    });

    it('comprehensive BLUF should reference company name', () => {
      const companyName = sampleIDM.company_profile.basic_information.company_name;
      const blufText = phase45Output.executive_blufs.comprehensive_report.full_text;
      expect(blufText).toContain(companyName);
    });

    it('should have quality scores above 70', () => {
      if (phase45Output.meta.average_quality_score) {
        expect(phase45Output.meta.average_quality_score).toBeGreaterThanOrEqual(70);
      }
    });
  });

  describe('Phase 4.5B: BLUF Rendering', () => {
    it('should render comprehensive BLUF HTML', () => {
      const html = renderBLUFForReport(
        {
          idm: sampleIDM,
          phase45Output,
          reportType: 'comprehensive'
        },
        'comprehensive_report'
      );

      expect(html).toContain('bluf-summary');
      expect(html).toContain('executive-bluf');
      expect(html).toContain('<p>');
    });

    it('should render chapter BLUF HTML', () => {
      const html = renderBLUFForReport(
        {
          idm: sampleIDM,
          phase45Output,
          reportType: 'comprehensive'
        },
        'chapter_GE'
      );

      expect(html).toContain('bluf-summary');
      expect(html).toContain('section-bluf');
    });

    it('should escape HTML in content', () => {
      const html = renderBLUFForReport(
        {
          idm: sampleIDM,
          phase45Output,
          reportType: 'comprehensive'
        },
        'comprehensive_report'
      );

      // Should not contain unescaped HTML tags within content
      expect(html).not.toMatch(/<p>.*<script/);
    });
  });
});
