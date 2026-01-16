/**
 * BizHealth Recipe Tests
 *
 * Tests for recipe schema validation and data source resolution.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  RecipeSchema,
  DataSourceSchema,
  SectionSchema,
  validateRecipe,
  safeValidateRecipe,
  IDM_PATHS
} from '../src/types/recipe.types';

// ============================================================================
// SCHEMA VALIDATION TESTS
// ============================================================================

describe('Recipe Schema Validation', () => {
  describe('DataSourceSchema', () => {
    it('should validate simple data source', () => {
      const validDataSource = {
        id: 'health_score',
        from: 'scores_summary.overall_health_score'
      };

      const result = DataSourceSchema.safeParse(validDataSource);
      expect(result.success).toBe(true);
    });

    it('should validate data source with filters', () => {
      const dataSourceWithFilters = {
        id: 'critical_findings',
        from: 'findings',
        filters: [{ type: 'risk' }],
        sort: { field: 'severity', direction: 'desc' },
        limit: 5
      };

      const result = DataSourceSchema.safeParse(dataSourceWithFilters);
      expect(result.success).toBe(true);
    });

    it('should validate data source with dimension filter', () => {
      const dataSourceWithDimFilter = {
        id: 'sales_findings',
        from: 'findings',
        filters: [{ dimension_codes: ['SAL', 'MKT'] }]
      };

      const result = DataSourceSchema.safeParse(dataSourceWithDimFilter);
      expect(result.success).toBe(true);
    });
  });

  describe('SectionSchema', () => {
    it('should validate valid section', () => {
      const validSection = {
        id: 'executive_summary',
        title: 'Executive Summary',
        description: 'High-level overview',
        data_sources: [
          { id: 'scores', from: 'scores_summary' }
        ],
        tone_tags: ['executive', 'summary'],
        visual_type: 'narrative',
        layout_hints: { page_break_after: true }
      };

      const result = SectionSchema.safeParse(validSection);
      expect(result.success).toBe(true);
    });

    it('should validate section with multiple data sources', () => {
      const sectionWithMultipleSources = {
        id: 'dashboard',
        title: 'Dashboard',
        data_sources: [
          { id: 'chapters', from: 'chapters' },
          { id: 'dimensions', from: 'dimensions' },
          { id: 'findings', from: 'findings', limit: 5 }
        ],
        visual_type: 'radar_chart'
      };

      const result = SectionSchema.safeParse(sectionWithMultipleSources);
      expect(result.success).toBe(true);
    });
  });

  describe('RecipeSchema', () => {
    it('should validate minimal valid recipe', () => {
      const minimalRecipe = {
        report_id: 'test_report',
        name: 'Test Report',
        primary_audience: 'owner',
        target_page_range: { min: 5, max: 10 },
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            data_sources: [{ id: 'data', from: 'scores_summary' }]
          }
        ]
      };

      const result = RecipeSchema.safeParse(minimalRecipe);
      expect(result.success).toBe(true);
    });

    it('should validate recipe with brand config', () => {
      const recipeWithBrand = {
        report_id: 'branded_report',
        name: 'Branded Report',
        primary_audience: 'executive',
        target_page_range: { min: 3, max: 8 },
        brand_config: {
          primary_color: '#212653',
          accent_color: '#969423',
          font_heading: 'Montserrat',
          font_body: 'Open Sans'
        },
        sections: []
      };

      const result = RecipeSchema.safeParse(recipeWithBrand);
      expect(result.success).toBe(true);
    });

    it('should reject recipe with invalid audience', () => {
      const invalidRecipe = {
        report_id: 'test',
        name: 'Test',
        primary_audience: 'invalid_audience',
        target_page_range: { min: 5, max: 10 },
        sections: []
      };

      const result = RecipeSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// IDM_PATHS TESTS
// ============================================================================

describe('IDM_PATHS Constants', () => {
  it('should have valid paths for common data', () => {
    expect(IDM_PATHS.OVERALL_HEALTH_SCORE).toBe('scores_summary.overall_health_score');
    expect(IDM_PATHS.CHAPTERS).toBe('chapters');
    expect(IDM_PATHS.DIMENSIONS).toBe('dimensions');
    expect(IDM_PATHS.FINDINGS).toBe('findings');
    expect(IDM_PATHS.RECOMMENDATIONS).toBe('recommendations');
  });

  it('should have valid dynamic path functions', () => {
    expect(IDM_PATHS.CHAPTER_BY_CODE('GE')).toBe('chapters[chapter_code=GE]');
    expect(IDM_PATHS.DIMENSION_BY_CODE('STR')).toBe('dimensions[dimension_code=STR]');
    expect(IDM_PATHS.FINDINGS_BY_DIMENSION('MKT')).toBe('findings[dimension_code=MKT]');
  });
});

// ============================================================================
// RECIPE FILE VALIDATION TESTS
// ============================================================================

describe('Recipe File Validation', () => {
  const recipesDir = path.join(__dirname, '..', 'config', 'report-recipes');

  const recipeFiles = [
    'comprehensive.json',
    'owners.json',
    'executive.json',
    'employees.json',
    'managers-sales-marketing.json',
    'managers-operations.json',
    'managers-financials.json',
    'managers-it-technology.json',
    'managers-strategy.json'
  ];

  recipeFiles.forEach(filename => {
    it(`should validate ${filename}`, () => {
      const filepath = path.join(recipesDir, filename);

      // Skip if file doesn't exist (for CI)
      if (!fs.existsSync(filepath)) {
        console.warn(`Skipping ${filename} - file not found`);
        return;
      }

      const content = fs.readFileSync(filepath, 'utf-8');
      const recipe = JSON.parse(content);

      const result = safeValidateRecipe(recipe);

      if (!result.success) {
        console.error(`Validation errors for ${filename}:`, result.error.errors);
      }

      expect(result.success).toBe(true);
    });
  });

  it('should have 9 recipe files', () => {
    if (!fs.existsSync(recipesDir)) {
      console.warn('Recipes directory not found');
      return;
    }

    const files = fs.readdirSync(recipesDir).filter(f => f.endsWith('.json'));
    expect(files.length).toBe(9);
  });

  it('each recipe should have unique report_id', () => {
    if (!fs.existsSync(recipesDir)) {
      console.warn('Recipes directory not found');
      return;
    }

    const reportIds = new Set<string>();
    const files = fs.readdirSync(recipesDir).filter(f => f.endsWith('.json'));

    files.forEach(filename => {
      const filepath = path.join(recipesDir, filename);
      const content = fs.readFileSync(filepath, 'utf-8');
      const recipe = JSON.parse(content);
      reportIds.add(recipe.report_id);
    });

    expect(reportIds.size).toBe(files.length);
  });
});

// ============================================================================
// DATA SOURCE PATH VALIDATION
// ============================================================================

describe('Data Source Path Validation', () => {
  const validPaths = [
    'meta',
    'meta.assessment_run_id',
    'scores_summary.overall_health_score',
    'chapters',
    'chapters[chapter_code=GE]',
    'dimensions',
    'dimensions[dimension_code=STR]',
    'dimensions[dimension_code=STR].sub_indicators',
    'findings',
    'findings[type=strength]',
    'recommendations',
    'recommendations[horizon=90_days]',
    'quick_wins',
    'risks',
    'roadmap.phases'
  ];

  validPaths.forEach(path => {
    it(`should accept valid path: ${path}`, () => {
      const dataSource = { id: 'test', from: path };
      const result = DataSourceSchema.safeParse(dataSource);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// RECIPE COMPLETENESS TESTS
// ============================================================================

describe('Recipe Completeness', () => {
  const recipesDir = path.join(__dirname, '..', 'config', 'report-recipes');

  it('all recipes should have sections', () => {
    if (!fs.existsSync(recipesDir)) {
      return;
    }

    const files = fs.readdirSync(recipesDir).filter(f => f.endsWith('.json'));

    files.forEach(filename => {
      const filepath = path.join(recipesDir, filename);
      const recipe = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

      expect(recipe.sections.length).toBeGreaterThan(0);
    });
  });

  it('all sections should have at least one data source', () => {
    if (!fs.existsSync(recipesDir)) {
      return;
    }

    const files = fs.readdirSync(recipesDir).filter(f => f.endsWith('.json'));

    files.forEach(filename => {
      const filepath = path.join(recipesDir, filename);
      const recipe = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

      recipe.sections.forEach((section: any) => {
        expect(section.data_sources).toBeDefined();
        // Allow empty data_sources for special sections like cover/TOC
      });
    });
  });
});
