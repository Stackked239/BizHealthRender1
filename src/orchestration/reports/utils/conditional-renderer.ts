/**
 * Conditional Renderer Utility
 *
 * Implements fallback behavior for missing data in report components.
 * Provides graceful degradation when data is unavailable.
 */

/**
 * Configuration for conditional rendering
 */
export interface ConditionalConfig {
  /** JSONPath-like data path to check */
  dataPath: string;
  /** Function to determine if component should render */
  renderIf: (data: any) => boolean;
  /** Fallback message when data is missing */
  fallbackMessage?: string;
  /** Custom fallback component function */
  fallbackComponent?: () => string;
  /** Log warnings when fallback is used */
  logWarnings?: boolean;
}

/**
 * Result of a conditional render operation
 */
export interface ConditionalRenderResult {
  /** The rendered HTML */
  html: string;
  /** Whether the primary component was rendered */
  rendered: boolean;
  /** Whether a fallback was used */
  usedFallback: boolean;
  /** Any warning message generated */
  warning?: string;
}

/**
 * Get value from object using dot notation path
 *
 * @param obj - Source object
 * @param path - Dot notation path (e.g., "scores_summary.overall_health_score")
 * @returns Value at path or undefined
 */
export function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) {
    return undefined;
  }

  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    // Handle array index notation like "items[0]"
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = current?.[key]?.[parseInt(index, 10)];
    } else {
      current = current?.[part];
    }

    if (current === undefined || current === null) {
      return undefined;
    }
  }

  return current;
}

/**
 * Check if a value is considered "valid" for rendering
 */
export function isValidValue(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return false;
  }

  if (Array.isArray(value) && value.length === 0) {
    return false;
  }

  if (typeof value === 'number' && isNaN(value)) {
    return false;
  }

  return true;
}

/**
 * Check if an array has minimum required length
 */
export function hasMinLength(value: any, minLength: number): boolean {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.length >= minLength;
}

/**
 * Generate default fallback HTML
 */
function generateDefaultFallback(message: string): string {
  return `
    <div class="conditional-fallback" role="note" aria-live="polite">
      <span class="fallback-icon" aria-hidden="true">ℹ️</span>
      <span class="fallback-text">${escapeHtml(message)}</span>
    </div>
  `;
}

/**
 * Generate silent placeholder (no visual output, just empty div)
 */
