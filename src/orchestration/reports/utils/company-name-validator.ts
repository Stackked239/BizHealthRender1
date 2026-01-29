/**
 * Company Name Validation Utility
 *
 * Ensures consistent company name usage throughout reports.
 * Prevents data binding failures where template shows one company
 * but narrative content references another.
 *
 * @module company-name-validator
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of company name validation
 */
export interface CompanyNameValidationResult {
  /** Whether all company names are consistent */
  isValid: boolean;
  /** The canonical company name (single source of truth) */
  canonicalName: string;
  /** List of validation errors (if any) */
  errors: string[];
  /** List of validation warnings (non-blocking) */
  warnings: string[];
  /** Company names found in content (for debugging) */
  foundNames: string[];
}

/**
 * Options for company name validation
 */
export interface CompanyNameValidationOptions {
  /** Whether to throw an error on mismatch (default: false) */
  throwOnMismatch?: boolean;
  /** Known acceptable variations (Inc., LLC, Co., etc.) */
  acceptableVariations?: string[];
  /** Additional company names to check against (e.g., from webhook) */
  additionalSources?: string[];
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Normalize a company name for comparison
 * Removes common suffixes like Inc., LLC, Co., Corp., etc.
 */
export function normalizeCompanyName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .trim()
    .replace(/\s+(Inc\.?|LLC|Co\.?|Corp\.?|Ltd\.?|Limited|Corporation|Company)$/i, '')
    .trim()
    .toLowerCase();
}

/**
 * Check if two company names are acceptable variations of each other
 */
export function isAcceptableVariation(name1: string, name2: string): boolean {
  const normalized1 = normalizeCompanyName(name1);
  const normalized2 = normalizeCompanyName(name2);

  // Exact match after normalization
  if (normalized1 === normalized2) {
    return true;
  }

  // Check if one contains the other (for partial matches)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    // But make sure it's not just a common word
    const minLength = Math.min(normalized1.length, normalized2.length);
    if (minLength >= 5) {
      return true;
    }
  }

  return false;
}

/**
 * Extract company name references from HTML/narrative content
 */
export function extractCompanyReferences(content: string): string[] {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const references: string[] = [];

  // Pattern 1: Company names in headers (<h1>, <h2>, <h3>)
  const headerPattern = /<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi;
  let match;
  while ((match = headerPattern.exec(content)) !== null) {
    const text = match[1].trim();
    // Filter out common section titles that aren't company names
    if (!isCommonSectionTitle(text) && text.length > 2) {
      references.push(text);
    }
  }

  // Pattern 2: Company names in table cells (Company: <name>)
  const tablePattern = /<td[^>]*>Company<\/td>\s*<td[^>]*>([^<]+)<\/td>/gi;
  while ((match = tablePattern.exec(content)) !== null) {
    references.push(match[1].trim());
  }

  // Pattern 3: Strong/bold company references
  const strongPattern = /<strong[^>]*>([A-Z][^<]{2,50}(?:Inc\.?|LLC|Co\.?|Corp\.?)?)<\/strong>/gi;
  while ((match = strongPattern.exec(content)) !== null) {
    const text = match[1].trim();
    if (!isCommonSectionTitle(text) && text.length > 2) {
      references.push(text);
    }
  }

  // Pattern 4: Title case multi-word names (likely company names)
  // This is a heuristic - look for patterns like "Hopcraft Brewing Co."
  const titleCasePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+(?:\s+(?:Inc\.?|LLC|Co\.?|Corp\.?))?)\b/g;
  while ((match = titleCasePattern.exec(content)) !== null) {
    const text = match[1].trim();
    if (!isCommonSectionTitle(text) && text.length > 5) {
      references.push(text);
    }
  }

  // Deduplicate
  return [...new Set(references)];
}

/**
 * Check if a string is a common section title (not a company name)
 */
function isCommonSectionTitle(text: string): boolean {
  const commonTitles = [
    'executive summary',
    'overall health',
    'business health',
    'key findings',
    'key risks',
    'key opportunities',
    'recommendations',
    'action plan',
    'quick wins',
    'strategic roadmap',
    'growth engine',
    'performance health',
    'people leadership',
    'resilience safeguards',
    'financial summary',
    'risk assessment',
    'compliance overview',
    'appendix',
    'glossary',
    'table of contents',
    'about bizhealth',
    'methodology',
  ];

  const normalized = text.toLowerCase().trim();
  return commonTitles.some(title => normalized.includes(title) || title.includes(normalized));
}

/**
 * Validate company name consistency throughout report content
 *
 * @param canonicalName - The authoritative company name (from IDM/metadata)
 * @param narrativeContent - HTML content to check for consistency
 * @param options - Validation options
 * @returns Validation result with any errors/warnings
 *
 * @example
 * const result = validateCompanyName(
 *   'Hopcraft Brewing Co.',
 *   reportHtml,
 *   { throwOnMismatch: true }
 * );
 * if (!result.isValid) {
 *   console.error('Company name mismatch:', result.errors);
 * }
 */
