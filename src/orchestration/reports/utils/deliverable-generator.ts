/**
 * Deliverable Generator Utility
 *
 * Generates proper deliverable names from implementation step actions.
 * Fixes the "Completed: Conduct..." bug by stripping prefixes and
 * transforming action verbs into appropriate deliverable nouns.
 *
 * @module utils/deliverable-generator
 */

/**
 * Action verbs that can be transformed into deliverables
 */
const ACTION_VERBS = [
  'conduct',
  'develop',
  'implement',
  'monitor',
  'document',
  'optimize',
  'review',
  'align',
  'launch',
  'establish',
  'create',
  'build',
  'design',
  'execute',
  'prepare',
  'analyze',
  'assess',
  'evaluate',
  'define',
  'deploy',
  'integrate',
  'configure',
  'test',
  'validate',
  'update',
  'improve',
  'streamline',
  'automate',
  'standardize',
  'finalize',
] as const;

type ActionVerb = typeof ACTION_VERBS[number];

/**
 * Templates for generating deliverables from action verbs
 */
const DELIVERABLE_TEMPLATES: Record<ActionVerb, (subject: string) => string> = {
  conduct: (s) => `${capitalizeWords(s)} Report`,
  develop: (s) => `${capitalizeWords(s)} Plan`,
  implement: (s) => `${capitalizeWords(s)} Implementation Log`,
  monitor: () => 'Progress Tracking Dashboard',
  document: (s) => `${capitalizeWords(s)} Documentation`,
  optimize: (s) => `${capitalizeWords(s)} Optimization Plan`,
  review: (s) => `${capitalizeWords(s)} Review Summary`,
  align: (s) => `${capitalizeWords(s)} Alignment Framework`,
  launch: (s) => `${capitalizeWords(s)} Launch Checklist`,
  establish: (s) => `${capitalizeWords(s)} Framework`,
  create: (s) => `${capitalizeWords(s)} Artifact`,
  build: (s) => `${capitalizeWords(s)} Deliverable`,
  design: (s) => `${capitalizeWords(s)} Design Document`,
  execute: (s) => `${capitalizeWords(s)} Execution Report`,
  prepare: (s) => `${capitalizeWords(s)} Preparation Package`,
  analyze: (s) => `${capitalizeWords(s)} Analysis Report`,
  assess: (s) => `${capitalizeWords(s)} Assessment Report`,
  evaluate: (s) => `${capitalizeWords(s)} Evaluation Summary`,
  define: (s) => `${capitalizeWords(s)} Definition Document`,
  deploy: (s) => `${capitalizeWords(s)} Deployment Report`,
  integrate: (s) => `${capitalizeWords(s)} Integration Specification`,
  configure: (s) => `${capitalizeWords(s)} Configuration Guide`,
  test: (s) => `${capitalizeWords(s)} Test Results`,
  validate: (s) => `${capitalizeWords(s)} Validation Report`,
  update: (s) => `${capitalizeWords(s)} Update Log`,
  improve: (s) => `${capitalizeWords(s)} Improvement Plan`,
  streamline: (s) => `${capitalizeWords(s)} Efficiency Report`,
  automate: (s) => `${capitalizeWords(s)} Automation Specification`,
  standardize: (s) => `${capitalizeWords(s)} Standards Document`,
  finalize: (s) => `${capitalizeWords(s)} Final Report`,
};

/**
 * Patterns indicating an invalid deliverable
 */
const INVALID_PATTERNS = [
  /^Completed:/i,
  /^Conduct\s+/i,
  /^Develop\s+/i,
  /^Implement\s+/i,
  /^Review\s+/i,
  /^Establish\s+/i,
  /^Create\s+/i,
  /^Build\s+/i,
  /^Design\s+/i,
  /^Execute\s+/i,
  /^Launch\s+/i,
  /^Prepare\s+/i,
  /^Analyze\s+/i,
  /^undefined$/i,
  /^null$/i,
  /^\s*$/,
];

/**
 * Capitalize the first letter of each word
 */
