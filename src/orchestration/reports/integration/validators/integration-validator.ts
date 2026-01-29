/**
 * Integration Validator - Validates content integration quality.
 *
 * Performs validation checks on integrated deliverables:
 * - Required integrations present
 * - Coverage meets threshold
 * - Content quality checks
 * - Cross-reference validity
 */

import type {
  ClientDeliverableType,
  IntermediateFileType,
  ExtractedContent,
  IntegrationResult
} from '../types/content.types.js';
import type {
  ValidationCheck,
  CoverageReport,
  IntegrationGap,
  DeliverableValidationResult,
  FullValidationResult
} from '../types/validation.types.js';
import { getContentRegistry } from '../registries/content-registry.js';
import { createLogger } from '../../../../utils/logger.js';

const logger = createLogger('IntegrationValidator');

/**
 * Validates integration quality across all deliverables.
 */
export class IntegrationValidator {
  private registry = getContentRegistry();

  /**
   * Validate all deliverables and return full validation result.
   */
  public async validateAll(
    deliverables: Map<ClientDeliverableType, string>,
    extractedContent: Map<IntermediateFileType, ExtractedContent>,
    integrationResults: Map<ClientDeliverableType, IntegrationResult>
  ): Promise<FullValidationResult> {
    const byDeliverable: Partial<Record<ClientDeliverableType, DeliverableValidationResult>> = {};
    const criticalIssues: ValidationCheck[] = [];
    const highIssues: ValidationCheck[] = [];

    let totalExpected = 0;
    let totalApplied = 0;
    let passedCount = 0;
    let failedCount = 0;

    // Validate each deliverable
    for (const [deliverableType, html] of deliverables) {
      const integrationResult = integrationResults.get(deliverableType);

      const result = await this.validateDeliverable(
        deliverableType,
        html,
        extractedContent,
        integrationResult
      );

      byDeliverable[deliverableType] = result;

      // Aggregate statistics
      totalExpected += result.coverage.expectedIntegrations;
      totalApplied += result.coverage.appliedIntegrations;

      if (result.passed) {
        passedCount++;
      } else {
        failedCount++;
      }

      // Collect critical and high issues
      for (const check of result.checks) {
        if (!check.passed) {
          if (check.severity === 'critical') {
            criticalIssues.push(check);
          } else if (check.severity === 'high') {
            highIssues.push(check);
          }
        }
      }
    }

    // Calculate overall coverage
    const overallCoveragePercent = totalExpected > 0
      ? Math.round((totalApplied / totalExpected) * 100)
      : 100;

    // Determine overall pass/fail
    const overallPassed = criticalIssues.length === 0 && failedCount === 0;

    // Generate recommendations
    const recommendations = this.generateGlobalRecommendations(
      criticalIssues,
      highIssues,
      overallCoveragePercent
    );

    return {
      validatedAt: new Date().toISOString(),
      overallPassed,
      byDeliverable,
      summary: {
        totalDeliverables: deliverables.size,
        passedDeliverables: passedCount,
        failedDeliverables: failedCount,
        totalIntegrationsExpected: totalExpected,
        totalIntegrationsApplied: totalApplied,
        overallCoveragePercent,
        criticalIssueCount: criticalIssues.length
      },
      criticalIssues,
      highIssues,
      recommendations
    };
  }

