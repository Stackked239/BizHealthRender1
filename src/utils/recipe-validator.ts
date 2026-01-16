/**
 * Recipe Validator Utility
 * Validates report recipe configurations against schema requirements
 * and checks component data bindings against sample IDM data.
 */

import { JSONPath } from 'jsonpath-plus';

/**
 * Performance status levels
 */
export type PerformanceStatus = 'ok' | 'warning' | 'error';

/**
 * Validation result for a single component
 */
export interface ComponentValidationResult {
  component_id: string;
  type: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  data_resolved: boolean;
  fallback_used: boolean;
}

/**
 * Complete validation result for a recipe
 */
export interface ValidationResult {
  recipe_id: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  component_count: number;
  performance_status: PerformanceStatus;
  components: ComponentValidationResult[];
  data_requirements_met: boolean;
  accessibility_compliant: boolean;
}

/**
 * Recipe schema structure
 */
interface RecipeVisuals {
  version: string;
  schema_version: string;
  global_settings: {
    brand_colors: boolean;
    accessibility_symbols: boolean;
    print_optimized: boolean;
    show_benchmarks: boolean;
    style_modifiers?: Record<string, boolean>;
    jsonpath_config?: {
      library: string;
      strict_mode: boolean;
      log_path_resolution: boolean;
      null_handling: string;
    };
  };
  data_requirements: {
    required_fields: Array<{
      path: string;
      type: string;
      min_length?: number;
    }>;
    optional_fields: Array<{
      path: string;
      type: string;
      default: unknown;
      hide_component_if_null?: boolean;
    }>;
    validation_mode: string;
  };
  performance_budgets: {
    components: {
      per_report: { warning_threshold: number; error_threshold: number };
      per_section: { warning_threshold: number; error_threshold: number };
    };
    rendering: {
      target_time_ms: number;
      warning_time_ms: number;
      max_time_ms: number;
    };
    output: {
      max_file_size_kb: number;
      warning_file_size_kb: number;
      max_embedded_images: number;
    };
  };
  accessibility_requirements: {
    compliance_level: string;
    validation_required: boolean;
    color_requirements: {
      min_contrast_normal_text: number;
      colorblind_safe: boolean;
      never_color_alone: boolean;
      status_symbols: Record<string, { symbol: string; aria_label: string }>;
    };
    screen_reader_requirements: {
      all_charts_have_aria_label: boolean;
      provide_data_tables_for_charts: boolean;
    };
  };
  components: Array<{
    type: string;
    id: string;
    section: string;
    order: number;
    config: Record<string, unknown>;
    data_binding: {
      primary_path: string;
      fallback_path?: string | null;
      default_value: unknown;
      [key: string]: unknown;
    };
    conditional?: {
      render_if: string;
      fallback_message?: string;
      hide_if_null?: boolean;
    };
    accessibility?: {
      aria_label: string;
    };
  }>;
}

interface Recipe {
  report_id: string;
  name: string;
  version: string;
  visuals?: RecipeVisuals;
  sections?: Array<{
    id: string;
    title: string;
    visual_type?: string;
  }>;
}

/**
 * Validates a recipe configuration against the schema and sample IDM data
 */