function capitalizeWords(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Derive a proper deliverable name from an action string.
 * Fixes the root bug where "Completed: Conduct..." appears in the Deliverable column.
 *
 * @param action - The action step text (e.g., "Conduct market assessment")
 * @returns A proper deliverable name (e.g., "Market Assessment Report")
 *
 * @example
 * deriveDeliverableFromAction("Completed: Conduct marketing assessment")
 * // Returns: "Marketing Assessment Report"
 *
 * @example
 * deriveDeliverableFromAction("Develop improvement plan with KPIs")
 * // Returns: "Improvement Plan With Kpis Plan"
 */
export function deriveDeliverableFromAction(action: string): string {
  if (!action || typeof action !== 'string') {
    return 'Deliverable Documentation';
  }

  // Strip "Completed:" prefix (fixes root bug)
  let cleanAction = action.replace(/^Completed:\s*/i, '').trim();

  // Also strip common status prefixes
  cleanAction = cleanAction
    .replace(/^In Progress:\s*/i, '')
    .replace(/^Pending:\s*/i, '')
    .replace(/^Done:\s*/i, '')
    .trim();

  if (!cleanAction) {
    return 'Deliverable Documentation';
  }

  // Split into words
  const parts = cleanAction.split(/\s+/);
  const verb = parts[0]?.toLowerCase() as ActionVerb;
  const subject = parts.slice(1).join(' ');

  // Check if we have a template for this verb
  if (verb && DELIVERABLE_TEMPLATES[verb]) {
    const subjectOrDefault = subject || 'Assessment';
    return DELIVERABLE_TEMPLATES[verb](subjectOrDefault);
  }

  // Fallback: capitalize the action and add "Documentation"
  return `${capitalizeWords(cleanAction)} Documentation`;
}

/**
 * Check if a deliverable string is valid (not containing action verbs as prefixes)
 *
 * @param deliverable - The deliverable string to validate
 * @returns true if the deliverable is valid, false otherwise
 *
 * @example
 * isValidDeliverable("Completed: Conduct assessment") // false
 * isValidDeliverable("Assessment Report") // true
 */
export function isValidDeliverable(deliverable: string | null | undefined): boolean {
  if (!deliverable || typeof deliverable !== 'string') {
    return false;
  }

  const trimmed = deliverable.trim();
  if (!trimmed) {
    return false;
  }

  // Check against invalid patterns
  return !INVALID_PATTERNS.some(pattern => pattern.test(trimmed));
}

/**
 * Ensure a deliverable is valid, generating one from the action if needed
 *
 * @param deliverable - The existing deliverable (may be invalid)
 * @param action - The action step to derive from if deliverable is invalid
 * @returns A valid deliverable string
 */
export function ensureValidDeliverable(
  deliverable: string | null | undefined,
  action: string
): string {
  if (isValidDeliverable(deliverable)) {
    return deliverable!.trim();
  }
  return deriveDeliverableFromAction(action);
}

/**
 * Sanitize an array of implementation steps, fixing any invalid deliverables
 *
 * @param steps - Array of implementation steps with action and deliverable properties
 * @returns Array with corrected deliverables
 */
export function sanitizeImplementationSteps<T extends { action: string; deliverable?: string }>(
  steps: T[]
): T[] {
  if (!Array.isArray(steps)) {
    return [];
  }

  return steps.map(step => ({
    ...step,
    deliverable: ensureValidDeliverable(step.deliverable, step.action),
  }));
}

/**
 * Generate a deliverable suggestion based on dimension code and action type
 *
 * @param dimensionCode - The business dimension code (e.g., "STR", "SAL", "MKT")
 * @param action - The action description
 * @returns A contextually appropriate deliverable name
 */
export function generateContextualDeliverable(
  dimensionCode: string,
  action: string
): string {
  const dimensionPrefixes: Record<string, string> = {
    STR: 'Strategic',
    SAL: 'Sales',
    MKT: 'Marketing',
    CXP: 'Customer Experience',
    OPS: 'Operations',
    FIN: 'Financial',
    HRS: 'HR',
    LDG: 'Leadership',
    TIN: 'Technology',
    ITD: 'IT',
    IDS: 'IT Security',
    RMS: 'Risk Management',
    CMP: 'Compliance',
  };

  const baseDeliverable = deriveDeliverableFromAction(action);
  const prefix = dimensionPrefixes[dimensionCode];

  // Only add prefix if it's not already present
  if (prefix && !baseDeliverable.toLowerCase().includes(prefix.toLowerCase())) {
    return `${prefix} ${baseDeliverable}`;
  }

  return baseDeliverable;
}