function generateSilentFallback(): string {
  return '<div class="conditional-silent" aria-hidden="true"></div>';
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render component conditionally based on data availability
 *
 * @param data - Source data object
 * @param config - Conditional rendering configuration
 * @param renderComponent - Function that renders the primary component
 * @returns Rendered HTML (either component or fallback)
 */
export function renderConditional(
  data: any,
  config: ConditionalConfig,
  renderComponent: () => string
): string {
  const result = renderConditionalWithResult(data, config, renderComponent);
  return result.html;
}

/**
 * Render component conditionally with detailed result
 */
export function renderConditionalWithResult(
  data: any,
  config: ConditionalConfig,
  renderComponent: () => string
): ConditionalRenderResult {
  try {
    const value = getValueByPath(data, config.dataPath);

    if (config.renderIf(value)) {
      return {
        html: renderComponent(),
        rendered: true,
        usedFallback: false,
      };
    }

    // Data condition not met - use fallback
    const warning = `Conditional render fallback for path: ${config.dataPath}`;

    if (config.logWarnings) {
      console.warn(warning);
    }

    let fallbackHtml: string;

    if (config.fallbackComponent) {
      fallbackHtml = config.fallbackComponent();
    } else if (config.fallbackMessage) {
      fallbackHtml = generateDefaultFallback(config.fallbackMessage);
    } else {
      // Silent fail - don't render anything
      fallbackHtml = generateSilentFallback();
    }

    return {
      html: fallbackHtml,
      rendered: false,
      usedFallback: true,
      warning,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const warning = `Conditional render error for ${config.dataPath}: ${errorMessage}`;

    if (config.logWarnings) {
      console.warn(warning);
    }

    const fallbackHtml = config.fallbackMessage
      ? generateDefaultFallback(config.fallbackMessage)
      : generateSilentFallback();

    return {
      html: fallbackHtml,
      rendered: false,
      usedFallback: true,
      warning,
    };
  }
}

/**
 * Create a conditional renderer for a specific data path
 */
export function createConditionalRenderer(config: Omit<ConditionalConfig, 'renderIf'>) {
  return (data: any, renderComponent: () => string, customRenderIf?: (value: any) => boolean) => {
    const fullConfig: ConditionalConfig = {
      ...config,
      renderIf: customRenderIf || isValidValue,
    };
    return renderConditional(data, fullConfig, renderComponent);
  };
}

/**
 * Render if array has items
 */
export function renderIfHasItems(
  data: any,
  dataPath: string,
  renderComponent: () => string,
  fallbackMessage?: string
): string {
  return renderConditional(
    data,
    {
      dataPath,
      renderIf: (value) => Array.isArray(value) && value.length > 0,
      fallbackMessage,
    },
    renderComponent
  );
}

/**
 * Render if value is a valid number
 */
export function renderIfValidNumber(
  data: any,
  dataPath: string,
  renderComponent: () => string,
  fallbackMessage?: string
): string {
  return renderConditional(
    data,
    {
      dataPath,
      renderIf: (value) => typeof value === 'number' && !isNaN(value) && isFinite(value),
      fallbackMessage,
    },
    renderComponent
  );
}

/**
 * Render if value is a non-empty string
 */
export function renderIfNonEmptyString(
  data: any,
  dataPath: string,
  renderComponent: () => string,
  fallbackMessage?: string
): string {
  return renderConditional(
    data,
    {
      dataPath,
      renderIf: (value) => typeof value === 'string' && value.trim().length > 0,
      fallbackMessage,
    },
    renderComponent
  );
}

/**
 * Render if score is in valid range
 */
export function renderIfValidScore(
  data: any,
  dataPath: string,
  renderComponent: () => string,
  fallbackMessage: string = 'Score data not available'
): string {
  return renderConditional(
    data,
    {
      dataPath,
      renderIf: (value) =>
        typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 100,
      fallbackMessage,
    },
    renderComponent
  );
}

/**
 * Render with minimum array length requirement
 */
export function renderIfMinItems(
  data: any,
  dataPath: string,
  minItems: number,
  renderComponent: () => string,
  fallbackMessage?: string
): string {
  return renderConditional(
    data,
    {
      dataPath,
      renderIf: (value) => hasMinLength(value, minItems),
      fallbackMessage: fallbackMessage || `Requires at least ${minItems} items`,
    },
    renderComponent
  );
}

/**
 * Generate CSS for conditional fallback components
 */
export function generateConditionalStyles(): string {
  return `
    /* Conditional Fallback Styles */
    .conditional-fallback {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #F3F4F6;
      border-radius: 8px;
      border-left: 3px solid #9CA3AF;
      color: #6B7280;
      font-size: 14px;
      margin: 12px 0;
    }

    .conditional-fallback .fallback-icon {
      font-size: 18px;
      flex-shrink: 0;
    }

    .conditional-fallback .fallback-text {
      line-height: 1.4;
    }

    .conditional-silent {
      display: none;
    }

    /* Informational fallback variant */
    .conditional-fallback--info {
      background: #EFF6FF;
      border-left-color: #3B82F6;
      color: #1E40AF;
    }

    /* Warning fallback variant */
    .conditional-fallback--warning {
      background: #FEF3C7;
      border-left-color: #F59E0B;
      color: #92400E;
    }

    /* Print Styles */
    @media print {
      .conditional-fallback {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        page-break-inside: avoid;
      }

      .conditional-silent {
        display: none !important;
      }
    }
  `;
}

/**
 * Generate a "data not available" message box
 */
export function generateDataNotAvailableBox(
  title: string,
  message?: string
): string {
  return `
    <div class="conditional-fallback" role="note">
      <span class="fallback-icon" aria-hidden="true">📊</span>
      <div>
        <strong>${escapeHtml(title)}</strong>
        ${message ? `<p style="margin: 4px 0 0 0; font-size: 13px;">${escapeHtml(message)}</p>` : ''}
      </div>
    </div>
  `;
}

/**
 * Generate a "coming soon" placeholder
 */
export function generateComingSoonBox(feature: string): string {
  return `
    <div class="conditional-fallback conditional-fallback--info" role="note">
      <span class="fallback-icon" aria-hidden="true">🚧</span>
      <div>
        <strong>${escapeHtml(feature)}</strong>
        <p style="margin: 4px 0 0 0; font-size: 13px;">This feature will be available in a future update.</p>
      </div>
    </div>
  `;
}