export function validateRecipe(recipe: Recipe, sampleIdm?: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const componentResults: ComponentValidationResult[] = [];

  // Check if recipe has visuals block
  if (!recipe.visuals) {
    errors.push('Recipe is missing the "visuals" configuration block');
    return {
      recipe_id: recipe.report_id,
      valid: false,
      errors,
      warnings,
      component_count: 0,
      performance_status: 'error',
      components: [],
      data_requirements_met: false,
      accessibility_compliant: false,
    };
  }

  const visuals = recipe.visuals;

  // Validate version
  if (!visuals.version) {
    errors.push('Missing visuals.version');
  }

  if (!visuals.schema_version) {
    errors.push('Missing visuals.schema_version');
  }

  // Validate global settings
  if (!visuals.global_settings) {
    errors.push('Missing visuals.global_settings');
  } else {
    if (visuals.global_settings.brand_colors === undefined) {
      warnings.push('global_settings.brand_colors not specified');
    }
    if (visuals.global_settings.accessibility_symbols === undefined) {
      warnings.push('global_settings.accessibility_symbols not specified');
    }
  }

  // Validate data requirements
  let dataRequirementsMet = true;
  if (!visuals.data_requirements) {
    warnings.push('Missing visuals.data_requirements');
  } else {
    // Check required fields against sample data
    if (sampleIdm && visuals.data_requirements.required_fields) {
      for (const field of visuals.data_requirements.required_fields) {
        try {
          const result = JSONPath({ path: field.path, json: sampleIdm });
          if (!result || result.length === 0) {
            if (visuals.data_requirements.validation_mode === 'strict') {
              errors.push(`Required field not found: ${field.path}`);
              dataRequirementsMet = false;
            } else {
              warnings.push(`Required field not found: ${field.path}`);
            }
          } else if (field.min_length !== undefined && Array.isArray(result[0])) {
            if (result[0].length < field.min_length) {
              warnings.push(`Field ${field.path} has ${result[0].length} items, expected at least ${field.min_length}`);
            }
          }
        } catch (e) {
          warnings.push(`Invalid JSONPath expression: ${field.path}`);
        }
      }
    }
  }

  // Validate performance budgets
  let performanceStatus: PerformanceStatus = 'ok';
  if (!visuals.performance_budgets) {
    warnings.push('Missing visuals.performance_budgets');
  }

  // Validate accessibility requirements
  let accessibilityCompliant = true;
  if (!visuals.accessibility_requirements) {
    warnings.push('Missing visuals.accessibility_requirements');
    accessibilityCompliant = false;
  } else {
    if (visuals.accessibility_requirements.compliance_level !== 'WCAG_2.1_AA') {
      warnings.push(`Non-standard accessibility compliance level: ${visuals.accessibility_requirements.compliance_level}`);
    }
    if (!visuals.accessibility_requirements.color_requirements?.status_symbols) {
      warnings.push('Missing status_symbols for accessibility');
      accessibilityCompliant = false;
    }
  }

  // Validate components
  if (!visuals.components || !Array.isArray(visuals.components)) {
    errors.push('Missing or invalid visuals.components array');
  } else {
    const componentIds = new Set<string>();

    for (const component of visuals.components) {
      const componentResult: ComponentValidationResult = {
        component_id: component.id || 'unknown',
        type: component.type || 'unknown',
        valid: true,
        errors: [],
        warnings: [],
        data_resolved: false,
        fallback_used: false,
      };

      // Check required component fields
      if (!component.id) {
        componentResult.errors.push('Component missing id');
        componentResult.valid = false;
      } else if (componentIds.has(component.id)) {
        componentResult.errors.push(`Duplicate component id: ${component.id}`);
        componentResult.valid = false;
      } else {
        componentIds.add(component.id);
      }

      if (!component.type) {
        componentResult.errors.push('Component missing type');
        componentResult.valid = false;
      }

      if (!component.section) {
        componentResult.errors.push('Component missing section');
        componentResult.valid = false;
      }

      if (component.order === undefined) {
        componentResult.warnings.push('Component missing order');
      }

      // Validate data binding
      if (!component.data_binding) {
        componentResult.errors.push('Component missing data_binding');
        componentResult.valid = false;
      } else {
        if (!component.data_binding.primary_path && !('metrics' in component.data_binding)) {
          componentResult.errors.push('data_binding missing primary_path');
          componentResult.valid = false;
        }

        // Test JSONPath against sample data
        if (sampleIdm && component.data_binding.primary_path) {
          try {
            const result = JSONPath({
              path: component.data_binding.primary_path,
              json: sampleIdm
            });

            if (result && result.length > 0 && result[0] !== undefined) {
              componentResult.data_resolved = true;
            } else if (component.data_binding.fallback_path) {
              // Try fallback
              const fallbackResult = JSONPath({
                path: component.data_binding.fallback_path,
                json: sampleIdm
              });
              if (fallbackResult && fallbackResult.length > 0) {
                componentResult.data_resolved = true;
                componentResult.fallback_used = true;
              }
            }

            if (!componentResult.data_resolved && component.data_binding.default_value === undefined) {
              componentResult.warnings.push(`No data found for ${component.data_binding.primary_path} and no default_value specified`);
            }
          } catch (e) {
            componentResult.warnings.push(`Invalid JSONPath: ${component.data_binding.primary_path}`);
          }
        }
      }

      // Validate accessibility
      if (visuals.accessibility_requirements?.screen_reader_requirements?.all_charts_have_aria_label) {
        const chartTypes = ['bar_chart', 'radar_chart', 'gauge', 'funnel', 'waterfall', 'heatmap', 'sparkline'];
        if (chartTypes.includes(component.type) && !component.accessibility?.aria_label) {
          componentResult.warnings.push(`Chart component ${component.id} missing aria_label`);
          accessibilityCompliant = false;
        }
      }

      componentResults.push(componentResult);
    }

    // Check performance budgets
    if (visuals.performance_budgets?.components?.per_report) {
      const componentCount = visuals.components.length;
      if (componentCount >= visuals.performance_budgets.components.per_report.error_threshold) {
        errors.push(`Component count (${componentCount}) exceeds error threshold (${visuals.performance_budgets.components.per_report.error_threshold})`);
        performanceStatus = 'error';
      } else if (componentCount >= visuals.performance_budgets.components.per_report.warning_threshold) {
        warnings.push(`Component count (${componentCount}) exceeds warning threshold (${visuals.performance_budgets.components.per_report.warning_threshold})`);
        performanceStatus = 'warning';
      }
    }

    // Check per-section limits
    if (visuals.performance_budgets?.components?.per_section) {
      const sectionCounts: Record<string, number> = {};
      for (const comp of visuals.components) {
        if (comp.section) {
          sectionCounts[comp.section] = (sectionCounts[comp.section] || 0) + 1;
        }
      }

      for (const [section, count] of Object.entries(sectionCounts)) {
        if (count >= visuals.performance_budgets.components.per_section.error_threshold) {
          errors.push(`Section "${section}" has ${count} components, exceeds error threshold`);
          performanceStatus = 'error';
        } else if (count >= visuals.performance_budgets.components.per_section.warning_threshold) {
          warnings.push(`Section "${section}" has ${count} components, exceeds warning threshold`);
          if (performanceStatus === 'ok') {
            performanceStatus = 'warning';
          }
        }
      }
    }
  }

  // Aggregate component errors/warnings
  for (const comp of componentResults) {
    if (!comp.valid) {
      errors.push(`Component ${comp.component_id}: ${comp.errors.join(', ')}`);
    }
    if (comp.warnings.length > 0) {
      warnings.push(`Component ${comp.component_id}: ${comp.warnings.join(', ')}`);
    }
  }

  const isValid = errors.length === 0;

  return {
    recipe_id: recipe.report_id,
    valid: isValid,
    errors,
    warnings,
    component_count: visuals.components?.length || 0,
    performance_status: performanceStatus,
    components: componentResults,
    data_requirements_met: dataRequirementsMet,
    accessibility_compliant: accessibilityCompliant,
  };
}

