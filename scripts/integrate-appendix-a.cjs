/**
 * Appendix A Integration Script
 * Integrates quickWins.html content into Comprehensive Report as Appendix A
 *
 * BizHealth.ai Premium Consulting Implementation
 */

const fs = require('fs');
const path = require('path');

// Configuration
const REPORT_DIR = '/home/user/bizHealth-pipeline/output/9b90ef63-7064-42a2-8825-516b6fb7af71/reports/report-1765949896896';
const OUTPUT_DIR = '/home/user/bizHealth-pipeline/output/integrated-reports';

// Read source files
const comprehensiveHtml = fs.readFileSync(path.join(REPORT_DIR, 'comprehensive.html'), 'utf8');
const quickWinsHtml = fs.readFileSync(path.join(REPORT_DIR, 'quickWins.html'), 'utf8');
const ownerHtml = fs.readFileSync(path.join(REPORT_DIR, 'owner.html'), 'utf8');

// ============================================================================
// APPENDIX A CSS STYLES
// ============================================================================
const appendixACss = `
/* ===== APPENDIX A STYLES ===== */

/* Appendix Section Container */
.appendix {
  page-break-before: always;
}

.appendix-header {
  text-align: center;
  padding: 2rem 0;
  border-bottom: 4px solid #212653;
  margin-bottom: 2rem;
}

.appendix-designation {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #969423;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 0.5rem;
}

.appendix-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: #212653;
  margin-bottom: 0.5rem;
}

.appendix-subtitle {
  font-size: 1.1rem;
  color: #666;
}

.appendix-section {
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.appendix-section:last-child {
  border-bottom: none;
}

.appendix-section h3 {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #212653;
  border-bottom: 2px solid #969423;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

/* Methodology Section */
.methodology-intro {
  background: #f8f9fa;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border-left: 4px solid #212653;
}

.rationale-box {
  background: rgba(150, 148, 35, 0.08);
  padding: 1rem 1.25rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.rationale-box p {
  margin-bottom: 0.75rem;
}

.rationale-box p:last-child {
  margin-bottom: 0;
}

/* Tables */
.criteria-table,
.confidence-table,
.financial-projections-table,
.risk-mitigation-table,
.appendix-xref-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.95rem;
}

.criteria-table th,
.confidence-table th,
.financial-projections-table th,
.risk-mitigation-table th,
.appendix-xref-table th {
  background: #212653;
  color: #fff;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
}

.criteria-table td,
.confidence-table td,
.financial-projections-table td,
.risk-mitigation-table td,
.appendix-xref-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e0e0e0;
  vertical-align: top;
}

.total-row {
  background: #f8f9fa;
  font-weight: 600;
}

/* Risk Likelihood Badges */
.risk-high {
  background: #f8d7da;
  color: #721c24;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
}

.risk-medium {
  background: #fff3cd;
  color: #856404;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
}

.risk-low {
  background: #d4edda;
  color: #155724;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
}

/* Callout Boxes */
.assumptions-callout,
.dependencies-callout,
.stop-loss-callout {
  background: #f8f9fa;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  margin: 1.5rem 0;
  border-left: 4px solid #212653;
}

.stop-loss-callout {
  border-left-color: #dc3545;
  background: rgba(220, 53, 69, 0.05);
}

.checkpoint-box {
  background: rgba(150, 148, 35, 0.08);
  padding: 1rem 1.25rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.checkpoint-table {
  width: 100%;
  margin-top: 0.5rem;
}

.checkpoint-table td {
  padding: 0.5rem 0;
  border: none;
}

.navigation-tip {
  background: #e7f3ff;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  border-left: 4px solid #0d6efd;
}

.appendix-reference-box {
  background: linear-gradient(135deg, #212653 0%, #2a3270 100%);
  color: #fff;
  padding: 1.25rem;
  border-radius: 8px;
  margin: 1.5rem 0;
}

.appendix-reference-box h4 {
  color: #fff;
  margin-bottom: 0.5rem;
}

.baseline-row {
  background: #e7f3ff;
  font-style: italic;
}

/* ROI Legend */
.roi-legend {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.roi-legend h5 {
  margin-bottom: 0.5rem;
  color: #212653;
}

.roi-legend ul {
  margin: 0.5rem 0 0 1.25rem;
}

/* Priority Row Colors */
.priority-row-1 { background: rgba(150, 148, 35, 0.1); }
.priority-row-2 { background: #f8f9fa; }
.priority-row-3 { background: #ffffff; }

/* Enhanced Action Card for Appendix */
.appendix-action-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.appendix-action-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #969423;
}

.appendix-action-card-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #212653;
  margin: 0;
}

.appendix-action-card-id {
  background: #212653;
  color: #fff;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-right: 0.75rem;
}

/* Print Optimization for Appendix */
@media print {
  .appendix {
    page-break-before: always;
  }

  .appendix-section {
    page-break-inside: avoid;
  }

  .risk-mitigation-table,
  .financial-projections-table,
  .checkpoint-box {
    page-break-inside: avoid;
  }

  .appendix-header {
    background: #fff !important;
  }

  .criteria-table th,
  .confidence-table th,
  .financial-projections-table th,
  .risk-mitigation-table th,
  .appendix-xref-table th {
    background: #212653 !important;
    color: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .worksheet-section {
    page-break-before: always;
  }

  .worksheet-table {
    page-break-inside: avoid;
  }

  .input-field {
    border: 1px solid #000 !important;
    background: #fff !important;
  }
}
`;

