/**
 * Manager Initiatives Module
 *
 * Provides initiative ownership tracking and badge rendering
 * for manager reports. Distinguishes between owned initiatives
 * and collaborative/cross-functional work.
 *
 * @module manager-initiatives
 */

import type { CategoryCode } from '../../../data/question-category-mapping.js';
import type { ManagerType, MANAGER_CATEGORY_MAP } from './manager-quickwins.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Ownership status for an initiative
 */
export type OwnershipStatus = 'owns' | 'collaborates' | 'informed';

/**
 * Department initiative with ownership tracking
 */
export interface DeptInitiative {
  id: string;
  title: string;
  description: string;
  ownerDepartment: ManagerType;
  collaborators: ManagerType[];
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  sourceCategory: CategoryCode;
}

// ============================================================================
// OWNERSHIP MAPPINGS
// ============================================================================

/**
 * Primary owner mapping - which manager type owns each category
 */
export const CATEGORY_PRIMARY_OWNER: Record<CategoryCode, ManagerType> = {
  STR: 'StrategyLeadership',
  LDG: 'StrategyLeadership',
  SAL: 'SalesMarketing',
  MKT: 'SalesMarketing',
  CXP: 'SalesMarketing',  // Primary: Sales, Secondary: Operations
  OPS: 'Operations',
  HRS: 'Operations',
  FIN: 'Financials',
  CMP: 'Financials',      // Primary: Finance, Secondary: Operations
  RMS: 'Financials',      // Primary: Finance, Secondary: Strategy, IT
  TIN: 'ITTechnology',
  ITD: 'ITTechnology'
};

/**
 * Manager display names for UI
 */
export const MANAGER_DISPLAY_NAMES: Record<ManagerType, string> = {
  SalesMarketing: 'Sales & Marketing',
  Operations: 'Operations',
  Financials: 'Finance',
  ITTechnology: 'IT & Technology',
  StrategyLeadership: 'Strategy & Leadership'
};

/**
 * Category codes per manager (imported from manager-quickwins)
 */
const MANAGER_CATEGORIES: Record<ManagerType, CategoryCode[]> = {
  SalesMarketing: ['SAL', 'MKT', 'CXP', 'STR'],
  Operations: ['OPS', 'HRS', 'CXP', 'CMP'],
  Financials: ['FIN', 'CMP', 'RMS'],
  ITTechnology: ['TIN', 'ITD', 'RMS'],
  StrategyLeadership: ['STR', 'LDG', 'RMS']
};

// ============================================================================
// OWNERSHIP FUNCTIONS
// ============================================================================

/**
 * Determine ownership status for an initiative relative to a manager
 */
export function getOwnershipStatus(
  initiative: DeptInitiative,
  currentManager: ManagerType
): OwnershipStatus {
  if (initiative.ownerDepartment === currentManager) {
    return 'owns';
  }
  if (initiative.collaborators.includes(currentManager)) {
    return 'collaborates';
  }
  return 'informed';
}

/**
 * Determine ownership status based on category code and manager type
 * Simplified version for quick wins that don't have full initiative data
 */
export function getOwnershipStatusByCategory(
  categoryCode: string,
  currentManager: ManagerType
): OwnershipStatus {
  const primaryOwner = CATEGORY_PRIMARY_OWNER[categoryCode as CategoryCode];

  if (primaryOwner === currentManager) {
    return 'owns';
  }

  const relevantCategories = MANAGER_CATEGORIES[currentManager];
  if (relevantCategories?.includes(categoryCode as CategoryCode)) {
    return 'collaborates';
  }

  return 'informed';
}

/**
 * Get the primary owner manager type for a category code
 */
export function getPrimaryOwnerForCategory(categoryCode: string): ManagerType | undefined {
  return CATEGORY_PRIMARY_OWNER[categoryCode as CategoryCode];
}

/**
 * Get collaborators for a category based on which managers have it in their focus
 */
function getCollaborators(sourceCategory: CategoryCode, primaryOwner: ManagerType): ManagerType[] {
  const collaborators: ManagerType[] = [];

  for (const [manager, categories] of Object.entries(MANAGER_CATEGORIES)) {
    if (manager !== primaryOwner && categories.includes(sourceCategory)) {
      collaborators.push(manager as ManagerType);
    }
  }

  return collaborators;
}

/**
 * Enrich initiative with ownership data
 */
export function enrichInitiativeWithOwnership(
  initiative: Partial<DeptInitiative>,
  sourceCategory: CategoryCode
): DeptInitiative {
  const primaryOwner = CATEGORY_PRIMARY_OWNER[sourceCategory];
  const collaborators = getCollaborators(sourceCategory, primaryOwner);

  return {
    id: initiative.id || `init-${sourceCategory}-${Date.now()}`,
    title: initiative.title || '',
    description: initiative.description || '',
    ownerDepartment: primaryOwner,
    collaborators,
    impact: initiative.impact || 'medium',
    effort: initiative.effort || 'medium',
    timeline: initiative.timeline || '3-12 months',
    sourceCategory
  };
}

