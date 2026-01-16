/**
 * Unit tests for SECTION_MAPPINGS configuration
 */

import { SECTION_MAPPINGS, getSectionMapping, getComprehensiveTitle, getReference } from '../section-mapping';

describe('SECTION_MAPPINGS Configuration', () => {

  describe('Structure Validation', () => {
    test('should have at least one mapping', () => {
      expect(SECTION_MAPPINGS.length).toBeGreaterThan(0);
    });

    test('each mapping should have all required fields', () => {
      SECTION_MAPPINGS.forEach(mapping => {
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
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('all comprehensive anchors should be unique', () => {
      const anchors = SECTION_MAPPINGS.map(m => m.comprehensiveAnchor);
      const uniqueAnchors = new Set(anchors);
      expect(uniqueAnchors.size).toBe(anchors.length);
    });

    test('all comprehensive section titles should be unique', () => {
      const titles = SECTION_MAPPINGS.map(m => m.comprehensiveSectionTitle);
      const uniqueTitles = new Set(titles);
      expect(uniqueTitles.size).toBe(titles.length);
    });
  });

  describe('Format Validation', () => {
    test('anchor IDs should be kebab-case', () => {
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
      const requiredSections = ['executive-summary', 'strategic-recommendations', 'risk-assessment', 'roadmap', 'financial-impact'];
      const mappingIds = SECTION_MAPPINGS.map(m => m.id);
      requiredSections.forEach(required => {
        expect(mappingIds).toContain(required);
      });
    });

    test('should include all four chapter deep dives', () => {
      const chapterMappings = SECTION_MAPPINGS.filter(m => m.comprehensiveSectionTitle.includes('Deep Dive'));
      expect(chapterMappings.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Helper Functions', () => {
    test('getSectionMapping returns mapping for valid ID', () => {
      const mapping = getSectionMapping('executive-summary');
      expect(mapping).toBeDefined();
      expect(mapping?.id).toBe('executive-summary');
    });

    test('getSectionMapping returns undefined for invalid ID', () => {
      expect(getSectionMapping('invalid-id')).toBeUndefined();
    });

    test('getComprehensiveTitle returns title for valid ID', () => {
      expect(getComprehensiveTitle('executive-summary')).toBe('Executive Summary');
    });

    test('getComprehensiveTitle returns empty string for invalid ID', () => {
      expect(getComprehensiveTitle('invalid-id')).toBe('');
    });

    test('getReference returns formatted reference for valid ID', () => {
      const ref = getReference('executive-summary');
      expect(ref).toContain('Executive Summary');
      expect(ref).toContain('Comprehensive Report');
    });

    test('getReference returns empty string for invalid ID', () => {
      expect(getReference('invalid-id')).toBe('');
    });
  });
});