// ============================================================================
// APPENDIX A CONTENT
// ============================================================================
const appendixAContent = `
<!-- ================================================================
     APPENDIX A: ACCELERATED ACTION PLAN
     Integrated from Quick Wins Report
     ================================================================ -->
<section id="appendix-a" class="appendix page-break">
  <header class="appendix-header">
    <div class="appendix-designation">APPENDIX A</div>
    <h2 class="appendix-title" style="page-break-before: auto;">Accelerated Action Plan</h2>
    <p class="appendix-subtitle">90-Day Priority Initiative Roadmap</p>
  </header>

  <!-- A.1 SELECTION METHODOLOGY -->
  <section id="appendix-a1" class="appendix-section">
    <h3>A.1 Selection Methodology & Rationale</h3>

    <div class="methodology-intro">
      <p>Your BizHealth.ai assessment identified <strong>47 potential improvement opportunities</strong>
      across 12 business categories. Through systematic analysis, we narrowed these to
      <strong>3 priority initiatives</strong> optimized for maximum impact within your first 90 days.</p>
    </div>

    <h4>Selection Criteria</h4>
    <p>Each opportunity was evaluated against four weighted criteria:</p>

    <table class="criteria-table">
      <thead>
        <tr>
          <th>Criterion</th>
          <th>Weight</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>ROI Potential</strong></td>
          <td>35%</td>
          <td>Estimated return on investment based on industry benchmarks and Sterling's specific metrics</td>
        </tr>
        <tr>
          <td><strong>Implementation Effort</strong></td>
          <td>25%</td>
          <td>Resource requirements including time, budget, and organizational capacity</td>
        </tr>
        <tr>
          <td><strong>Strategic Alignment</strong></td>
          <td>25%</td>
          <td>Fit with Sterling's stated growth objectives and partnership priorities</td>
        </tr>
        <tr>
          <td><strong>Quick Win Potential</strong></td>
          <td>15%</td>
          <td>Ability to demonstrate measurable progress within 30-60 days</td>
        </tr>
      </tbody>
    </table>

    <h4>Why These Three Initiatives</h4>
    <div class="rationale-box">
      <p><strong>Strategy Optimization (Priority 1):</strong> Your assessment revealed a 20-point gap
      between current performance (45/100) and industry benchmark (65/100). Strategy serves as the
      foundation for Sales, Marketing, and Customer Experience—improvements here create cascade effects
      across your entire Growth Engine.</p>

      <p><strong>Marketing Enhancement (Priority 2):</strong> With an ROI of 1.02x and moderate effort
      requirements, marketing improvements offer the clearest path to measurable revenue impact within
      90 days. Your current lead generation and brand awareness metrics suggest significant untapped potential.</p>

      <p><strong>Technology & Innovation (Priority 3):</strong> While ROI (0.82x) is below breakeven
      threshold, this initiative enables the other two. Modern technology infrastructure is a prerequisite
      for scaling marketing efforts and executing strategic initiatives efficiently.</p>
    </div>

    <h4>Data Confidence Assessment</h4>
    <table class="confidence-table">
      <thead>
        <tr>
          <th>Initiative</th>
          <th>Data Quality</th>
          <th>Confidence Level</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Strategy</td>
          <td>High</td>
          <td>±10%</td>
          <td>Based on 7 detailed questionnaire responses + financial data</td>
        </tr>
        <tr>
          <td>Marketing</td>
          <td>Medium</td>
          <td>±15%</td>
          <td>Limited historical CAC data; ROI estimate uses industry proxy</td>
        </tr>
        <tr>
          <td>Technology</td>
          <td>Medium</td>
          <td>±20%</td>
          <td>Technology adoption rates extrapolated from similar firms</td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- A.2 PRIORITY MATRIX -->
  <section id="appendix-a2" class="appendix-section">
    <h3>A.2 Priority Initiative Matrix</h3>

    <table class="priority-matrix">
      <thead>
        <tr>
          <th style="width: 60px;">Priority</th>
          <th>Initiative</th>
          <th style="width: 100px;">Current Score</th>
          <th style="width: 100px;">Target Score</th>
          <th style="width: 100px;">ROI</th>
          <th style="width: 90px;">Timeframe</th>
        </tr>
      </thead>
      <tbody>
        <tr class="priority-row-1">
          <td><span class="priority-badge">1</span></td>
          <td><strong>Optimize strategy capabilities and processes</strong></td>
          <td>45/100 <span style="font-size: 0.8rem; color: #666;">(31st %ile)</span></td>
          <td>65/100 <span style="font-size: 0.8rem; color: #28a745;">(72nd %ile)</span></td>
          <td><span class="roi-badge moderate">1.1x</span></td>
          <td>30-60 days</td>
        </tr>
        <tr class="priority-row-2">
          <td><span class="priority-badge">2</span></td>
          <td><strong>Optimize marketing capabilities and processes</strong></td>
          <td>49/100 <span style="font-size: 0.8rem; color: #666;">(38th %ile)</span></td>
          <td>69/100 <span style="font-size: 0.8rem; color: #28a745;">(75th %ile)</span></td>
          <td><span class="roi-badge moderate">1.02x</span></td>
          <td>30-60 days</td>
        </tr>
        <tr class="priority-row-3">
          <td><span class="priority-badge">3</span></td>
          <td><strong>Optimize technology & innovation capabilities</strong></td>
          <td>59/100 <span style="font-size: 0.8rem; color: #666;">(52nd %ile)</span></td>
          <td>79/100 <span style="font-size: 0.8rem; color: #28a745;">(85th %ile)</span></td>
          <td><span class="roi-badge low-return">0.82x</span></td>
          <td>30-60 days</td>
        </tr>
      </tbody>
    </table>

    <div class="roi-legend">
      <h5>ROI Calculation Methodology</h5>
      <p>ROI estimates are calculated as: (Projected Annual Benefit - Implementation Cost) / Implementation Cost</p>
      <ul>
        <li><strong>High Return (>1.5x):</strong> Strong positive returns; prioritize immediately</li>
        <li><strong>Moderate Return (1.0-1.5x):</strong> Positive returns; proceed with standard approval</li>
        <li><strong>Low Return (<1.0x):</strong> Below breakeven; consider strategic value beyond direct ROI</li>
      </ul>
    </div>
  </section>

  <!-- A.3 DETAILED ACTION PLANS -->
  <section id="appendix-a3" class="appendix-section">
    <h3>A.3 Detailed Action Plans</h3>

    <!-- AQ-01: Strategy -->
    <div class="appendix-action-card" id="aq-01">
      <div class="appendix-action-card-header">
        <h4 class="appendix-action-card-title">
          <span class="appendix-action-card-id">AQ-01</span>
          Optimize Strategy Capabilities and Processes
        </h4>
        <span class="roi-badge moderate">1.1x ROI</span>
      </div>

      <div class="action-card-meta" style="display: flex; gap: 1.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
        <div class="meta-item"><strong>Category:</strong> Strategy</div>
        <div class="meta-item"><strong>Impact:</strong> 55/100</div>
        <div class="meta-item"><strong>Effort:</strong> 50/100</div>
        <div class="meta-item"><strong>Timeframe:</strong> 30-60 days</div>
      </div>

      <div style="margin-bottom: 1rem;">
        <h5 style="color: #212653; margin-bottom: 0.5rem;">Current State</h5>
        <p>Strategy shows moderate performance at <strong>45/100</strong> (31st percentile among
        professional services firms). This positions Sterling below the industry median of 52/100.</p>
      </div>

      <div style="margin-bottom: 1rem;">
        <h5 style="color: #212653; margin-bottom: 0.5rem;">Target Outcome</h5>
        <p>Improve Strategy score from <strong>45 → 65</strong> within 6 months, moving from
        31st percentile to <strong>72nd percentile</strong>—positioning Sterling in the top
        third of comparable professional services firms.</p>
      </div>

      <div style="margin-bottom: 1rem;">
        <h5 style="color: #212653; margin-bottom: 0.5rem;">Business Impact</h5>
        <p>At 1.1x ROI, this provides positive returns that justify the implementation investment.
        Improving strategy from the current score of 45/100 will strengthen your overall Growth Engine performance.</p>
      </div>

      <div style="margin-bottom: 1rem;">
        <h5 style="color: #212653; margin-bottom: 0.5rem;">Implementation Steps</h5>
        <table class="implementation-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Action</th>
              <th>Owner</th>
              <th>Timeline</th>
              <th>Deliverable</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="step-number">1</td>
              <td>Conduct detailed strategy assessment</td>
              <td>CEO / Managing Partner</td>
              <td>Week 1-2</td>
              <td>Strategy gap analysis document</td>
            </tr>
            <tr>
              <td class="step-number">2</td>
              <td>Develop improvement plan with measurable KPIs</td>
              <td>CEO / Managing Partner</td>
              <td>Week 2-3</td>
              <td>Strategic initiative roadmap</td>
            </tr>
            <tr>
              <td class="step-number">3</td>
              <td>Implement quick wins within first 30 days</td>
              <td>CEO / Managing Partner</td>
              <td>Week 3-4</td>
              <td>Quick wins completion report</td>
            </tr>
            <tr>
              <td class="step-number">4</td>
              <td>Monitor progress and adjust approach</td>
              <td>CEO / Managing Partner</td>
              <td>Week 4-5</td>
              <td>Progress dashboard update</td>
            </tr>
            <tr>
              <td class="step-number">5</td>
              <td>Document and share best practices</td>
              <td>CEO / Managing Partner</td>
              <td>Week 5-6</td>
              <td>Best practices playbook</td>
            </tr>
            <tr class="baseline-row">
              <td colspan="2"><strong>Success Baseline</strong></td>
              <td colspan="3">Current: 45/100 | Target: 65/100 | Measurement: Quarterly BizHealth.ai reassessment</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="checkpoint-box">
        <h5>📍 Go/No-Go Checkpoints</h5>
        <table class="checkpoint-table">
          <tr>
            <td><strong>Day 30:</strong></td>
            <td>Assessment complete + improvement plan documented → PROCEED or REVISE APPROACH</td>
          </tr>
          <tr>
            <td><strong>Day 60:</strong></td>
            <td>Quick wins implemented + initial metrics captured → PROCEED TO PHASE 2 or PIVOT</td>
          </tr>
        </table>
      </div>

      <div class="cross-ref-links" style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #e0e0e0; font-size: 0.9rem;">
        <span style="font-weight: 600;">Related Sections:</span>
        <a href="#chapter-growth-engine" style="margin-left: 0.5rem;">Section 5.1: Strategy Analysis</a> |
        <span>Owner's Report Section 4.1: Strategic Priorities</span>
      </div>
    </div>

    <!-- AQ-02: Marketing -->
    <div class="appendix-action-card" id="aq-02">
      <div class="appendix-action-card-header">
        <h4 class="appendix-action-card-title">
          <span class="appendix-action-card-id">AQ-02</span>
          Optimize Marketing Capabilities and Processes
        </h4>
        <span class="roi-badge moderate">1.02x ROI</span>
      </div>

      <div class="action-card-meta" style="display: flex; gap: 1.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
        <div class="meta-item"><strong>Category:</strong> Marketing</div>
        <div class="meta-item"><strong>Impact:</strong> 51/100</div>
        <div class="meta-item"><strong>Effort:</strong> 50/100</div>
        <div class="meta-item"><strong>Timeframe:</strong> 30-60 days</div>
      </div>

      <div style="margin-bottom: 1rem;">
        <h5 style="color: #212653; margin-bottom: 0.5rem;">Current State</h5>
        <p>Marketing shows moderate performance at <strong>49/100</strong> (38th percentile among
        professional services firms). Strong customer targeting provides foundation for improvement.</p>
      </div>

      <div style="margin-bottom: 1rem;">
        <h5 style="color: #212653; margin-bottom: 0.5rem;">Target Outcome</h5>
        <p>Improve Marketing score from <strong>49 → 69</strong> within 6 months, moving from
        38th percentile to <strong>75th percentile</strong>—positioning Sterling as a marketing
        leader in the professional services space.</p>
      </div>

      <div style="margin-bottom: 1rem;">
        <h5 style="color: #212653; margin-bottom: 0.5rem;">Business Impact</h5>
        <p>At 1.02x ROI, this provides positive returns that justify the implementation investment.
        Improving marketing from the current score of 49/100 will strengthen your overall Growth Engine performance.</p>
      </div>

      <div style="margin-bottom: 1rem;">
        <h5 style="color: #212653; margin-bottom: 0.5rem;">Implementation Steps</h5>
        <table class="implementation-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Action</th>
              <th>Owner</th>
              <th>Timeline</th>
              <th>Deliverable</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="step-number">1</td>
              <td>Conduct detailed marketing assessment</td>
              <td>Marketing Director</td>
              <td>Week 1-2</td>
              <td>Marketing audit report</td>
            </tr>
            <tr>
              <td class="step-number">2</td>
              <td>Develop improvement plan with measurable KPIs</td>
              <td>Marketing Director</td>
              <td>Week 2-3</td>
              <td>Marketing optimization plan</td>
            </tr>
            <tr>
              <td class="step-number">3</td>
              <td>Implement quick wins within first 30 days</td>
              <td>Marketing Director</td>
              <td>Week 3-4</td>
              <td>Campaign launch report</td>
            </tr>
            <tr>
              <td class="step-number">4</td>
              <td>Monitor progress and adjust approach</td>
              <td>Marketing Director</td>
              <td>Week 4-5</td>
              <td>Marketing metrics dashboard</td>
            </tr>
            <tr>
              <td class="step-number">5</td>
              <td>Document and share best practices</td>
              <td>Marketing Director</td>
              <td>Week 5-6</td>
              <td>Marketing playbook</td>
            </tr>
            <tr class="baseline-row">
              <td colspan="2"><strong>Success Baseline</strong></td>
              <td colspan="3">Current: 49/100 | Target: 69/100 | Measurement: Quarterly BizHealth.ai reassessment</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="checkpoint-box">
        <h5>📍 Go/No-Go Checkpoints</h5>
        <table class="checkpoint-table">
          <tr>
            <td><strong>Day 30:</strong></td>
            <td>Marketing audit complete + optimization plan documented → PROCEED or REVISE APPROACH</td>
          </tr>
          <tr>
            <td><strong>Day 60:</strong></td>
            <td>Campaigns launched + initial leads generated → PROCEED TO PHASE 2 or PIVOT</td>
          </tr>
        </table>
      </div>

      <div class="cross-ref-links" style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #e0e0e0; font-size: 0.9rem;">
        <span style="font-weight: 600;">Related Sections:</span>
        <a href="#chapter-growth-engine" style="margin-left: 0.5rem;">Section 5.3: Marketing Effectiveness</a> |
        <span>Owner's Report Section 4.2: Revenue Growth</span>
      </div>
    </div>

    <!-- AQ-03: Technology -->
    <div class="appendix-action-card" id="aq-03">
      <div class="appendix-action-card-header">
        <h4 class="appendix-action-card-title">
          <span class="appendix-action-card-id">AQ-03</span>
          Optimize Technology & Innovation Capabilities
        </h4>
        <span class="roi-badge low-return">0.82x ROI</span>
      </div>

      <div class="action-card-meta" style="display: flex; gap: 1.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
        <div class="meta-item"><strong>Category:</strong> Technology & Innovation</div>
        <div class="meta-item"><strong>Impact:</strong> 41/100</div>
        <div class="meta-item"><strong>Effort:</strong> 50/100</div>
        <div class="meta-item"><strong>Timeframe:</strong> 30-60 days</div>
      </div>

      <div style="margin-bottom: 1rem;">
        <h5 style="color: #212653; margin-bottom: 0.5rem;">Current State</h5>
        <p>Technology & Innovation shows moderate performance at <strong>59/100</strong> (52nd percentile
        among professional services firms). Strong technology investment provides foundation for further optimization.</p>
      </div>

      <div style="margin-bottom: 1rem;">
        <h5 style="color: #212653; margin-bottom: 0.5rem;">Target Outcome</h5>
        <p>Improve Technology & Innovation score from <strong>59 → 79</strong> within 6 months, moving from
        52nd percentile to <strong>85th percentile</strong>—positioning Sterling as a technology leader.</p>
      </div>

      <div style="margin-bottom: 1rem;">
        <h5 style="color: #212653; margin-bottom: 0.5rem;">Business Impact</h5>
        <p>While the ROI of 0.82x is below breakeven, this initiative may provide strategic value or enable
        other high-ROI initiatives. Improving technology & innovation from the current score of 59/100 will
        strengthen your overall Resilience & Safeguards performance.</p>
      </div>

      <div style="margin-bottom: 1rem;">
        <h5 style="color: #212653; margin-bottom: 0.5rem;">Implementation Steps</h5>
        <table class="implementation-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Action</th>
              <th>Owner</th>
              <th>Timeline</th>
              <th>Deliverable</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="step-number">1</td>
              <td>Conduct detailed technology & innovation assessment</td>
              <td>CTO / Technology Director</td>
              <td>Week 1-2</td>
              <td>Technology gap analysis</td>
            </tr>
            <tr>
              <td class="step-number">2</td>
              <td>Develop improvement plan with measurable KPIs</td>
              <td>CTO / Technology Director</td>
              <td>Week 2-3</td>
              <td>Technology roadmap</td>
            </tr>
            <tr>
              <td class="step-number">3</td>
              <td>Implement quick wins within first 30 days</td>
              <td>CTO / Technology Director</td>
              <td>Week 3-4</td>
              <td>Quick wins implementation log</td>
            </tr>
            <tr>
              <td class="step-number">4</td>
              <td>Monitor progress and adjust approach</td>
              <td>CTO / Technology Director</td>
              <td>Week 4-5</td>
              <td>Technology metrics dashboard</td>
            </tr>
            <tr>
              <td class="step-number">5</td>
              <td>Document and share best practices</td>
              <td>CTO / Technology Director</td>
              <td>Week 5-6</td>
              <td>Technology standards guide</td>
            </tr>
            <tr class="baseline-row">
              <td colspan="2"><strong>Success Baseline</strong></td>
              <td colspan="3">Current: 59/100 | Target: 79/100 | Measurement: Quarterly BizHealth.ai reassessment</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="checkpoint-box">
        <h5>📍 Go/No-Go Checkpoints</h5>
        <table class="checkpoint-table">
          <tr>
            <td><strong>Day 30:</strong></td>
            <td>Technology assessment complete + roadmap documented → PROCEED or REVISE APPROACH</td>
          </tr>
          <tr>
            <td><strong>Day 60:</strong></td>
            <td>Quick wins deployed + adoption metrics tracked → PROCEED TO PHASE 2 or PIVOT</td>
          </tr>
        </table>
      </div>

      <div class="cross-ref-links" style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #e0e0e0; font-size: 0.9rem;">
        <span style="font-weight: 600;">Related Sections:</span>
        <a href="#chapter-resilience-safeguards" style="margin-left: 0.5rem;">Section 8.1: Technology & Innovation</a> |
        <span>Owner's Report Section 7.1: Technology Readiness</span>
      </div>
    </div>
  </section>

  <!-- A.4 IMPLEMENTATION TIMELINE -->
  <section id="appendix-a4" class="appendix-section">
    <h3>A.4 Implementation Timeline</h3>

    <div class="timeline-section">
      <div class="timeline-phase" style="display: flex; gap: 1.5rem; margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
        <div class="timeline-marker" style="text-align: center; min-width: 80px;">
          <div class="timeline-days" style="font-size: 1.5rem; font-weight: 700; color: #212653;">0-30</div>
          <div class="timeline-label" style="font-size: 0.85rem; color: #666;">Days</div>
        </div>
        <div class="timeline-content" style="flex: 1;">
          <h4 style="color: #212653; margin-bottom: 0.5rem;">Quick Start Phase</h4>
          <p style="font-size: 0.95rem; color: #666; margin-bottom: 0.75rem;">Foundation building and quick wins implementation</p>
          <ul style="margin: 0; padding-left: 1.25rem;">
            <li>Complete strategy and marketing assessments</li>
            <li>Document improvement plans with KPIs</li>
            <li>Initiate technology infrastructure review</li>
            <li>Identify and execute immediate quick wins</li>
          </ul>
        </div>
      </div>

      <div class="timeline-phase" style="display: flex; gap: 1.5rem; margin-bottom: 1.5rem; padding: 1rem; background: rgba(150, 148, 35, 0.08); border-radius: 8px;">
        <div class="timeline-marker" style="text-align: center; min-width: 80px;">
          <div class="timeline-days" style="font-size: 1.5rem; font-weight: 700; color: #212653;">30-60</div>
          <div class="timeline-label" style="font-size: 0.85rem; color: #666;">Days</div>
        </div>
        <div class="timeline-content" style="flex: 1;">
          <h4 style="color: #212653; margin-bottom: 0.5rem;">Momentum Building Phase</h4>
          <p style="font-size: 0.95rem; color: #666; margin-bottom: 0.75rem;">Building on early wins and expanding scope</p>
          <ul style="margin: 0; padding-left: 1.25rem;">
            <li><strong>Strategy Optimization</strong> (CEO / Managing Partner)</li>
            <li><strong>Marketing Enhancement</strong> (Marketing Director)</li>
            <li><strong>Technology & Innovation</strong> (CTO / Technology Director)</li>
          </ul>
        </div>
      </div>

      <div class="timeline-phase" style="display: flex; gap: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
        <div class="timeline-marker" style="text-align: center; min-width: 80px;">
          <div class="timeline-days" style="font-size: 1.5rem; font-weight: 700; color: #212653;">60-90</div>
          <div class="timeline-label" style="font-size: 0.85rem; color: #666;">Days</div>
        </div>
        <div class="timeline-content" style="flex: 1;">
          <h4 style="color: #212653; margin-bottom: 0.5rem;">Value Realization Phase</h4>
          <p style="font-size: 0.95rem; color: #666; margin-bottom: 0.75rem;">Completing initiatives and measuring outcomes</p>
          <ul style="margin: 0; padding-left: 1.25rem;">
            <li>Measure results against baseline KPIs</li>
            <li>Document lessons learned and best practices</li>
            <li>Plan Phase 2 initiatives based on outcomes</li>
            <li>Schedule follow-up BizHealth.ai reassessment</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="dependencies-callout">
      <h4>⚠️ Critical Dependencies</h4>
      <ul>
        <li><strong>Strategy → Marketing:</strong> Marketing initiative effectiveness depends on
        strategic clarity. Begin marketing optimization in Week 3 after strategy assessment complete.</li>
        <li><strong>Technology → Both:</strong> Technology infrastructure improvements should
        proceed in parallel but are not blockers for initial phases of other initiatives.</li>
        <li><strong>Resource Constraint:</strong> All three initiatives assume CEO/Managing Partner
        can allocate 5-8 hours/week to oversight. If availability is limited, sequence rather than parallelize.</li>
      </ul>
    </div>
  </section>

  <!-- A.5 FINANCIAL PROJECTIONS -->
  <section id="appendix-a5" class="appendix-section">
    <h3>A.5 Financial Projections</h3>

    <table class="financial-projections-table">
      <thead>
        <tr>
          <th>Initiative</th>
          <th>Investment Required</th>
          <th>Expected Annual Return</th>
          <th>ROI</th>
          <th>Payback Period</th>
          <th>Confidence</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Strategy Optimization</td>
          <td>$15,000 - $25,000</td>
          <td>$27,500</td>
          <td>1.1x</td>
          <td>9-11 months</td>
          <td>±10%</td>
        </tr>
        <tr>
          <td>Marketing Enhancement</td>
          <td>$20,000 - $35,000</td>
          <td>$28,050</td>
          <td>1.02x</td>
          <td>11-13 months</td>
          <td>±15%</td>
        </tr>
        <tr>
          <td>Technology & Innovation</td>
          <td>$25,000 - $40,000</td>
          <td>$26,650</td>
          <td>0.82x</td>
          <td>14-18 months</td>
          <td>±20%</td>
        </tr>
        <tr class="total-row">
          <td><strong>Combined Total</strong></td>
          <td><strong>$60,000 - $100,000</strong></td>
          <td><strong>$82,200</strong></td>
          <td><strong>0.98x (Year 1)</strong></td>
          <td><strong>12-14 months</strong></td>
          <td>—</td>
        </tr>
      </tbody>
    </table>

    <div class="assumptions-callout">
      <h5>Key Assumptions</h5>
      <ul>
        <li>Investment ranges reflect professional services market rates for similar initiatives</li>
        <li>Returns assume successful implementation and 80% achievement of target outcomes</li>
        <li>Year 2+ returns typically increase 20-30% as initiatives mature</li>
        <li>Combined ROI becomes positive (>1.0x) by end of Year 2</li>
      </ul>
    </div>
  </section>

  <!-- A.6 PROGRESS TRACKING WORKSHEET -->
  <section id="appendix-a6" class="appendix-section worksheet-section">
    <h3>A.6 Progress Tracking Worksheet</h3>
    <p style="font-size: 0.95rem; color: #666; margin-bottom: 1rem;">
      Use this worksheet to track progress on your Accelerated Action initiatives.
    </p>
    <table class="worksheet-table" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="width: 30%; background: #212653; color: #fff; padding: 0.75rem;">Initiative</th>
          <th style="width: 12%; background: #212653; color: #fff; padding: 0.75rem;">Owner</th>
          <th style="width: 12%; background: #212653; color: #fff; padding: 0.75rem;">Start Date</th>
          <th style="width: 12%; background: #212653; color: #fff; padding: 0.75rem;">Target Date</th>
          <th style="width: 12%; background: #212653; color: #fff; padding: 0.75rem;">Status</th>
          <th style="width: 22%; background: #212653; color: #fff; padding: 0.75rem;">Notes / Results</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;">Optimize strategy capabilities and processes</td>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;"><div class="input-field" style="min-height: 24px; border: 1px dashed #ccc; border-radius: 4px;"></div></td>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;"><div class="input-field" style="min-height: 24px; border: 1px dashed #ccc; border-radius: 4px;"></div></td>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;"><div class="input-field" style="min-height: 24px; border: 1px dashed #ccc; border-radius: 4px;"></div></td>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;"><div class="input-field" style="min-height: 24px; border: 1px dashed #ccc; border-radius: 4px;"></div></td>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;"><div class="input-field" style="min-height: 40px; border: 1px dashed #ccc; border-radius: 4px;"></div></td>
        </tr>
        <tr>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;">Optimize marketing capabilities and processes</td>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;"><div class="input-field" style="min-height: 24px; border: 1px dashed #ccc; border-radius: 4px;"></div></td>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;"><div class="input-field" style="min-height: 24px; border: 1px dashed #ccc; border-radius: 4px;"></div></td>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;"><div class="input-field" style="min-height: 24px; border: 1px dashed #ccc; border-radius: 4px;"></div></td>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;"><div class="input-field" style="min-height: 24px; border: 1px dashed #ccc; border-radius: 4px;"></div></td>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;"><div class="input-field" style="min-height: 40px; border: 1px dashed #ccc; border-radius: 4px;"></div></td>
        </tr>
        <tr>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;">Optimize technology & innovation capabilities</td>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;"><div class="input-field" style="min-height: 24px; border: 1px dashed #ccc; border-radius: 4px;"></div></td>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;"><div class="input-field" style="min-height: 24px; border: 1px dashed #ccc; border-radius: 4px;"></div></td>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;"><div class="input-field" style="min-height: 24px; border: 1px dashed #ccc; border-radius: 4px;"></div></td>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;"><div class="input-field" style="min-height: 24px; border: 1px dashed #ccc; border-radius: 4px;"></div></td>
          <td style="padding: 0.75rem; border-bottom: 1px solid #e0e0e0;"><div class="input-field" style="min-height: 40px; border: 1px dashed #ccc; border-radius: 4px;"></div></td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- A.7 RISK MITIGATION -->
  <section id="appendix-a7" class="appendix-section">
    <h3>A.7 Risk Mitigation & Contingency Plans</h3>

    <p>Every strategic initiative carries implementation risks. The following framework identifies
    primary risks for each priority initiative and provides pre-planned mitigation and contingency strategies.</p>

    <table class="risk-mitigation-table">
      <thead>
        <tr>
          <th style="width: 18%;">Initiative</th>
          <th style="width: 22%;">Primary Risk</th>
          <th style="width: 12%;">Likelihood</th>
          <th style="width: 24%;">Mitigation Strategy</th>
          <th style="width: 24%;">Contingency Plan</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td rowspan="2"><strong>Strategy</strong></td>
          <td>Partnership misalignment on growth targets</td>
          <td><span class="risk-medium">Medium</span></td>
          <td>Facilitate structured workshop with all partners in Week 2</td>
          <td>Engage external facilitator or executive coach for consensus-building</td>
        </tr>
        <tr>
          <td>Competing priorities divert leadership attention</td>
          <td><span class="risk-high">High</span></td>
          <td>Block dedicated strategy time on calendars; delegate operational tasks</td>
          <td>Extend timeline to 90 days; reduce scope to single strategic priority</td>
        </tr>
        <tr>
          <td rowspan="2"><strong>Marketing</strong></td>
          <td>Budget constraints limit channel expansion</td>
          <td><span class="risk-medium">Medium</span></td>
          <td>Start with lowest-cost channels (content, referrals); prove ROI before scaling</td>
          <td>Focus on single highest-performing channel; defer multi-channel expansion</td>
        </tr>
        <tr>
          <td>Difficulty measuring attribution/ROI</td>
          <td><span class="risk-medium">Medium</span></td>
          <td>Implement tracking systems before campaign launch</td>
          <td>Use proxy metrics (leads, inquiries) if direct attribution unavailable</td>
        </tr>
        <tr>
          <td rowspan="2"><strong>Technology</strong></td>
          <td>Integration complexity exceeds estimates</td>
          <td><span class="risk-high">High</span></td>
          <td>Start with standalone tools; phase integration over 6 months</td>
          <td>Accept manual workarounds for Year 1; automate in Year 2</td>
        </tr>
        <tr>
          <td>Staff resistance to new systems</td>
          <td><span class="risk-medium">Medium</span></td>
          <td>Involve key users in selection; provide robust training</td>
          <td>Implement parallel systems; allow gradual transition</td>
        </tr>
      </tbody>
    </table>

    <div class="stop-loss-callout">
      <h5>⛔ Stop-Loss Decision Points</h5>
      <p>If implementation shows no measurable progress by Day 45:</p>
      <ul>
        <li><strong>Strategy:</strong> If partnership alignment not achieved, engage external advisor</li>
        <li><strong>Marketing:</strong> If no leads generated, pivot to referral program focus</li>
        <li><strong>Technology:</strong> If adoption &lt;30%, pause rollout and reassess approach</li>
      </ul>
    </div>
  </section>

  <!-- A.8 CROSS-REFERENCE GUIDE -->
  <section id="appendix-a8" class="appendix-section">
    <h3>A.8 Cross-Reference Guide</h3>

    <p>This appendix integrates with your complete Business Health Assessment. Use this guide
    to navigate between action plans and supporting analysis.</p>

    <table class="appendix-xref-table">
      <thead>
        <tr>
          <th>Initiative</th>
          <th>Appendix A Section</th>
          <th>Comprehensive Report</th>
          <th>Owner's Report</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Strategy</strong></td>
          <td><a href="#aq-01">A.3: AQ-01</a></td>
          <td><a href="#chapter-growth-engine">Section 5.1: Strategy Analysis</a><br/>Section 12.1: Growth Engine Synthesis</td>
          <td>Section 4.1: Strategic Priorities</td>
        </tr>
        <tr>
          <td><strong>Marketing</strong></td>
          <td><a href="#aq-02">A.3: AQ-02</a></td>
          <td><a href="#chapter-growth-engine">Section 5.3: Marketing Effectiveness</a><br/>Section 6.1: Customer Acquisition</td>
          <td>Section 4.2: Revenue Growth</td>
        </tr>
        <tr>
          <td><strong>Technology</strong></td>
          <td><a href="#aq-03">A.3: AQ-03</a></td>
          <td><a href="#chapter-resilience-safeguards">Section 8.1: Technology & Innovation</a><br/>Section 11.3: Digital Infrastructure</td>
          <td>Section 7.1: Technology Readiness</td>
        </tr>
      </tbody>
    </table>

    <div class="navigation-tip">
      <p><strong>💡 Navigation Tip:</strong> In the PDF version, click any section reference to
      jump directly to the relevant analysis. For printed copies, use the Table of Contents
      page numbers.</p>
    </div>
  </section>
</section>
`;