export function validateCompanyName(
  canonicalName: string,
  narrativeContent: string,
  options: CompanyNameValidationOptions = {}
): CompanyNameValidationResult {
  const {
    throwOnMismatch = false,
    acceptableVariations = [],
    additionalSources = [],
  } = options;

  const result: CompanyNameValidationResult = {
    isValid: true,
    canonicalName: canonicalName || 'Unknown Company',
    errors: [],
    warnings: [],
    foundNames: [],
  };

  // Validate canonical name exists
  if (!canonicalName || canonicalName.trim() === '') {
    result.errors.push('[Company Name] Canonical company name is missing or empty');
    result.isValid = false;
  }

  // Check additional sources for consistency
  for (const sourceName of additionalSources) {
    if (sourceName && !isAcceptableVariation(canonicalName, sourceName)) {
      result.errors.push(
        `[Company Name] Source mismatch detected:\n` +
        `  Canonical: "${canonicalName}"\n` +
        `  Source: "${sourceName}"`
      );
      result.isValid = false;
    }
  }

  // Extract company references from narrative content
  const foundReferences = extractCompanyReferences(narrativeContent);
  result.foundNames = foundReferences;

  // Check each reference against canonical name
  for (const reference of foundReferences) {
    // Skip if it's the canonical name or an acceptable variation
    if (
      isAcceptableVariation(reference, canonicalName) ||
      acceptableVariations.some(v => isAcceptableVariation(reference, v))
    ) {
      continue;
    }

    // Check if it looks like a different company name
    if (looksLikeCompanyName(reference) && reference.length > 5) {
      result.warnings.push(
        `[Company Name] Potential mismatch in narrative:\n` +
        `  Expected: "${canonicalName}"\n` +
        `  Found: "${reference}"`
      );
    }
  }

  // If we found potential company names that don't match, it might be a data binding issue
  const unmatchedCompanyNames = foundReferences.filter(
    ref => looksLikeCompanyName(ref) && !isAcceptableVariation(ref, canonicalName)
  );

  if (unmatchedCompanyNames.length > 0) {
    // Check if any unmatched name appears multiple times (stronger signal)
    const nameCounts = new Map<string, number>();
    for (const name of unmatchedCompanyNames) {
      const normalized = normalizeCompanyName(name);
      nameCounts.set(normalized, (nameCounts.get(normalized) || 0) + 1);
    }

    for (const [name, count] of nameCounts.entries()) {
      if (count >= 2) {
        result.errors.push(
          `[DATA INTEGRITY FAILURE] Company name mismatch detected!\n` +
          `  Template/Header: "${canonicalName}"\n` +
          `  Narrative (${count}x): "${name}"\n` +
          `  This will cause client-facing errors.`
        );
        result.isValid = false;
      }
    }
  }

  // Log results
  if (!result.isValid) {
    for (const error of result.errors) {
      console.error(error);
    }
  }

  for (const warning of result.warnings) {
    console.warn(warning);
  }

  // Throw if requested
  if (throwOnMismatch && !result.isValid) {
    throw new Error(
      `Company name validation failed:\n${result.errors.join('\n')}`
    );
  }

  return result;
}

/**
 * Check if a string looks like a company name
 */
function looksLikeCompanyName(text: string): boolean {
  if (!text || text.length < 3) {
    return false;
  }

  // Has company suffix
  if (/\b(Inc\.?|LLC|Co\.?|Corp\.?|Ltd\.?|Limited|Corporation|Company)\b/i.test(text)) {
    return true;
  }

  // Is Title Case with multiple words
  const words = text.split(/\s+/);
  if (words.length >= 2) {
    const titleCaseWords = words.filter(w => /^[A-Z]/.test(w));
    if (titleCaseWords.length >= 2) {
      return true;
    }
  }

  return false;
}

/**
 * Get the single source of truth company name from various context sources
 *
 * @param sources - Object with potential company name sources
 * @returns The canonical company name to use
 */
export function getCanonicalCompanyName(sources: {
  companyProfileName?: string;
  metadataCompanyName?: string;
  idmCompanyName?: string;
  webhookCompanyName?: string;
}): string {
  // Priority order: companyProfile > metadata > idm > webhook
  const name =
    sources.companyProfileName ||
    sources.metadataCompanyName ||
    sources.idmCompanyName ||
    sources.webhookCompanyName ||
    '';

  if (!name) {
    console.warn('[getCanonicalCompanyName] No company name found in any source');
  }

  return name.trim();
}

/**
 * Create a validation guard that can be used in report builders
 *
 * @param ctx - Report context
 * @param options - Validation options
 * @returns The validated company name
 * @throws Error if throwOnMismatch is true and validation fails
 */
export function validateAndGetCompanyName(
  ctx: {
    companyProfile?: { name?: string };
    metadata?: { companyName?: string };
    companyInfo?: { name?: string };
  },
  options: CompanyNameValidationOptions = {}
): string {
  const companyName = getCanonicalCompanyName({
    companyProfileName: ctx.companyProfile?.name,
    metadataCompanyName: ctx.metadata?.companyName || ctx.companyInfo?.name,
  });

  if (!companyName) {
    const error = '[Company Name] No company name found in report context';
    console.error(error);
    if (options.throwOnMismatch) {
      throw new Error(error);
    }
    return 'Your Company';
  }

  return companyName;
}