  /**
   * Validate a single deliverable.
   */
  public async validateDeliverable(
    deliverableType: ClientDeliverableType,
    html: string,
    extractedContent: Map<IntermediateFileType, ExtractedContent>,
    integrationResult?: IntegrationResult
  ): Promise<DeliverableValidationResult> {
    const checks: ValidationCheck[] = [];
    const requirements = this.registry.getValidationRequirements(deliverableType);

    // Check 1: Required integrations present
    if (requirements) {
      for (const req of requirements.requiredIntegrations) {
        const check = this.checkRequiredIntegration(html, req.source, req.section, req.description);
        check.severity = req.critical ? 'critical' : 'high';
        checks.push(check);
      }
    }

    // Check 2: Integration IDs present and valid
    const integrationIdCheck = this.checkIntegrationIds(html, integrationResult);
    checks.push(integrationIdCheck);

    // Check 3: Cross-references valid
    const crossRefCheck = this.checkCrossReferences(html);
    checks.push(crossRefCheck);

    // Check 4: Content quality
    const qualityChecks = this.checkContentQuality(html, extractedContent, deliverableType);
    checks.push(...qualityChecks);

    // Build coverage report
    const coverage = this.buildCoverageReport(html, requirements, integrationResult);

    // Check 5: Coverage meets threshold
    if (requirements && coverage.coveragePercentage < requirements.minCoveragePercent) {
      checks.push({
        id: `coverage-${deliverableType}`,
        name: 'Coverage Threshold',
        passed: false,
        message: `Coverage ${coverage.coveragePercentage}% is below required ${requirements.minCoveragePercent}%`,
        severity: 'high',
        actualValue: coverage.coveragePercentage,
        expectedValue: requirements.minCoveragePercent
      });
    } else {
      checks.push({
        id: `coverage-${deliverableType}`,
        name: 'Coverage Threshold',
        passed: true,
        message: `Coverage ${coverage.coveragePercentage}% meets requirements`,
        severity: 'info'
      });
    }

    // Calculate summary
    const summary = this.calculateSummary(checks);

    // Determine pass/fail
    const passed = summary.criticalFailures === 0;

    // Generate recommendations
    const recommendations = this.generateDeliverableRecommendations(
      deliverableType,
      checks,
      coverage
    );

    return {
      deliverable: deliverableType,
      passed,
      checks,
      coverage,
      summary,
      recommendations
    };
  }