// ============================================================================
// TOC ENTRY FOR APPENDIX A
// ============================================================================
const appendixTocEntry = `<li><a href="#appendix-a">Appendix A: Accelerated Action Plan</a></li>`;

// ============================================================================
// PROCESS COMPREHENSIVE.HTML
// ============================================================================

// 1. Insert CSS before </style>
let integratedComprehensive = comprehensiveHtml.replace(
  '</style>',
  appendixACss + '\n  </style>'
);

// 2. Update Table of Contents - Add Appendix A after the last TOC entry
integratedComprehensive = integratedComprehensive.replace(
  /<li><a href="#financial-impact-analysis">Financial Impact Analysis<\/a><\/li>/,
  '<li><a href="#financial-impact-analysis">Financial Impact Analysis</a></li>' + appendixTocEntry
);

// 3. Insert Appendix A content before the footer section
integratedComprehensive = integratedComprehensive.replace(
  '<footer class="report-footer">',
  appendixAContent + '\n    <footer class="report-footer">'
);

// ============================================================================
// PROCESS OWNER.HTML
// ============================================================================

// 1. Update references to Quick Wins Plan
let updatedOwner = ownerHtml.replace(
  /<strong>Quick Wins Plan<\/strong>\s*<span>Immediate opportunities<\/span>/g,
  '<strong>Appendix A: Action Plan</strong><span>Integrated in Comprehensive Report</span>'
);

