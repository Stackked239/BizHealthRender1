#!/usr/bin/env python3
"""
BizHealth.ai Pipeline Content Gap Investigation Tool
=====================================================
Comprehensive investigation script for diagnosing why reports lack AI narrative content.

USAGE:
    python investigate-pipeline.py [path-to-workflow-export]

    If no path provided, assumes current directory is workflow-export.

OUTPUT:
    - pipeline-investigation-report.json (structured data)
    - INVESTIGATION-SUMMARY.md (human-readable summary)

This is a READ-ONLY investigation tool. No files will be modified.
"""

import json
import os
import sys
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import subprocess


class PipelineInvestigator:
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path).resolve()
        self.output_dir = self.base_path / "output"

        self.report = {
            "metadata": {
                "investigation_date": datetime.now().isoformat(),
                "pipeline_location": str(self.base_path),
                "investigator": "BizHealth Pipeline Investigator v1.0",
                "purpose": "Report Content Gap Root Cause Analysis"
            },
            "directory_structure": {
                "base_path_exists": False,
                "output_dir_exists": False,
                "src_dir_exists": False,
                "all_files": [],
                "report_generation_files": [],
                "template_files": [],
                "phase_output_files": [],
                "idm_files": [],
                "prompt_files": []
            },
            "phase_output_analysis": {},
            "report_generation_analysis": {
                "files_found": [],
                "data_sources_read": [],
                "narrative_fields_referenced": [],
                "score_fields_referenced": [],
                "template_analysis": {}
            },
            "data_flow_trace": {
                "imports_found": [],
                "data_extraction_patterns": [],
                "html_generation_patterns": [],
                "missing_connections": []
            },
            "idm_analysis": {
                "idm_types_found": False,
                "idm_consolidator_found": False,
                "idm_schema": {},
                "narrative_in_idm": False
            },
            "prompt_analysis": {
                "prompts_found": [],
                "output_format_requested": [],
                "narrative_instructions": []
            },
            "root_cause_determination": {
                "primary_cause": "",
                "evidence": [],
                "confidence": "",
                "hypothesis_scores": {}
            },
            "content_inventory": {
                "total_narrative_words_available": 0,
                "total_narrative_chars_available": 0,
                "narrative_by_phase": {},
                "content_sufficient_for_reports": False
            },
            "recommendations": []
        }

    def run_investigation(self):
        """Execute complete investigation"""
        print("=" * 70)
        print("BizHealth.ai Pipeline Content Gap Investigation")
        print("=" * 70)
        print(f"Base Path: {self.base_path}")
        print(f"Timestamp: {self.report['metadata']['investigation_date']}")
        print("=" * 70)

        # Task 1: Directory Structure
        print("\n[1/7] Analyzing directory structure...")
        self.analyze_directory_structure()

        # Task 2: Phase Outputs
        print("\n[2/7] Analyzing phase output files...")
        self.analyze_phase_outputs()

        # Task 3: Report Generation Code
        print("\n[3/7] Analyzing report generation code...")
        self.analyze_report_generation()

        # Task 4: Data Flow
        print("\n[4/7] Tracing data flow...")
        self.trace_data_flow()

        # Task 5: IDM Analysis
        print("\n[5/7] Analyzing IDM consolidator...")
        self.analyze_idm()

        # Task 6: Prompt Analysis
        print("\n[6/7] Analyzing AI prompts...")
        self.analyze_prompts()

        # Task 7: Determine Root Cause
        print("\n[7/7] Determining root cause...")
        self.determine_root_cause()

        # Generate outputs
        print("\n" + "=" * 70)
        print("Generating investigation reports...")
        self.save_reports()

        print("\n✅ Investigation complete!")
        print(f"   - JSON Report: pipeline-investigation-report.json")
        print(f"   - Summary: INVESTIGATION-SUMMARY.md")

        return self.report

    def analyze_directory_structure(self):
        """Map complete project structure"""
        self.report["directory_structure"]["base_path_exists"] = self.base_path.exists()
        self.report["directory_structure"]["output_dir_exists"] = self.output_dir.exists()
        self.report["directory_structure"]["src_dir_exists"] = (self.base_path / "src").exists()

        if not self.base_path.exists():
            print(f"   ❌ Base path not found: {self.base_path}")
            return

        # Find all relevant files
        patterns = {
            "report_generation_files": ["*report*.ts", "*report*.py", "*generator*.ts", "*render*.ts", "*html*.ts"],
            "template_files": ["*.hbs", "*.ejs", "*template*.html", "*template*.ts"],
            "phase_output_files": ["phase*_output.json", "phase*-results*.json"],
            "idm_files": ["*idm*.ts", "*idm*.py", "*idm*.json"],
            "prompt_files": ["*prompt*.ts", "*prompt*.py"]
        }

        for category, globs in patterns.items():
            found = []
            for pattern in globs:
                for f in self.base_path.rglob(pattern):
                    if "node_modules" not in str(f) and ".git" not in str(f):
                        found.append(str(f.relative_to(self.base_path)))
            self.report["directory_structure"][category] = found
            print(f"   Found {len(found)} {category.replace('_', ' ')}")

        # List all TypeScript and Python files
        all_code_files = []
        for ext in ["*.ts", "*.py"]:
            for f in self.base_path.rglob(ext):
                if "node_modules" not in str(f) and ".git" not in str(f):
                    all_code_files.append(str(f.relative_to(self.base_path)))
        self.report["directory_structure"]["all_files"] = all_code_files[:100]  # Limit

    def analyze_phase_outputs(self):
        """Deep analysis of phase output files"""
        if not self.output_dir.exists():
            print(f"   ❌ Output directory not found: {self.output_dir}")
            return

        for phase in range(5):
            phase_key = f"phase{phase}"
            filepath = self.output_dir / f"phase{phase}_output.json"

            if not filepath.exists():
                # Try alternative patterns
                alternatives = list(self.output_dir.glob(f"phase{phase}*.json"))
                if alternatives:
                    filepath = alternatives[0]
                else:
                    self.report["phase_output_analysis"][phase_key] = {
                        "exists": False,
                        "error": "File not found"
                    }
                    print(f"   Phase {phase}: ❌ Not found")
                    continue

            try:
                analysis = self._analyze_single_phase(filepath, phase)
                self.report["phase_output_analysis"][phase_key] = analysis

                # Update content inventory
                self.report["content_inventory"]["total_narrative_words_available"] += analysis.get("total_narrative_words", 0)
                self.report["content_inventory"]["total_narrative_chars_available"] += analysis.get("total_narrative_chars", 0)
                self.report["content_inventory"]["narrative_by_phase"][phase_key] = analysis.get("total_narrative_words", 0)

                words = analysis.get("total_narrative_words", 0)
                fields = analysis.get("narrative_fields_count", 0)
                print(f"   Phase {phase}: ✅ {words:,} narrative words in {fields} fields")

            except Exception as e:
                self.report["phase_output_analysis"][phase_key] = {
                    "exists": True,
                    "error": str(e)
                }
                print(f"   Phase {phase}: ⚠️ Error analyzing: {e}")

        # Check if content is sufficient
        total_words = self.report["content_inventory"]["total_narrative_words_available"]
        self.report["content_inventory"]["content_sufficient_for_reports"] = total_words >= 15000
        print(f"\n   Total narrative content available: {total_words:,} words")

    def _analyze_single_phase(self, filepath: Path, phase: int):
        """Analyze a single phase output file"""
        with open(filepath, 'r') as f:
            data = json.load(f)

        result = {
            "exists": True,
            "filepath": str(filepath.relative_to(self.base_path)),
            "size_bytes": filepath.stat().st_size,
            "top_level_keys": list(data.keys()) if isinstance(data, dict) else ["(list)"],
            "narrative_fields_count": 0,
            "total_narrative_chars": 0,
            "total_narrative_words": 0,
            "narrative_fields": [],
            "score_fields_count": 0,
            "sample_narratives": []
        }

        # Find narrative content
        narratives = self._find_narrative_fields(data)
        result["narrative_fields_count"] = len(narratives)
        result["total_narrative_chars"] = sum(n["char_count"] for n in narratives)
        result["total_narrative_words"] = sum(n["word_count"] for n in narratives)
        result["narrative_fields"] = [n["path"] for n in narratives]
        result["sample_narratives"] = [
            {"path": n["path"], "preview": n["preview"][:300], "words": n["word_count"]}
            for n in narratives[:5]
        ]

        # Find score fields
        scores = self._find_score_fields(data)
        result["score_fields_count"] = len(scores)

        return result

    def _find_narrative_fields(self, data, path="root"):
        """Recursively find narrative/text fields"""
        results = []
        narrative_keys = [
            "analysis_text", "analysistext", "narrative", "insights",
            "summary", "description", "explanation", "rationale",
            "findings", "recommendations", "commentary", "assessment",
            "diagnosis", "synthesis", "content", "text", "analysis",
            "executive_summary", "key_findings", "strategic_insights",
            "overview", "conclusion", "observation", "interpretation",
            "details", "body", "message"
        ]

        if isinstance(data, dict):
            for key, value in data.items():
                current_path = f"{path}.{key}"
                key_lower = key.lower()

                is_narrative = any(nk in key_lower for nk in narrative_keys)

                if is_narrative and isinstance(value, str) and len(value) > 50:
                    results.append({
                        "path": current_path,
                        "key": key,
                        "char_count": len(value),
                        "word_count": len(value.split()),
                        "preview": value[:500]
                    })
                elif isinstance(value, (dict, list)):
                    results.extend(self._find_narrative_fields(value, current_path))

        elif isinstance(data, list):
            for i, item in enumerate(data):
                results.extend(self._find_narrative_fields(item, f"{path}[{i}]"))

        return results

    def _find_score_fields(self, data, path="root"):
        """Find score/numeric fields"""
        results = []
        score_keys = ["score", "rating", "value", "health", "band", "percentile"]

        if isinstance(data, dict):
            for key, value in data.items():
                current_path = f"{path}.{key}"
                key_lower = key.lower()

                if any(sk in key_lower for sk in score_keys) and isinstance(value, (int, float)):
                    results.append({"path": current_path, "value": value})
                elif isinstance(value, (dict, list)):
                    results.extend(self._find_score_fields(value, current_path))

        elif isinstance(data, list):
            for i, item in enumerate(data):
                results.extend(self._find_score_fields(item, f"{path}[{i}]"))

        return results

    def analyze_report_generation(self):
        """Analyze report generation code"""
        report_files = self.report["directory_structure"]["report_generation_files"]

        for rel_path in report_files:
            filepath = self.base_path / rel_path
            if not filepath.exists():
                continue

            try:
                with open(filepath, 'r') as f:
                    content = f.read()

                file_analysis = {
                    "path": rel_path,
                    "size": len(content),
                    "reads_phase_outputs": [],
                    "reads_narrative_fields": [],
                    "reads_score_fields": [],
                    "html_generation_patterns": []
                }

                # Check for phase output references
                phase_patterns = [
                    r"phase(\d)_output",
                    r"phase(\d)-output",
                    r"phase(\d)Output",
                    r"phase(\d)\.json"
                ]
                for pattern in phase_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    file_analysis["reads_phase_outputs"].extend(matches)

                # Check for narrative field references
                narrative_patterns = [
                    r"analysis_text",
                    r"analysisText",
                    r"\.narrative",
                    r"\.insights",
                    r"\.summary(?!\.)",
                    r"\.description",
                    r"\.findings",
                    r"\.content(?!Type)"
                ]
                for pattern in narrative_patterns:
                    if re.search(pattern, content):
                        file_analysis["reads_narrative_fields"].append(pattern)

                # Check for score field references
                score_patterns = [
                    r"\.score",
                    r"health_score",
                    r"overall_score",
                    r"dimension_score"
                ]
                for pattern in score_patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        file_analysis["reads_score_fields"].append(pattern)

                # Check for HTML generation
                html_patterns = [
                    r"innerHTML",
                    r"template.*html",
                    r"\.render\(",
                    r"html`",
                    r"createHTML",
                    r"generateHTML"
                ]
                for pattern in html_patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        file_analysis["html_generation_patterns"].append(pattern)

                self.report["report_generation_analysis"]["files_found"].append(file_analysis)

                # Aggregate findings
                self.report["report_generation_analysis"]["data_sources_read"].extend(
                    file_analysis["reads_phase_outputs"]
                )
                self.report["report_generation_analysis"]["narrative_fields_referenced"].extend(
                    file_analysis["reads_narrative_fields"]
                )
                self.report["report_generation_analysis"]["score_fields_referenced"].extend(
                    file_analysis["reads_score_fields"]
                )

                status = "✅" if file_analysis["reads_narrative_fields"] else "⚠️"
                print(f"   {status} {rel_path}")

            except Exception as e:
                print(f"   ❌ Error reading {rel_path}: {e}")

        # Summarize
        has_narrative_refs = len(self.report["report_generation_analysis"]["narrative_fields_referenced"]) > 0
        has_score_refs = len(self.report["report_generation_analysis"]["score_fields_referenced"]) > 0

        if has_score_refs and not has_narrative_refs:
            print(f"\n   ⚠️ FINDING: Report generators reference SCORES but not NARRATIVE content")

    def trace_data_flow(self):
        """Trace data flow through the pipeline"""
        src_dir = self.base_path / "src"
        if not src_dir.exists():
            print("   ⚠️ src directory not found")
            return

        # Search for import patterns
        import_patterns = [
            (r"import.*from.*phase", "Phase imports"),
            (r"require.*phase", "Phase requires"),
            (r"readFile.*phase", "Phase file reads"),
            (r"JSON\.parse", "JSON parsing"),
            (r"analysis_text|analysisText", "Narrative extraction"),
            (r"\.score|health_score", "Score extraction")
        ]

        for pattern, description in import_patterns:
            matches = []
            for ts_file in src_dir.rglob("*.ts"):
                if "node_modules" in str(ts_file):
                    continue
                try:
                    with open(ts_file, 'r') as f:
                        content = f.read()

                    for match in re.finditer(pattern, content, re.IGNORECASE):
                        line_num = content[:match.start()].count('\n') + 1
                        matches.append({
                            "file": str(ts_file.relative_to(self.base_path)),
                            "line": line_num,
                            "match": match.group()[:50]
                        })
                except:
                    pass

            if matches:
                self.report["data_flow_trace"]["imports_found"].append({
                    "pattern": description,
                    "count": len(matches),
                    "locations": matches[:10]
                })
                print(f"   Found {len(matches)} occurrences of: {description}")

    def analyze_idm(self):
        """Analyze IDM consolidator and schema"""
        idm_files = self.report["directory_structure"]["idm_files"]

        for rel_path in idm_files:
            filepath = self.base_path / rel_path
            if not filepath.exists():
                continue

            try:
                with open(filepath, 'r') as f:
                    content = f.read()

                if "types" in rel_path.lower():
                    self.report["idm_analysis"]["idm_types_found"] = True
                    # Extract interface definitions
                    interfaces = re.findall(r"interface\s+(\w+)", content)
                    self.report["idm_analysis"]["idm_schema"]["interfaces"] = interfaces[:20]
                    print(f"   IDM Types: {len(interfaces)} interfaces found")

                    # Check if narrative fields are in schema
                    if "analysis_text" in content.lower() or "narrative" in content.lower():
                        self.report["idm_analysis"]["narrative_in_idm"] = True
                        print(f"   ✅ IDM schema includes narrative fields")
                    else:
                        print(f"   ⚠️ IDM schema may NOT include narrative fields")

                if "consolidator" in rel_path.lower():
                    self.report["idm_analysis"]["idm_consolidator_found"] = True
                    print(f"   IDM Consolidator found: {rel_path}")

            except Exception as e:
                print(f"   ❌ Error reading {rel_path}: {e}")

    def analyze_prompts(self):
        """Analyze AI prompts to see what they request"""
        prompt_files = self.report["directory_structure"]["prompt_files"]

        for rel_path in prompt_files:
            filepath = self.base_path / rel_path
            if not filepath.exists():
                continue

            try:
                with open(filepath, 'r') as f:
                    content = f.read()

                prompt_info = {
                    "path": rel_path,
                    "requests_narrative": False,
                    "requests_json": False,
                    "output_instructions": []
                }

                # Check for narrative generation instructions
                narrative_instructions = [
                    r"detailed\s+analysis",
                    r"comprehensive\s+narrative",
                    r"analysis_text",
                    r"provide\s+insights",
                    r"explain\s+in\s+detail"
                ]
                for pattern in narrative_instructions:
                    if re.search(pattern, content, re.IGNORECASE):
                        prompt_info["requests_narrative"] = True
                        prompt_info["output_instructions"].append(pattern)

                # Check for JSON output format
                if "JSON" in content or "json" in content:
                    prompt_info["requests_json"] = True

                self.report["prompt_analysis"]["prompts_found"].append(prompt_info)

                status = "✅" if prompt_info["requests_narrative"] else "⚠️"
                print(f"   {status} {rel_path}")

            except Exception as e:
                print(f"   ❌ Error reading {rel_path}: {e}")

    def determine_root_cause(self):
        """Analyze all findings to determine root cause"""

        hypotheses = {
            "CONTENT_EXISTS_NOT_CONSUMED": {
                "description": "AI analysis content exists in phase outputs but report generator doesn't read it",
                "score": 0,
                "evidence": []
            },
            "CONTENT_NOT_GENERATED": {
                "description": "AI phases are not generating sufficient narrative content",
                "score": 0,
                "evidence": []
            },
            "IDM_EXCLUDES_NARRATIVES": {
                "description": "IDM consolidator filters out narrative content before report generation",
                "score": 0,
                "evidence": []
            },
            "TEMPLATE_NO_PLACEHOLDERS": {
                "description": "Report templates only have placeholders for scores, not narratives",
                "score": 0,
                "evidence": []
            }
        }

        # Evaluate hypothesis 1: Content exists but not consumed
        total_words = self.report["content_inventory"]["total_narrative_words_available"]
        if total_words >= 10000:
            hypotheses["CONTENT_EXISTS_NOT_CONSUMED"]["score"] += 40
            hypotheses["CONTENT_EXISTS_NOT_CONSUMED"]["evidence"].append(
                f"Found {total_words:,} words of narrative content in phase outputs"
            )

        narrative_refs = self.report["report_generation_analysis"]["narrative_fields_referenced"]
        score_refs = self.report["report_generation_analysis"]["score_fields_referenced"]

        if score_refs and not narrative_refs:
            hypotheses["CONTENT_EXISTS_NOT_CONSUMED"]["score"] += 40
            hypotheses["CONTENT_EXISTS_NOT_CONSUMED"]["evidence"].append(
                "Report generator references score fields but NOT narrative fields"
            )

        # Evaluate hypothesis 2: Content not generated
        if total_words < 5000:
            hypotheses["CONTENT_NOT_GENERATED"]["score"] += 50
            hypotheses["CONTENT_NOT_GENERATED"]["evidence"].append(
                f"Only {total_words:,} words found - insufficient for premium reports"
            )

        # Evaluate hypothesis 3: IDM excludes narratives
        if self.report["idm_analysis"]["idm_consolidator_found"]:
            if not self.report["idm_analysis"]["narrative_in_idm"]:
                hypotheses["IDM_EXCLUDES_NARRATIVES"]["score"] += 30
                hypotheses["IDM_EXCLUDES_NARRATIVES"]["evidence"].append(
                    "IDM schema does not appear to include narrative fields"
                )

        # Determine primary cause
        primary = max(hypotheses.items(), key=lambda x: x[1]["score"])

        self.report["root_cause_determination"]["hypothesis_scores"] = {
            k: {"score": v["score"], "evidence": v["evidence"]}
            for k, v in hypotheses.items()
        }

        if primary[1]["score"] >= 30:
            self.report["root_cause_determination"]["primary_cause"] = primary[0]
            self.report["root_cause_determination"]["evidence"] = primary[1]["evidence"]
            self.report["root_cause_determination"]["confidence"] = (
                "HIGH" if primary[1]["score"] >= 60 else "MEDIUM"
            )
        else:
            self.report["root_cause_determination"]["primary_cause"] = "UNDETERMINED"
            self.report["root_cause_determination"]["confidence"] = "LOW"

        # Generate recommendations
        if primary[0] == "CONTENT_EXISTS_NOT_CONSUMED":
            self.report["recommendations"] = [
                "Modify report generator to read analysis_text/narrative fields from phase outputs",
                "Add template placeholders for narrative content in each report section",
                "Create mapping between phase analysis fields and report sections"
            ]
        elif primary[0] == "CONTENT_NOT_GENERATED":
            self.report["recommendations"] = [
                "Enhance Phase 1-3 prompts to request more detailed narrative output",
                "Increase output token limits for AI analysis phases",
                "Add explicit instructions for comprehensive analysis text generation"
            ]

        print(f"\n   Primary Cause: {self.report['root_cause_determination']['primary_cause']}")
        print(f"   Confidence: {self.report['root_cause_determination']['confidence']}")

    def save_reports(self):
        """Save investigation reports"""
        # Save JSON report
        json_path = self.base_path / "pipeline-investigation-report.json"
        with open(json_path, 'w') as f:
            json.dump(self.report, f, indent=2, default=str)

        # Generate and save markdown summary
        summary = self._generate_markdown_summary()
        md_path = self.base_path / "INVESTIGATION-SUMMARY.md"
        with open(md_path, 'w') as f:
            f.write(summary)

    def _generate_markdown_summary(self):
        """Generate human-readable markdown summary"""
        lines = []

        lines.append("# BizHealth Pipeline Investigation Summary")
        lines.append("")
        lines.append(f"**Investigation Date:** {self.report['metadata']['investigation_date']}")
        lines.append(f"**Pipeline Location:** {self.report['metadata']['pipeline_location']}")
        lines.append("")

        # Executive Summary
        lines.append("## Executive Summary")
        lines.append("")

        total_words = self.report["content_inventory"]["total_narrative_words_available"]
        primary_cause = self.report["root_cause_determination"]["primary_cause"]
        confidence = self.report["root_cause_determination"]["confidence"]

        if primary_cause == "CONTENT_EXISTS_NOT_CONSUMED":
            lines.append(f"The investigation found **{total_words:,} words** of AI-generated narrative content ")
            lines.append("in the phase outputs, confirming that the analysis phases ARE generating content. ")
            lines.append("However, the report generator is NOT consuming this narrative content - it only ")
            lines.append("extracts numerical scores. This explains why reports show correct scores but lack ")
            lines.append("substantive analysis text.")
        elif primary_cause == "CONTENT_NOT_GENERATED":
            lines.append(f"The investigation found only **{total_words:,} words** of narrative content ")
            lines.append("in phase outputs, which is insufficient for premium consulting reports. ")
            lines.append("The AI analysis phases may need enhanced prompts or increased token limits.")
        else:
            lines.append("The investigation was unable to conclusively determine the root cause. ")
            lines.append("Additional manual investigation may be required.")

        lines.append("")

        # Phase Output Analysis
        lines.append("## Phase Output Analysis")
        lines.append("")
        lines.append("| Phase | Exists | Size | Narrative Fields | Narrative Words |")
        lines.append("|-------|--------|------|------------------|-----------------|")

        for phase in range(5):
            phase_key = f"phase{phase}"
            analysis = self.report["phase_output_analysis"].get(phase_key, {})

            exists = "✅" if analysis.get("exists") else "❌"
            size = f"{analysis.get('size_bytes', 0):,} bytes" if analysis.get("exists") else "-"
            fields = analysis.get("narrative_fields_count", 0)
            words = f"{analysis.get('total_narrative_words', 0):,}"

            lines.append(f"| Phase {phase} | {exists} | {size} | {fields} | {words} |")

        lines.append("")
        lines.append(f"**Total Narrative Content Available:** {total_words:,} words")
        lines.append("")

        # Sample Narrative Content
        lines.append("### Sample Narrative Content Found")
        lines.append("")

        for phase in range(5):
            phase_key = f"phase{phase}"
            analysis = self.report["phase_output_analysis"].get(phase_key, {})
            samples = analysis.get("sample_narratives", [])

            if samples:
                lines.append(f"**Phase {phase}:**")
                for sample in samples[:2]:
                    preview = sample.get("preview", "")[:200].replace("\n", " ")
                    lines.append(f"- `{sample.get('path', '')}` ({sample.get('words', 0)} words)")
                    lines.append(f"  > \"{preview}...\"")
                lines.append("")

        # Report Generation Analysis
        lines.append("## Report Generation Analysis")
        lines.append("")

        files = self.report["report_generation_analysis"]["files_found"]
        if files:
            lines.append("### Files Found")
            for f in files:
                narrative_refs = "✅ reads narratives" if f.get("reads_narrative_fields") else "❌ NO narrative refs"
                score_refs = "✅ reads scores" if f.get("reads_score_fields") else ""
                lines.append(f"- `{f.get('path', '')}` - {narrative_refs} {score_refs}")
            lines.append("")

        # Root Cause
        lines.append("## Root Cause Determination")
        lines.append("")
        lines.append(f"**Primary Cause:** {primary_cause}")
        lines.append(f"**Confidence:** {confidence}")
        lines.append("")

        evidence = self.report["root_cause_determination"]["evidence"]
        if evidence:
            lines.append("**Evidence:**")
            for e in evidence:
                lines.append(f"- {e}")
            lines.append("")

        # Recommendations
        lines.append("## Recommendations")
        lines.append("")

        for i, rec in enumerate(self.report["recommendations"], 1):
            lines.append(f"{i}. {rec}")
        lines.append("")

        # Hypothesis Scores
        lines.append("## Hypothesis Analysis")
        lines.append("")
        lines.append("| Hypothesis | Score | Evidence Count |")
        lines.append("|------------|-------|----------------|")

        for name, data in self.report["root_cause_determination"]["hypothesis_scores"].items():
            lines.append(f"| {name} | {data['score']}/100 | {len(data['evidence'])} |")

        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("*This report was generated automatically by the BizHealth Pipeline Investigator.*")

        return "\n".join(lines)


def main():
    if len(sys.argv) > 1:
        base_path = sys.argv[1]
    else:
        base_path = "."

    if not os.path.exists(base_path):
        print(f"Error: Path not found: {base_path}")
        sys.exit(1)

    investigator = PipelineInvestigator(base_path)
    investigator.run_investigation()


if __name__ == "__main__":
    main()