  /**
   * Check if a required integration is present.
   */
  private checkRequiredIntegration(
    html: string,
    source: IntermediateFileType,
    section: string,
    description: string
  ): ValidationCheck {
    const checkId = `required-${source}-${section.replace(/[^a-z0-9]/gi, '')}`;

    // Look for integration marker
    const sourcePattern = new RegExp(`data-source=["']${source}["']`, 'i');
    const sectionId = section.replace(/^#/, '');
    const sectionPattern = new RegExp(`id=["']${sectionId}["']`, 'i');

    const hasSource = sourcePattern.test(html);
    const hasSection = sectionPattern.test(html);

    // Also check for data-integration-id in the section
    const integrationInSection = new RegExp(
      `id=["']${sectionId}["'][^>]*>[\\s\\S]*?data-source=["']${source}["']`,
      'i'
    ).test(html);

    const passed = hasSource && (hasSection || integrationInSection);

    return {
      id: checkId,
      name: `Required Integration: ${description}`,
      passed,
      message: passed
        ? `${description} successfully integrated`
        : `Missing required integration: ${description} from ${source} in ${section}`,
      severity: 'critical',
      source,
      targetSection: section
    };
  }

  /**
   * Check integration IDs are present and valid.
   */
  private checkIntegrationIds(
    html: string,
    integrationResult?: IntegrationResult
  ): ValidationCheck {
    const ids = this.extractIntegrationIds(html);
    const expectedCount = integrationResult?.integrationsApplied ?? 0;

    const passed = ids.length >= expectedCount * 0.8; // Allow some tolerance

    return {
      id: 'integration-ids',
      name: 'Integration IDs Present',
      passed,
      message: passed
        ? `Found ${ids.length} integration markers`
        : `Expected ~${expectedCount} integration markers, found ${ids.length}`,
      severity: 'medium',
      actualValue: ids.length,
      expectedValue: expectedCount
    };
  }

  /**
   * Check cross-references are valid.
   */
  private checkCrossReferences(html: string): ValidationCheck {
    const crossRefPattern = /class="[^"]*cross-reference[^"]*"/g;
    const crossRefs = html.match(crossRefPattern) || [];

    // Check for broken references (missing href)
    const brokenRefPattern = /<a[^>]*class="[^"]*cross-reference[^"]*"[^>]*(?!href)[^>]*>/gi;
    const brokenRefs = html.match(brokenRefPattern) || [];

    const passed = brokenRefs.length === 0;

    return {
      id: 'cross-references',
      name: 'Cross-Reference Validity',
      passed,
      message: passed
        ? `All ${crossRefs.length} cross-references are valid`
        : `Found ${brokenRefs.length} broken cross-references out of ${crossRefs.length}`,
      severity: 'low',
      actualValue: brokenRefs.length,
      expectedValue: 0
    };
  }

  /**
   * Check content quality metrics.
   */
  private checkContentQuality(
    html: string,
    extractedContent: Map<IntermediateFileType, ExtractedContent>,
    deliverableType: ClientDeliverableType
  ): ValidationCheck[] {
    const checks: ValidationCheck[] = [];

    // Check for empty integrated sections
    const emptyPattern = /<div[^>]*class="[^"]*integrated-section[^"]*"[^>]*>\s*<\/div>/gi;
    const emptyMatches = html.match(emptyPattern) || [];

    checks.push({
      id: 'no-empty-sections',
      name: 'No Empty Integrated Sections',
      passed: emptyMatches.length === 0,
      message: emptyMatches.length === 0
        ? 'All integrated sections have content'
        : `Found ${emptyMatches.length} empty integrated sections`,
      severity: 'medium',
      actualValue: emptyMatches.length,
      expectedValue: 0
    });

    // Check for minimum content length
    const integratedContent = this.extractIntegratedContent(html);
    const minWordCount = this.getMinWordCount(deliverableType);

    checks.push({
      id: 'min-content-length',
      name: 'Minimum Content Length',
      passed: integratedContent.wordCount >= minWordCount,
      message: integratedContent.wordCount >= minWordCount
        ? `Integrated content has ${integratedContent.wordCount} words`
        : `Integrated content only has ${integratedContent.wordCount} words (min: ${minWordCount})`,
      severity: 'low',
      actualValue: integratedContent.wordCount,
      expectedValue: minWordCount
    });

    return checks;
  }

  /**
   * Build coverage report for a deliverable.
   */
  private buildCoverageReport(
    html: string,
    requirements?: { requiredIntegrations: Array<{ source: IntermediateFileType; section: string; critical: boolean; description: string }>; minCoveragePercent: number },
    integrationResult?: IntegrationResult
  ): CoverageReport {
    const expectedIntegrations = requirements?.requiredIntegrations.length ?? 0;
    const appliedIntegrations = integrationResult?.integrationsApplied ?? 0;

    // Find missing integrations
    const missingIntegrations: IntegrationGap[] = [];
    if (requirements) {
      for (const req of requirements.requiredIntegrations) {
        const sourcePattern = new RegExp(`data-source=["']${req.source}["']`, 'i');
        if (!sourcePattern.test(html)) {
          missingIntegrations.push({
            source: req.source,
            targetSection: req.section,
            reason: 'Integration marker not found in output',
            critical: req.critical
          });
        }
      }
    }

    const coveragePercentage = expectedIntegrations > 0
      ? Math.round(((expectedIntegrations - missingIntegrations.length) / expectedIntegrations) * 100)
      : 100;

    return {
      expectedIntegrations,
      appliedIntegrations,
      coveragePercentage,
      missingIntegrations,
      unexpectedIntegrations: []
    };
  }

  /**
   * Calculate summary statistics from checks.
   */
  private calculateSummary(checks: ValidationCheck[]): DeliverableValidationResult['summary'] {
    let criticalFailures = 0;
    let highFailures = 0;
    let mediumFailures = 0;
    let lowFailures = 0;
    let passedChecks = 0;
    let failedChecks = 0;

    for (const check of checks) {
      if (check.passed) {
        passedChecks++;
      } else {
        failedChecks++;
        switch (check.severity) {
          case 'critical':
            criticalFailures++;
            break;
          case 'high':
            highFailures++;
            break;
          case 'medium':
            mediumFailures++;
            break;
          case 'low':
            lowFailures++;
            break;
        }
      }
    }

    return {
      totalChecks: checks.length,
      passedChecks,
      failedChecks,
      criticalFailures,
      highFailures,
      mediumFailures,
      lowFailures
    };
  }

  /**
   * Generate recommendations for a deliverable.
   */
  private generateDeliverableRecommendations(
    deliverableType: ClientDeliverableType,
    checks: ValidationCheck[],
    coverage: CoverageReport
  ): string[] {
    const recommendations: string[] = [];

    // Missing integrations
    for (const gap of coverage.missingIntegrations) {
      if (gap.critical) {
        recommendations.push(
          `CRITICAL: Add missing ${gap.source} integration to ${gap.targetSection}`
        );
      } else {
        recommendations.push(
          `Add ${gap.source} integration to ${gap.targetSection} to improve coverage`
        );
      }
    }

    // Coverage below threshold
    if (coverage.coveragePercentage < 80) {
      recommendations.push(
        `Increase integration coverage from ${coverage.coveragePercentage}% to at least 80%`
      );
    }

    // Failed quality checks
    const qualityFailures = checks.filter(
      c => !c.passed && (c.id.includes('quality') || c.id.includes('content'))
    );
    for (const failure of qualityFailures) {
      recommendations.push(`Review and fix: ${failure.message}`);
    }

    return recommendations;
  }

  /**
   * Generate global recommendations.
   */
  private generateGlobalRecommendations(
    criticalIssues: ValidationCheck[],
    highIssues: ValidationCheck[],
    overallCoverage: number
  ): string[] {
    const recommendations: string[] = [];

    if (criticalIssues.length > 0) {
      recommendations.push(
        `CRITICAL: Fix ${criticalIssues.length} critical issue(s) before deployment`
      );
    }

    if (highIssues.length > 0) {
      recommendations.push(
        `Review and address ${highIssues.length} high-priority issue(s)`
      );
    }

    if (overallCoverage < 90) {
      recommendations.push(
        `Improve overall integration coverage from ${overallCoverage}% to 90%+`
      );
    }

    return recommendations;
  }

  /**
   * Extract integration IDs from HTML.
   */
  private extractIntegrationIds(html: string): string[] {
    const ids: string[] = [];
    const regex = /data-integration-id=["']([^"']+)["']/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
      ids.push(match[1]);
    }

    return ids;
  }

  /**
   * Extract integrated content statistics.
   */
  private extractIntegratedContent(html: string): { wordCount: number; sectionCount: number } {
    // Find all integrated sections
    const sectionPattern = /<div[^>]*class="[^"]*(?:integrated-section|deep-dive-supplement)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const sections: string[] = [];
    let match;

    while ((match = sectionPattern.exec(html)) !== null) {
      sections.push(match[1]);
    }

    // Count words
    const allText = sections.join(' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const wordCount = allText.split(' ').filter(w => w.length > 0).length;

    return {
      wordCount,
      sectionCount: sections.length
    };
  }

  /**
   * Get minimum word count for a deliverable type.
   */
  private getMinWordCount(deliverableType: ClientDeliverableType): number {
    const minCounts: Record<ClientDeliverableType, number> = {
      comprehensive: 500,
      owner: 300,
      executiveBrief: 100,
      salesMarketingManager: 200,
      operationsManager: 200,
      financialsManager: 200,
      itTechnologyManager: 200,
      strategyLeadershipManager: 200,
      employees: 50
    };

    return minCounts[deliverableType] ?? 100;
  }
}