// ============================================================================
// BADGE RENDERING
// ============================================================================

/**
 * Render ownership badge HTML
 */
export function renderOwnershipBadge(
  status: OwnershipStatus,
  primaryOwner?: ManagerType
): string {
  if (status === 'owns') {
    return `
      <span class="ownership-badge owns" style="
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.625rem;
        background: #212653;
        color: white;
        border-radius: 4px;
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      ">
        <span>★</span> YOU OWN
      </span>
    `;
  }

  if (status === 'collaborates') {
    const ownerLabel = primaryOwner ? MANAGER_DISPLAY_NAMES[primaryOwner] : 'Another Team';
    return `
      <span class="ownership-badge collaborates" style="
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.625rem;
        background: #e5e7eb;
        color: #374151;
        border-radius: 4px;
        font-size: 0.6875rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      ">
        CROSS-FUNCTIONAL
      </span>
      <span style="font-size: 0.75rem; color: #6b7280; margin-left: 0.5rem;">
        Primary: ${escapeHtml(ownerLabel)}
      </span>
    `;
  }

  // 'informed' status gets no badge
  return '';
}

/**
 * Render compact ownership indicator
 */
export function renderOwnershipIndicator(
  status: OwnershipStatus,
  primaryOwner?: ManagerType
): string {
  if (status === 'owns') {
    return `<span style="color: #212653; font-weight: 600;" title="You own this initiative">★</span>`;
  }

  if (status === 'collaborates') {
    const ownerLabel = primaryOwner ? MANAGER_DISPLAY_NAMES[primaryOwner] : 'Another Team';
    return `<span style="color: #6b7280;" title="Cross-functional with ${ownerLabel}">↔</span>`;
  }

  return '';
}

/**
 * Render initiative card with ownership badge
 */
export function renderInitiativeCard(
  initiative: DeptInitiative,
  currentManager: ManagerType
): string {
  const ownershipStatus = getOwnershipStatus(initiative, currentManager);
  const badge = renderOwnershipBadge(ownershipStatus, initiative.ownerDepartment);

  const impactColor = initiative.impact === 'high' ? '#059669'
    : initiative.impact === 'medium' ? '#2563eb' : '#6b7280';
  const effortColor = initiative.effort === 'low' ? '#059669'
    : initiative.effort === 'medium' ? '#d97706' : '#dc2626';

  return `
    <div class="initiative-card" style="
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 0.75rem;
    ">
      <div class="initiative-header" style="
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.75rem;
      ">
        <h4 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #212653;
          margin: 0;
          flex: 1;
        ">${escapeHtml(initiative.title)}</h4>
        ${badge}
      </div>

      <p style="
        font-size: 0.875rem;
        color: #374151;
        margin: 0 0 0.75rem 0;
        line-height: 1.5;
      ">${escapeHtml(initiative.description)}</p>

      <div style="
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      ">
        <span style="
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          background: ${impactColor}15;
          color: ${impactColor};
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        ">${capitalize(initiative.impact)} Impact</span>

        <span style="
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          background: ${effortColor}15;
          color: ${effortColor};
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        ">${capitalize(initiative.effort)} Effort</span>

        <span style="
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          background: #f3f4f6;
          color: #374151;
          border-radius: 4px;
          font-size: 0.75rem;
        ">⏱ ${escapeHtml(initiative.timeline)}</span>
      </div>

      ${initiative.collaborators.length > 0 ? `
        <div style="
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #f3f4f6;
          font-size: 0.75rem;
          color: #6b7280;
        ">
          Collaborators: ${initiative.collaborators.map(c => MANAGER_DISPLAY_NAMES[c]).join(', ')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render initiative summary row (compact version)
 */
export function renderInitiativeRow(
  initiative: DeptInitiative,
  currentManager: ManagerType
): string {
  const ownershipStatus = getOwnershipStatus(initiative, currentManager);
  const indicator = renderOwnershipIndicator(ownershipStatus, initiative.ownerDepartment);

  return `
    <div style="
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0;
      border-bottom: 1px solid #f3f4f6;
    ">
      <span style="font-size: 1rem; width: 1.25rem; text-align: center;">${indicator}</span>
      <span style="flex: 1; font-size: 0.875rem; color: #374151;">${escapeHtml(initiative.title)}</span>
      <span style="
        padding: 0.25rem 0.5rem;
        background: #f3f4f6;
        border-radius: 4px;
        font-size: 0.75rem;
        color: #6b7280;
      ">${escapeHtml(initiative.timeline)}</span>
    </div>
  `;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Escape HTML entities
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

// ============================================================================
// EXPORTS
// ============================================================================

export {
  capitalize,
  escapeHtml,
  getCollaborators,
  MANAGER_CATEGORIES
};
