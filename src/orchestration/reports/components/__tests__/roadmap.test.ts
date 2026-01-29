/**
 * Unit Tests for Strategic Implementation Roadmap Components
 *
 * Tests the roadmap data builder, visualizations, and renderer
 *
 * @module roadmap.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildOwnerRoadmapPhases,
  normalizeEffort,
  normalizeImpact,
  getCategoryFromDimension,
  parseCostRange,
  selectTopInitiatives,
} from '../roadmap-data-builder.js';
import {
  generatePhaseTimelineBar,
  generateFullTimelineSVG,
  generateImpactEffortBadge,
  generatePhaseBadge,
  getPhaseColors,
} from '../roadmap-visualizations.js';
import {
  renderStrategicImplementationRoadmap,
  getRoadmapStyles,
} from '../roadmap-renderer.js';
import type { RoadmapItem, OwnerRoadmapPhase, RoadmapDataSources } from '../../../../types/roadmap.types.js';

describe('Strategic Implementation Roadmap', () => {
  // Mock IDM data for testing
  const mockIdm = {
    recommendations: [
      {
        id: 'rec-01',
        theme: 'Improve Strategy Capabilities',
        description: 'Develop systematic strategic planning framework',
        expectedOutcomes: 'Enhanced strategic decision-making and market positioning',
        horizon: '90_days',
        timeframe: 'Immediate',
        effortScore: 45,
        impactScore: 85,
        dimensionCode: 'STR',
        actionSteps: ['Conduct strategic audit', 'Define 3-year vision', 'Create execution roadmap'],
      },
      {
        id: 'rec-02',
        theme: 'Optimize Sales Pipeline',
        description: 'Implement CRM-based pipeline management',
        expectedOutcomes: 'Increased conversion rates and revenue predictability',
        horizon: '12_months',
        effortScore: 60,
        impactScore: 70,
        dimensionCode: 'SAL',
      },
      {
        id: 'rec-03',
        theme: 'Digital Marketing Transformation',
        description: 'Build comprehensive digital marketing capability',
        expectedOutcomes: 'Improved lead generation and brand awareness',
        horizon: '24_months',
        effortScore: 80,
        impactScore: 75,
        dimensionCode: 'MKT',
      },
    ],
    quick_wins: [
      {
        recommendation_id: 'rec-01',
      },
      {
        title: 'Standardize Sales Pipeline',
        description: 'Implement consistent pipeline tracking across all sales reps',
        effort: 'Low',
        impact: 'Medium',
        owner: 'Sales Manager',
      },
    ],
    roadmap: {
      phases: [
        {
          timeHorizon: '0-90 days',
          linked_recommendation_ids: ['rec-01'],
        },
        {
          timeHorizon: '91-180 days',
          linked_recommendation_ids: ['rec-02'],
        },
      ],
    },
  };

  describe('buildOwnerRoadmapPhases', () => {
    it('should build 3 phases', async () => {
      const dataSources: RoadmapDataSources = { idm: mockIdm };
      const phases = await buildOwnerRoadmapPhases(dataSources);

      expect(phases).toHaveLength(3);
      expect(phases[0].phase).toBe(1);
      expect(phases[1].phase).toBe(2);
      expect(phases[2].phase).toBe(3);
    });

    it('should have correct phase titles', async () => {
      const dataSources: RoadmapDataSources = { idm: mockIdm };
      const phases = await buildOwnerRoadmapPhases(dataSources);

      expect(phases[0].title).toContain('Phase 1');
      expect(phases[0].title).toContain('Foundations');
      expect(phases[1].title).toContain('Phase 2');
      expect(phases[2].title).toContain('Phase 3');
    });

    it('should include date ranges', async () => {
      const dataSources: RoadmapDataSources = { idm: mockIdm };
      const phases = await buildOwnerRoadmapPhases(dataSources);

      expect(phases[0].dateRange).toBe('Days 1-90');
      expect(phases[1].dateRange).toBe('Days 91-180');
      expect(phases[2].dateRange).toBe('Days 181-365');
    });

    it('should limit initiatives per phase', async () => {
      const dataSources: RoadmapDataSources = { idm: mockIdm };
      const phases = await buildOwnerRoadmapPhases(dataSources);

      phases.forEach((phase) => {
        expect(phase.topInitiatives.length).toBeLessThanOrEqual(7);
      });
    });

    it('should include owner focus guidance', async () => {
      const dataSources: RoadmapDataSources = { idm: mockIdm };
      const phases = await buildOwnerRoadmapPhases(dataSources);

      phases.forEach((phase) => {
        expect(phase.ownerFocus).toBeTruthy();
        expect(phase.ownerFocus.length).toBeGreaterThan(50);
      });
    });

    it('should handle empty IDM gracefully', async () => {
      const dataSources: RoadmapDataSources = { idm: {} };
      const phases = await buildOwnerRoadmapPhases(dataSources);

      expect(phases).toHaveLength(3);
      // Should return phases with empty initiatives
      phases.forEach((phase) => {
        expect(phase.topInitiatives).toEqual([]);
      });
    });

    it('should handle null IDM with fallback', async () => {
      const dataSources: RoadmapDataSources = { idm: null };
      const phases = await buildOwnerRoadmapPhases(dataSources);

      expect(phases).toHaveLength(3);
    });
  });

  describe('normalizeEffort', () => {
    it('should normalize numeric effort scores', () => {
      expect(normalizeEffort(20)).toBe('Low');
      expect(normalizeEffort(50)).toBe('Medium');
      expect(normalizeEffort(80)).toBe('High');
    });

    it('should normalize string effort values', () => {
      expect(normalizeEffort('low')).toBe('Low');
      expect(normalizeEffort('HIGH')).toBe('High');
      expect(normalizeEffort('Medium')).toBe('Medium');
    });

    it('should default to Medium for undefined', () => {
      expect(normalizeEffort(undefined)).toBe('Medium');
      expect(normalizeEffort(null)).toBe('Medium');
    });
  });

  describe('normalizeImpact', () => {
    it('should normalize numeric impact scores', () => {
      expect(normalizeImpact(30)).toBe('Low');
      expect(normalizeImpact(55)).toBe('Medium');
      expect(normalizeImpact(85)).toBe('High');
    });

    it('should normalize string impact values', () => {
      expect(normalizeImpact('high')).toBe('High');
      expect(normalizeImpact('LOW')).toBe('Low');
    });
  });

  describe('getCategoryFromDimension', () => {
    it('should map dimension codes to categories', () => {
      expect(getCategoryFromDimension('STR')).toBe('Strategy');
      expect(getCategoryFromDimension('SAL')).toBe('Sales');
      expect(getCategoryFromDimension('MKT')).toBe('Marketing');
      expect(getCategoryFromDimension('OPS')).toBe('Operations');
    });

    it('should return General for unknown codes', () => {
      expect(getCategoryFromDimension('XYZ')).toBe('General');
      expect(getCategoryFromDimension(undefined)).toBe('General');
    });
  });

  describe('parseCostRange', () => {
    it('should parse K format ranges', () => {
      expect(parseCostRange('$25K-$50K')).toEqual([25, 50]);
      expect(parseCostRange('15K-30K')).toEqual([15, 30]);
    });

    it('should parse M format ranges', () => {
      expect(parseCostRange('$1M-$2M')).toEqual([1000, 2000]);
    });

    it('should parse single values with range', () => {
      const [min, max] = parseCostRange('$50K');
      expect(min).toBeCloseTo(40, 0);
      expect(max).toBeCloseTo(60, 0);
    });

    it('should return zeros for unparseable values', () => {
      expect(parseCostRange('TBD')).toEqual([0, 0]);
    });
  });

  describe('selectTopInitiatives', () => {
    const mockItems: RoadmapItem[] = [
      {
        id: '1',
        title: 'High Impact Low Effort',
        description: 'Test',
        phase: 1,
        startDay: 0,
        endDay: 90,
        owner: 'CEO',
        effort: 'Low',
        impact: 'High',
        dependencies: [],
      },
      {
        id: '2',
        title: 'Low Impact High Effort',
        description: 'Test',
        phase: 1,
        startDay: 0,
        endDay: 90,
        owner: 'CEO',
        effort: 'High',
        impact: 'Low',
        dependencies: [],
      },
      {
        id: '3',
        title: 'Medium Both',
        description: 'Test',
        phase: 1,
        startDay: 0,
        endDay: 90,
        owner: 'CEO',
        effort: 'Medium',
        impact: 'Medium',
        dependencies: [],
      },
    ];

    it('should prioritize high impact low effort', () => {
      const selected = selectTopInitiatives(mockItems, 2);
      expect(selected[0].id).toBe('1');
    });

    it('should respect max count', () => {
      const selected = selectTopInitiatives(mockItems, 1);
      expect(selected).toHaveLength(1);
    });
  });

  describe('Roadmap Visualizations', () => {
    describe('generatePhaseTimelineBar', () => {
      it('should generate timeline bar for each phase', () => {
        const bar1 = generatePhaseTimelineBar(1);
        const bar2 = generatePhaseTimelineBar(2);
        const bar3 = generatePhaseTimelineBar(3);

        expect(bar1).toContain('phase-timeline');
        expect(bar2).toContain('phase-timeline');
        expect(bar3).toContain('phase-timeline');
      });

      it('should include day markers', () => {
        const bar = generatePhaseTimelineBar(1);
        expect(bar).toContain('Day 0');
        expect(bar).toContain('Day 90');
        expect(bar).toContain('Day 180');
        expect(bar).toContain('Day 365');
      });
    });

    describe('generateFullTimelineSVG', () => {
      it('should generate SVG timeline', () => {
        const svg = generateFullTimelineSVG();
        expect(svg).toContain('<svg');
        expect(svg).toContain('</svg>');
        expect(svg).toContain('Phase 1');
        expect(svg).toContain('Phase 2');
        expect(svg).toContain('Phase 3');
      });
    });

    describe('generateImpactEffortBadge', () => {
      it('should generate badge with impact and effort', () => {
        const badge = generateImpactEffortBadge('High', 'Low');
        expect(badge).toContain('High Impact');
        expect(badge).toContain('Quick');
      });

      it('should use correct colors for impact levels', () => {
        const highBadge = generateImpactEffortBadge('High', 'Medium');
        const lowBadge = generateImpactEffortBadge('Low', 'Medium');
        expect(highBadge).toContain('#28a745');
        expect(lowBadge).toContain('#6c757d');
      });
    });

    describe('generatePhaseBadge', () => {
      it('should generate phase badges', () => {
        const badge1 = generatePhaseBadge(1);
        expect(badge1).toContain('56px');
        expect(badge1).toContain('border-radius: 50%');
      });
    });

    describe('getPhaseColors', () => {
      it('should return correct colors for each phase', () => {
        const colors1 = getPhaseColors(1);
        const colors2 = getPhaseColors(2);
        const colors3 = getPhaseColors(3);

        expect(colors1.primary).toBe('#28a745');
        expect(colors2.primary).toBe('#17a2b8');
        expect(colors3.primary).toBe('#212653');
      });
    });
  });

  describe('Roadmap Renderer', () => {
    describe('renderStrategicImplementationRoadmap', () => {
      const mockPhases: OwnerRoadmapPhase[] = [
        {
          phase: 1,
          title: 'Phase 1: Foundations & Quick Wins',
          dateRange: 'Days 1-90',
          objective: 'Test objective for Phase 1',
          topInitiatives: [
            {
              id: '1',
              title: 'Test Initiative',
              description: 'Test description',
              phase: 1,
              startDay: 0,
              endDay: 90,
              owner: 'CEO/Owner',
              effort: 'Low',
              impact: 'High',
              dependencies: [],
              category: 'Strategy',
            },
          ],
          keyDecisions: [],
          estimatedInvestment: '$25K-50K',
          ownerFocus: 'Test owner focus',
        },
        {
          phase: 2,
          title: 'Phase 2: Scale & Systems',
          dateRange: 'Days 91-180',
          objective: 'Test objective for Phase 2',
          topInitiatives: [],
          keyDecisions: [],
          estimatedInvestment: 'TBD',
          ownerFocus: 'Test owner focus',
        },
        {
          phase: 3,
          title: 'Phase 3: Optimization',
          dateRange: 'Days 181-365',
          objective: 'Test objective for Phase 3',
          topInitiatives: [],
          keyDecisions: [],
          estimatedInvestment: 'TBD',
          ownerFocus: 'Test owner focus',
        },
      ];

      it('should render HTML without errors', () => {
        const html = renderStrategicImplementationRoadmap(mockPhases, 'Test Company');

        expect(html).toContain('Strategic Implementation Roadmap');
        expect(html).toContain('Phase 1');
        expect(html).toContain('Phase 2');
        expect(html).toContain('Phase 3');
      });

      it('should include company name', () => {
        const html = renderStrategicImplementationRoadmap(mockPhases, 'Acme Corp');
        expect(html).toContain('Acme Corp');
      });

      it('should include cross-references to Comprehensive Report', () => {
        const html = renderStrategicImplementationRoadmap(mockPhases);
        expect(html).toContain('Comprehensive Report');
        expect(html).toContain('18-Month Roadmap');
      });

      it('should include 12-month timeline visualization', () => {
        const html = renderStrategicImplementationRoadmap(mockPhases);
        expect(html).toContain('12-Month Implementation Timeline');
        expect(html).toContain('<svg');
      });

      it('should render initiatives with impact/effort badges', () => {
        const html = renderStrategicImplementationRoadmap(mockPhases);
        expect(html).toContain('Test Initiative');
        expect(html).toContain('High Impact');
        expect(html).toContain('Quick');
      });

      it('should include owner focus guidance', () => {
        const html = renderStrategicImplementationRoadmap(mockPhases);
        expect(html).toContain('Owner Focus');
        expect(html).toContain('Test owner focus');
      });

      it('should include estimated investment', () => {
        const html = renderStrategicImplementationRoadmap(mockPhases);
        expect(html).toContain('$25K-50K');
        expect(html).toContain('Estimated Investment');
      });

      it('should include connection block', () => {
        const html = renderStrategicImplementationRoadmap(mockPhases);
        expect(html).toContain('How This Connects to Other Sections');
        expect(html).toContain('Critical Path Actions');
        expect(html).toContain('Quick Wins Dashboard');
      });

      it('should include footer note', () => {
        const html = renderStrategicImplementationRoadmap(mockPhases);
        expect(html).toContain('Review this roadmap monthly');
        expect(html).toContain('organizational capacity');
      });

      it('should escape HTML in initiative titles', () => {
        const phasesWithHtml: OwnerRoadmapPhase[] = [
          {
            ...mockPhases[0],
            topInitiatives: [
              {
                ...mockPhases[0].topInitiatives[0],
                title: 'Initiative with <script>alert("xss")</script>',
              },
            ],
          },
          mockPhases[1],
          mockPhases[2],
        ];

        const html = renderStrategicImplementationRoadmap(phasesWithHtml);
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
      });
    });

    describe('getRoadmapStyles', () => {
      it('should return CSS styles', () => {
        const styles = getRoadmapStyles();
        expect(styles).toContain('.roadmap-phase-card');
        expect(styles).toContain('@media print');
      });
    });
  });
});