/**
 * Validates all recipes in a directory
 */
export async function validateAllRecipes(
  recipes: Recipe[],
  sampleIdm?: unknown
): Promise<{ results: ValidationResult[]; summary: ValidationSummary }> {
  const results: ValidationResult[] = [];

  for (const recipe of recipes) {
    results.push(validateRecipe(recipe, sampleIdm));
  }

  const summary: ValidationSummary = {
    total: results.length,
    valid: results.filter(r => r.valid).length,
    invalid: results.filter(r => !r.valid).length,
    warnings: results.reduce((acc, r) => acc + r.warnings.length, 0),
    errors: results.reduce((acc, r) => acc + r.errors.length, 0),
    total_components: results.reduce((acc, r) => acc + r.component_count, 0),
    accessibility_compliant: results.filter(r => r.accessibility_compliant).length,
  };

  return { results, summary };
}

/**
 * Summary of all validations
 */
export interface ValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  warnings: number;
  errors: number;
  total_components: number;
  accessibility_compliant: number;
}

/**
 * Formats validation result for console output
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push(`\n=== Recipe: ${result.recipe_id} ===`);
  lines.push(`Status: ${result.valid ? 'VALID' : 'INVALID'}`);
  lines.push(`Components: ${result.component_count}`);
  lines.push(`Performance: ${result.performance_status.toUpperCase()}`);
  lines.push(`Accessibility: ${result.accessibility_compliant ? 'Compliant' : 'Non-compliant'}`);
  lines.push(`Data Requirements: ${result.data_requirements_met ? 'Met' : 'Not Met'}`);

  if (result.errors.length > 0) {
    lines.push('\nErrors:');
    for (const error of result.errors) {
      lines.push(`  - ${error}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('\nWarnings:');
    for (const warning of result.warnings) {
      lines.push(`  - ${warning}`);
    }
  }

  return lines.join('\n');
}

/**
 * Validates a JSONPath expression
 */
export function isValidJSONPath(path: string): boolean {
  try {
    // Test with an empty object - just checking syntax
    JSONPath({ path, json: {}, resultType: 'value' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts all JSONPath expressions from a recipe
 */
export function extractJSONPaths(recipe: Recipe): string[] {
  const paths: string[] = [];

  if (!recipe.visuals) return paths;

  // From data requirements
  if (recipe.visuals.data_requirements) {
    for (const field of recipe.visuals.data_requirements.required_fields || []) {
      paths.push(field.path);
    }
    for (const field of recipe.visuals.data_requirements.optional_fields || []) {
      paths.push(field.path);
    }
  }

  // From components
  for (const component of recipe.visuals.components || []) {
    if (component.data_binding?.primary_path) {
      paths.push(component.data_binding.primary_path);
    }
    if (component.data_binding?.fallback_path) {
      paths.push(component.data_binding.fallback_path);
    }
    if (component.data_binding?.benchmark_path) {
      paths.push(component.data_binding.benchmark_path as string);
    }
    // Handle metrics array in kpi_dashboard
    if (component.data_binding?.metrics && Array.isArray(component.data_binding.metrics)) {
      for (const metric of component.data_binding.metrics) {
        if (metric.path) {
          paths.push(metric.path);
        }
      }
    }
    // Handle conditional render_if
    if (component.conditional?.render_if && component.conditional.render_if !== 'true') {
      // render_if can contain JSONPath-like expressions
      const match = component.conditional.render_if.match(/\$\.[^\s]+/g);
      if (match) {
        paths.push(...match);
      }
    }
  }

  return [...new Set(paths)]; // Remove duplicates
}
