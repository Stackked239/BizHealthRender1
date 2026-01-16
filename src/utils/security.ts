/**
 * Security Utilities for Phase 0
 *
 * Provides cryptographic functions for payload hashing,
 * integrity verification, and PII handling.
 */

import { createHash } from 'crypto';
import type { PIIFieldIdentifier, KNOWN_PII_FIELDS } from '../types/raw-input.types.js';

/**
 * Compute SHA-256 hash of a payload
 *
 * @param payload - The data to hash (will be JSON stringified)
 * @returns SHA-256 hash as lowercase hex string (64 characters)
 */
export function computePayloadHash(payload: unknown): string {
  const serialized = JSON.stringify(payload, null, 0);
  return createHash('sha256').update(serialized, 'utf8').digest('hex');
}

/**
 * Compute SHA-256 hash of a string
 *
 * @param data - The string to hash
 * @returns SHA-256 hash as lowercase hex string (64 characters)
 */
export function computeStringHash(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Verify that a payload matches its expected hash
 *
 * @param payload - The data to verify
 * @param expectedHash - The expected SHA-256 hash
 * @returns True if the hash matches
 */
export function verifyPayloadHash(payload: unknown, expectedHash: string): boolean {
  const actualHash = computePayloadHash(payload);
  return actualHash.toLowerCase() === expectedHash.toLowerCase();
}

/**
 * Generate a content hash for a file
 *
 * @param content - The content to hash (string or buffer)
 * @returns SHA-256 hash as lowercase hex string
 */
export function computeContentHash(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Redact sensitive values in a payload based on PII field identifiers
 *
 * @param payload - The payload to redact
 * @param piiFields - Array of PII field identifiers
 * @param redactionValue - Value to replace PII with (default: '[REDACTED]')
 * @returns Redacted copy of the payload
 */
export function redactPIIFields(
  payload: unknown,
  piiFields: PIIFieldIdentifier[],
  redactionValue: string = '[REDACTED]'
): unknown {
  if (typeof payload !== 'object' || payload === null) {
    return payload;
  }

  // Deep clone the payload to avoid mutation
  const clone = JSON.parse(JSON.stringify(payload));

  for (const field of piiFields) {
    if (!field.redact_in_logs) continue;

    const pathParts = field.field_path.split('.');
    redactFieldAtPath(clone, pathParts, redactionValue);
  }

  return clone;
}

/**
 * Recursively redact a field at a given path
 * Supports wildcard '*' for array elements
 */
function redactFieldAtPath(obj: Record<string, unknown>, pathParts: string[], value: string): void {
  if (pathParts.length === 0 || obj === null || typeof obj !== 'object') {
    return;
  }

  const [current, ...remaining] = pathParts;

  if (current === '*') {
    // Handle array wildcard
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (typeof item === 'object' && item !== null) {
          redactFieldAtPath(item as Record<string, unknown>, remaining, value);
        }
      }
    }
  } else if (remaining.length === 0) {
    // Last part of path - redact the value
    if (current in obj) {
      obj[current] = value;
    }
  } else {
    // Continue down the path
    const next = obj[current];
    if (next !== null && typeof next === 'object') {
      redactFieldAtPath(next as Record<string, unknown>, remaining, value);
    }
  }
}

/**
 * Extract PII fields from a payload for analytics exclusion
 *
 * @param payload - The payload to analyze
 * @param piiFields - Array of PII field identifiers
 * @returns Object with non-excluded fields only
 */
export function excludePIIFromAnalytics(
  payload: unknown,
  piiFields: PIIFieldIdentifier[]
): unknown {
  if (typeof payload !== 'object' || payload === null) {
    return payload;
  }

  const clone = JSON.parse(JSON.stringify(payload));
  const excludeFields = piiFields.filter(f => f.exclude_from_analytics);

  for (const field of excludeFields) {
    const pathParts = field.field_path.split('.');
    deleteFieldAtPath(clone, pathParts);
  }

  return clone;
}

/**
 * Recursively delete a field at a given path
 */
function deleteFieldAtPath(obj: Record<string, unknown>, pathParts: string[]): void {
  if (pathParts.length === 0 || obj === null || typeof obj !== 'object') {
    return;
  }

  const [current, ...remaining] = pathParts;

  if (current === '*') {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (typeof item === 'object' && item !== null) {
          deleteFieldAtPath(item as Record<string, unknown>, remaining);
        }
      }
    }
  } else if (remaining.length === 0) {
    delete obj[current];
  } else {
    const next = obj[current];
    if (next !== null && typeof next === 'object') {
      deleteFieldAtPath(next as Record<string, unknown>, remaining);
    }
  }
}

/**
 * Generate a deterministic company profile ID from company name
 *
 * @param companyName - The company name
 * @returns A stable ID suitable for use as a directory name
 */
export function generateCompanyProfileId(companyName: string): string {
  // Normalize the company name
  const normalized = companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);

  // Generate a short hash suffix for uniqueness
  const hash = computeStringHash(companyName.toLowerCase().trim());
  const suffix = hash.substring(0, 8);

  return `${normalized}-${suffix}`;
}

/**
 * Sanitize a string for use in file paths
 *
 * @param str - The string to sanitize
 * @returns Safe string for file paths
 */
export function sanitizeForPath(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 100);
}

/**
 * Check if a payload contains all expected sections
 *
 * @param payload - The webhook payload
 * @returns Object with missing sections (if any)
 */
export function validatePayloadCompleteness(payload: unknown): {
  complete: boolean;
  missingSections: string[];
} {
  const requiredSections = [
    'business_overview',
    'strategy',
    'sales',
    'marketing',
    'customer_experience',
    'operations',
    'financials',
    'human_resources',
    'leadership',
    'technology',
    'it_infrastructure',
    'risk_management',
    'compliance',
  ];

  const missingSections: string[] = [];

  if (typeof payload !== 'object' || payload === null) {
    return { complete: false, missingSections: requiredSections };
  }

  for (const section of requiredSections) {
    if (!(section in payload)) {
      missingSections.push(section);
    }
  }

  return {
    complete: missingSections.length === 0,
    missingSections,
  };
}

/**
 * Generate a timestamp for audit logging
 */
export function generateAuditTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Create an audit log entry for security-sensitive operations
 */
export interface SecurityAuditEntry {
  timestamp: string;
  operation: string;
  actor: string;
  resource: string;
  resource_id: string;
  action_details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Create a security audit entry
 */
export function createSecurityAuditEntry(
  operation: string,
  actor: string,
  resource: string,
  resourceId: string,
  details: Record<string, unknown> = {},
  clientInfo?: { ip?: string; userAgent?: string }
): SecurityAuditEntry {
  return {
    timestamp: generateAuditTimestamp(),
    operation,
    actor,
    resource,
    resource_id: resourceId,
    action_details: details,
    ip_address: clientInfo?.ip,
    user_agent: clientInfo?.userAgent,
  };
}