// 2. Update "Review the Quick Wins section" reference
updatedOwner = updatedOwner.replace(
  /Review the Quick Wins section above/g,
  'See Comprehensive Report, Appendix A: Accelerated Action Plan'
);

// 3. Add reference box to the "What do I do now" section
const appendixReferenceBox = `
      <div class="appendix-reference-box" style="
        background: linear-gradient(135deg, #212653 0%, #2a3270 100%);
        color: #fff;
        padding: 1.25rem;
        border-radius: 8px;
        margin: 1.5rem 0;
      ">
        <h4 style="color: #fff; margin-bottom: 0.5rem;">📋 Your Implementation Roadmap</h4>
        <p style="margin: 0;">For detailed 90-day action plans with implementation steps, success metrics,
        risk mitigation strategies, and progress tracking worksheets, see
        <strong>Comprehensive Report, Appendix A: Accelerated Action Plan</strong>.</p>
      </div>
`;

// Insert after the "What do I do now" section intro
updatedOwner = updatedOwner.replace(
  /<em>"What do I do now\?"<\/em>\s*<\/p>\s*<\/div>\s*<\/div>\s*<div class="callout success">/,
  '<em>"What do I do now?"</em></p>\n      </div>\n    </div>\n' + appendixReferenceBox + '\n      <div class="callout success">'
);

