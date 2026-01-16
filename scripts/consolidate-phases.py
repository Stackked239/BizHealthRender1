#!/usr/bin/env python3
"""
BizHealth.ai Phase Consolidation Script
Combines Phase 1-4 outputs into a single unified JSON file with cross-phase analytics
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
import argparse


class PhaseConsolidator:
    """
    Consolidates Phase 1-4 analysis results into unified JSON output
    """

    def __init__(self, phase_paths: Dict[str, str]):
        """Initialize with paths to phase output files"""
        self.phase_paths = phase_paths
        self.phases = {}
        self.company_profile_id = None

    def load_phases(self) -> None:
        """Load all phase JSON files with validation"""
        print("📂 Loading phase outputs...")

        for phase_num in [1, 2, 3, 4]:
            phase_key = f"phase{phase_num}"
            path = self.phase_paths.get(phase_key)

            if not path:
                print(f"⚠️  Phase {phase_num} path not provided - will be omitted")
                continue

            try:
                with open(path, 'r') as f:
                    data = json.load(f)
                    self.phases[phase_key] = data

                    # Extract and validate company_profile_id
                    profile_id = data.get('company_profile_id')
                    if profile_id:
                        if self.company_profile_id is None:
                            self.company_profile_id = profile_id
                        elif self.company_profile_id != profile_id:
                            print(f"⚠️  Warning: Phase {phase_num} has different company_profile_id")

                print(f"✓ Phase {phase_num}: {Path(path).name}")

            except FileNotFoundError:
                print(f"❌ Phase {phase_num} file not found: {path}")
            except json.JSONDecodeError as e:
                print(f"❌ Phase {phase_num} JSON parse error: {e}")
            except Exception as e:
                print(f"❌ Phase {phase_num} load error: {e}")

        if not self.phases:
            raise ValueError("No phase data loaded - cannot consolidate")

        print(f"\n✅ Loaded {len(self.phases)} phase(s)")

    def extract_cross_phase_metrics(self) -> Dict[str, Any]:
        """Extract metrics that span multiple phases"""
        metrics = {
            "phases_included": list(self.phases.keys()),
            "data_completeness": {
                "phase1": "phase1" in self.phases,
                "phase2": "phase2" in self.phases,
                "phase3": "phase3" in self.phases,
                "phase4": "phase4" in self.phases,
            },
            "execution_timeline": self._extract_timeline(),
            "analysis_summary": self._extract_analysis_summary(),
        }

        return metrics

    def _extract_timeline(self) -> Dict[str, Any]:
        """Extract execution timeline from phase metadata"""
        timeline = {}

        for phase_key, data in self.phases.items():
            metadata = data.get('metadata', {})

            if phase_key in ['phase1', 'phase2', 'phase3']:
                timeline[phase_key] = {
                    "started_at": metadata.get('started_at'),
                    "completed_at": metadata.get('completed_at'),
                    "duration_ms": metadata.get('total_duration_ms'),
                    "successful_analyses": metadata.get('successful_analyses'),
                    "total_analyses": metadata.get('total_analyses'),
                }
            elif phase_key == 'phase4':
                timeline[phase_key] = {
                    "compiled_at": metadata.get('compiled_at'),
                    "compiler_version": metadata.get('compiler_version'),
                }

        return timeline

    def _extract_analysis_summary(self) -> Dict[str, Any]:
        """Extract high-level analysis summary"""
        summary = {}

        # Phase 1 summary
        if 'phase1' in self.phases:
            phase1_summary = self.phases['phase1'].get('summary', {})
            summary['tier1_analyses'] = {
                "overall_tier1_score": phase1_summary.get('overall_tier1_score'),
                "completed_count": phase1_summary.get('completed_tier1_count'),
            }

        # Phase 2 summary
        if 'phase2' in self.phases:
            phase2_summary = self.phases['phase2'].get('summary', {})
            summary['tier2_analyses'] = {
                "integration_readiness": phase2_summary.get('integration_readiness_score'),
                "strategic_alignment": phase2_summary.get('strategic_alignment_score'),
            }

        # Phase 3 summary
        if 'phase3' in self.phases:
            phase3_summary = self.phases['phase3'].get('summary', {})
            summary['executive_synthesis'] = {
                "overall_health_score": phase3_summary.get('overall_health_score'),
                "health_status": phase3_summary.get('health_status'),
                "critical_risks_count": phase3_summary.get('critical_risks_count'),
                "high_priority_actions_count": phase3_summary.get('high_priority_actions_count'),
            }

        # Phase 4 summary
        if 'phase4' in self.phases:
            phase4_summaries = self.phases['phase4'].get('summaries', {})
            summary['strategic_intelligence'] = {
                "health_score": phase4_summaries.get('health_status', {}).get('score'),
                "health_descriptor": phase4_summaries.get('health_status', {}).get('descriptor'),
                "strength_summary": phase4_summaries.get('strength_summary'),
                "challenge_summary": phase4_summaries.get('challenge_summary'),
                "findings_count": len(phase4_summaries.get('findings', [])),
                "imperatives_count": len(phase4_summaries.get('imperatives', [])),
            }

        return summary

    def consolidate(self) -> Dict[str, Any]:
        """Create consolidated output structure"""
        print("\n🔄 Consolidating phase data...")

        consolidated = {
            "format_version": "1.0.0",
            "consolidation_type": "complete_analysis",
            "company_profile_id": self.company_profile_id,
            "consolidated_at": datetime.now().isoformat() + "Z",
            "metadata": {
                "phases_included": list(self.phases.keys()),
                "total_phases": len(self.phases),
                "consolidation_timestamp": datetime.now().isoformat() + "Z",
            },
            "cross_phase_metrics": self.extract_cross_phase_metrics(),
            "phases": self.phases,
        }

        print("✅ Consolidation complete")
        return consolidated

    def save(self, output_path: Optional[str] = None) -> str:
        """Save consolidated output"""
        if output_path is None:
            # Auto-generate filename
            timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S-%f")[:-3] + "Z"
            filename = f"consolidated-analysis-{self.company_profile_id}-{timestamp}.json"
            output_dir = Path("output/consolidated")
            output_dir.mkdir(parents=True, exist_ok=True)
            output_path = str(output_dir / filename)

        consolidated_data = self.consolidate()

        with open(output_path, 'w') as f:
            json.dump(consolidated_data, f, indent=2)

        file_size = Path(output_path).stat().st_size
        print(f"\n📄 Output saved: {output_path}")
        print(f"📊 File size: {file_size:,} bytes ({file_size / 1024:.1f} KB)")

        return output_path


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Consolidate BizHealth.ai Phase 1-4 outputs into unified JSON",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Consolidate all 4 phases
  python consolidate-phases.py \\
    --phase1 output/phase1/phase1-results-xxx.json \\
    --phase2 output/phase2/phase2-results-xxx.json \\
    --phase3 output/phase3/phase3-results-xxx.json \\
    --phase4 output/phase4/phase4-summaries-xxx.json

  # Consolidate with custom output path
  python consolidate-phases.py \\
    --phase1 output/phase1/phase1-results-xxx.json \\
    --phase2 output/phase2/phase2-results-xxx.json \\
    --phase3 output/phase3/phase3-results-xxx.json \\
    --output custom-output.json

  # Consolidate only Phase 1-3 (Phase 4 optional)
  python consolidate-phases.py \\
    --phase1 output/phase1/phase1-results-xxx.json \\
    --phase2 output/phase2/phase2-results-xxx.json \\
    --phase3 output/phase3/phase3-results-xxx.json
        """
    )

    parser.add_argument('--phase1', type=str, help='Path to Phase 1 JSON output')
    parser.add_argument('--phase2', type=str, help='Path to Phase 2 JSON output')
    parser.add_argument('--phase3', type=str, help='Path to Phase 3 JSON output')
    parser.add_argument('--phase4', type=str, help='Path to Phase 4 JSON output (optional)')
    parser.add_argument('--output', '-o', type=str, help='Output file path (default: auto-generated)')

    args = parser.parse_args()

    # Validate at least one phase provided
    if not any([args.phase1, args.phase2, args.phase3, args.phase4]):
        parser.error("At least one phase file must be provided")

    print("🚀 BizHealth.ai Phase Consolidation")
    print("=" * 50)

    # Build phase paths dict
    phase_paths = {}
    if args.phase1:
        phase_paths['phase1'] = args.phase1
    if args.phase2:
        phase_paths['phase2'] = args.phase2
    if args.phase3:
        phase_paths['phase3'] = args.phase3
    if args.phase4:
        phase_paths['phase4'] = args.phase4

    try:
        # Execute consolidation
        consolidator = PhaseConsolidator(phase_paths)
        consolidator.load_phases()
        output_path = consolidator.save(args.output)

        print("\n✅ Consolidation successful!")
        print(f"📁 Output: {output_path}")

        # Print summary stats
        with open(output_path) as f:
            data = json.load(f)
            metrics = data.get('cross_phase_metrics', {})
            print(f"\n📊 Summary:")
            print(f"   Phases included: {', '.join(metrics.get('phases_included', []))}")
            print(f"   Company ID: {data.get('company_profile_id')}")

            analysis_summary = metrics.get('analysis_summary', {})
            if 'strategic_intelligence' in analysis_summary:
                si = analysis_summary['strategic_intelligence']
                print(f"   Health Score: {si.get('health_score')}/5.0 ({si.get('health_descriptor')})")
                print(f"   Findings: {si.get('findings_count')}")
                print(f"   Imperatives: {si.get('imperatives_count')}")

    except Exception as e:
        print(f"\n❌ Consolidation failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
