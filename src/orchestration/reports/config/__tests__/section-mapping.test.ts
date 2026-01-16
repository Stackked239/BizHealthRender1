/**
 * Unit tests for SECTION_MAPPINGS configuration
 * Ensures config integrity and prevents accidental duplicates
 *
 * Run with: npm run test:mappings
 */

import { describe, test, expect } from 'vitest';
import { SECTION_MAPPINGS, getSectionMapping, getComprehensiveTitle, getReference } from '../section-mapping.js';

describe('SECTION_MAPPINGS Configuration', () => {

  describe('Structure Validation', () => {

    test('should have at least one mapping', () => {
      expect(SECTION_MAPPINGS.length).toBeGreaterThan(0);
    });

    test('each mapping should have all required fields', () => {
      SECTION_MAPPINGS.forEach((mapping) => {
        expect(mapping.id).toBeDefined();
        expect(mapping.id.length).toBeGreaterThan(0);
        expect(mapping.ownerLabel).toBeDefined();
        expect(mapping.ownerLabel.length).toBeGreaterThan(0);
        expect(mapping.comprehensiveSectionTitle).toBeDefined();
        expect(mapping.comprehensiveSectionTitle.length).toBeGreaterThan(0);
        expect(mapping.comprehensiveAnchor).toBeDefined();
        expect(mapping.comprehensiveAnchor.length).toBeGreaterThan(0);
      });
    });

  });

  describe('Uniqueness Validation', () => {

    test('all mapping IDs should be unique', () => {
      const ids = SECTION_MAPPINGS.map(m => m.id);
      const uniqueIds = new Set(ids);

      if (uniqueIds.size !== ids.length) {
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        throw new Error(`Duplicate mapping IDs found: ${[...new Set(duplicates)].join(', ')}`);
      }

      expect(uniqueIds.size).toBe(ids.length);
    });

    test('all comprehensive anchors should be unique', () => {
      const anchors = SECTION_MAPPINGS.map(m => m.comprehensiveAnchor);
      const uniqueAnchors = new Set(anchors);

      if (uniqueAnchors.size !== anchors.length) {
        const duplicates = anchors.filter((anchor, index) => anchors.indexOf(anchor) !== index);
        throw new Error(`Duplicate anchors found: ${[...new Set(duplicates)].join(', ')}`);
      }

      expect(uniqueAnchors.size).toBe(anchors.length);
    });

    test('all comprehensive section titles should be unique', () => {
      const titles = SECTION_MAPPINGS.map(m => m.comprehensiveSectionTitle);
      const uniqueTitles = new Set(titles);

      if (uniqueTitles.size !== titles.length) {
        const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);
        throw new Error(`Duplicate section titles found: ${[...new Set(duplicates)].join(', ')}`);
      }

      expect(uniqueTitles.size).toBe(titles.length);
    });

  });

  describe('Format Validation', () => {

    test('anchor IDs should be kebab-case (lowercase with hyphens)', () => {
      const kebabCasePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

      SECTION_MAPPINGS.forEach(mapping => {
        expect(mapping.comprehensiveAnchor).toMatch(kebabCasePattern);
      });
    });

    test('mapping IDs should be kebab-case', () => {
      const kebabCasePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

      SECTION_MAPPINGS.forEach(mapping => {
        expect(mapping.id).toMatch(kebabCasePattern);
      });
    });

    test('section titles should not have leading/trailing whitespace', () => {
      SECTION_MAPPINGS.forEach(mapping => {
        expect(mapping.comprehensiveSectionTitle).toBe(mapping.comprehensiveSectionTitle.trim());
        expect(mapping.ownerLabel).toBe(mapping.ownerLabel.trim());
      });
    });

  });

  describe('Content Validation', () => {

    test('should include essential report sections', () => {
      const requiredSections = [
        'executive-summary',
        'strategic-recommendations',
        'risk-assessment',
        'roadmap',
        'financial-impact'
      ];

      const mappingIds = SECTION_MAPPINGS.map(m => m.id);

      requiredSections.forEach(required => {
        expect(mappingIds).toContain(required);
      });
    });

    test('should include all four chapter deep dives', () => {
      const chapterMappings = SECTION_MAPPINGS.filter(m =>
        m.comprehensiveSectionTitle.includes('Deep Dive')
      );

      expect(chapterMappings.length).toBeGreaterThanOrEqual(4);
    });

  });

  describe('Helper Functions', () => {

    test('getSectionMapping should return mapping for valid ID', () => {
      const mapping = getSectionMapping('executive-summary');
      expect(mapping).toBeDefined();
      expect(mapping?.id).toBe('executive-summary');
    });

    test('getSectionMapping should return undefined for invalid ID', () => {
      const mapping = getSectionMapping('invalid-id');
      expect(mapping).toBeUndefined();
    });

    test('getComprehensiveTitle should return title for valid ID', () => {
      const title = getComprehensiveTitle('executive-summary');
      expect(title).toBe('Executive Summary');
    });

    test('getComprehensiveTitle should return empty string for invalid ID', () => {
      const title = getComprehensiveTitle('invalid-id');
      expect(title).toBe('');
    });

    test('getReference should return formatted reference for valid ID', () => {
      const ref = getReference('executive-summary');
      expect(ref).toContain('Executive Summary');
      expect(ref).toContain('Comprehensive Report');
    });

    test('getReference should return empty string for invalid ID', () => {
      const ref = getReference('invalid-id');
      expect(ref).toBe('');
    });

  });

});