// ============================================================================
// WRITE OUTPUT FILES
// ============================================================================

fs.writeFileSync(path.join(OUTPUT_DIR, 'comprehensive-integrated.html'), integratedComprehensive);
fs.writeFileSync(path.join(OUTPUT_DIR, 'owner-updated.html'), updatedOwner);

console.log('✅ Integration complete!');
console.log('📄 Output files:');
console.log('   - ' + path.join(OUTPUT_DIR, 'comprehensive-integrated.html'));
console.log('   - ' + path.join(OUTPUT_DIR, 'owner-updated.html'));

// Validate outputs
const integratedSize = fs.statSync(path.join(OUTPUT_DIR, 'comprehensive-integrated.html')).size;
const ownerSize = fs.statSync(path.join(OUTPUT_DIR, 'owner-updated.html')).size;

console.log('\n📊 File sizes:');
console.log('   - comprehensive-integrated.html: ' + (integratedSize / 1024).toFixed(1) + ' KB');
console.log('   - owner-updated.html: ' + (ownerSize / 1024).toFixed(1) + ' KB');

// Verify key content
const hasAppendixA = integratedComprehensive.includes('id="appendix-a"');
const hasTocEntry = integratedComprehensive.includes('Appendix A: Accelerated Action Plan');
const hasMethodology = integratedComprehensive.includes('A.1 Selection Methodology');
const hasRiskMitigation = integratedComprehensive.includes('A.7 Risk Mitigation');

console.log('\n✓ Validation:');
console.log('   - Appendix A section: ' + (hasAppendixA ? '✅' : '❌'));
console.log('   - TOC entry: ' + (hasTocEntry ? '✅' : '❌'));
console.log('   - A.1 Methodology: ' + (hasMethodology ? '✅' : '❌'));
console.log('   - A.7 Risk Mitigation: ' + (hasRiskMitigation ? '✅' : '❌'));
