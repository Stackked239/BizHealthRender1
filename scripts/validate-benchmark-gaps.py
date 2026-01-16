#!/usr/bin/env python3
"""
BizHealth.ai Enhanced Benchmark Validation Script

Implements expert-recommended validation gaps:
- Gap 2: Confidence Level Correctness Check
- Gap 3: Narrative Quality Validation
- Gap 5: Enhanced Report HTML Structure Validation

Usage: python3 scripts/validate-benchmark-gaps.py
"""

import json
import re
import sys
from pathlib import Path
from typing import List, Dict, Any, Tuple

# Color output helpers
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(title: str):
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'=' * 60}{Colors.RESET}")
    print(f"{Colors.BLUE}{Colors.BOLD}  {title}{Colors.RESET}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'=' * 60}{Colors.RESET}\n")

def print_success(msg: str):
    print(f"{Colors.GREEN}✓ {msg}{Colors.RESET}")

def print_failure(msg: str):
    print(f"{Colors.RED}✗ {msg}{Colors.RESET}")

def print_warning(msg: str):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.RESET}")


# =============================================================================
# Gap 2: Confidence Level Correctness Check
# =============================================================================

def get_expected_confidence(peer_count: int) -> str:
    """Calculate expected confidence based on peer count thresholds."""
    if peer_count >= 500:
        return 'high'
    elif peer_count >= 50:
        return 'medium'
    else:
        return 'low'

def validate_confidence_levels(idm_data: Dict[str, Any]) -> Tuple[bool, List[str], List[str]]:
    """
    Gap 2: Validate that confidence levels match peer counts.

    Returns: (passed, checks, errors)
    """
    errors = []
    checks = []

    # Check overall benchmark
    scores = idm_data.get('scores_summary', {})
    overall_bm = scores.get('overall_benchmark', {})

    if overall_bm:
        peer_count = overall_bm.get('peer_group_size', 0)
        actual_confidence = overall_bm.get('confidence_level', None)
        expected_confidence = get_expected_confidence(peer_count)

        # Note: confidence_level may not be present in current schema
        # This validates the peer count is reasonable
        if peer_count > 0:
            checks.append(f"Overall: peer_group_size={peer_count} (valid)")
        else:
            errors.append(f"Overall: peer_group_size is missing or zero")

        # If confidence_level exists, validate it
        if actual_confidence:
            if actual_confidence == expected_confidence:
                checks.append(f"Overall: confidence='{actual_confidence}' matches peer_count={peer_count}")
            else:
                errors.append(f"Overall: peer_count={peer_count} -> expected '{expected_confidence}', got '{actual_confidence}'")
    else:
        errors.append("Overall benchmark missing from scores_summary")

    # Check chapter benchmarks
    for chapter in idm_data.get('chapters', []):
        code = chapter.get('chapter_code', 'UNKNOWN')
        bm = chapter.get('benchmark', {})

        if bm:
            # Chapter benchmarks share peer group with overall
            peer_percentile = bm.get('peer_percentile', 0)
            if 1 <= peer_percentile <= 99:
                checks.append(f"{code}: peer_percentile={peer_percentile} (valid range 1-99)")
            else:
                errors.append(f"{code}: peer_percentile={peer_percentile} out of valid range (1-99)")

            # Validate peer_comparison_band matches percentile
            band = bm.get('peer_comparison_band', '')
            if peer_percentile < 25 and band != 'below_average':
                if band:  # Only error if band is present but wrong
                    errors.append(f"{code}: percentile {peer_percentile} should have band 'below_average', got '{band}'")
            elif 25 <= peer_percentile < 50 and band != 'average':
                if band:
                    errors.append(f"{code}: percentile {peer_percentile} should have band 'average', got '{band}'")
            elif 50 <= peer_percentile < 75 and band != 'above_average':
                if band:
                    errors.append(f"{code}: percentile {peer_percentile} should have band 'above_average', got '{band}'")
            elif peer_percentile >= 75 and band != 'top_quartile':
                if band:
                    errors.append(f"{code}: percentile {peer_percentile} should have band 'top_quartile', got '{band}'")
            else:
                checks.append(f"{code}: peer_comparison_band='{band}' matches percentile={peer_percentile}")
        else:
            errors.append(f"{code}: benchmark missing")

    return len(errors) == 0, checks, errors


# =============================================================================
# Gap 3: Narrative Quality Validation
# =============================================================================

def validate_narrative(narrative: str, context: str) -> List[str]:
    """Validate narrative quality for boutique consulting standards."""
    issues = []

    if not narrative:
        issues.append("Narrative is empty")
        return issues

    if len(narrative) < 50:
        issues.append(f"Narrative too short ({len(narrative)} chars, min 50)")
        return issues

    # Check 1: Contains actual percentile number
    percentile_patterns = [
        r'\d{1,2}(?:st|nd|rd|th)\s+percentile',
        r'top\s+\d{1,2}%',
        r'\d{1,2}%\s+of',
    ]
    has_percentile = any(re.search(p, narrative, re.IGNORECASE) for p in percentile_patterns)
    if not has_percentile:
        issues.append("Missing percentile value in narrative")

    # Check 2: No undefined/null/NaN
    bad_values = ['undefined', 'null', 'nan', '[object', 'object]']
    for bad in bad_values:
        if bad.lower() in narrative.lower():
            issues.append(f"Contains '{bad}' - template rendering failed")

    # Check 3: No template placeholders
    placeholder_patterns = [
        r'\{[a-zA-Z_]+\}',           # {placeholder}
        r'\[\s*[A-Z_]+\s*\]',         # [PLACEHOLDER]
        r'\$\{[^}]+\}',               # ${variable}
        r'%[a-z]+%',                  # %placeholder%
    ]
    for pattern in placeholder_patterns:
        if re.search(pattern, narrative):
            issues.append("Contains unresolved template placeholder")
            break

    # Check 4: Contains peer group or comparison context
    peer_keywords = ['peer', 'industry', 'companies', 'businesses', 'average', 'compared', 'benchmark']
    has_peer_context = any(kw in narrative.lower() for kw in peer_keywords)
    if not has_peer_context:
        issues.append("Missing peer group/comparison context")

    # Check 5: Proper sentence structure
    if not narrative[0].isupper():
        issues.append("Doesn't start with capital letter")
    if not narrative.rstrip().endswith('.'):
        issues.append("Doesn't end with period")

    # Check 6: No informal language
    informal_patterns = [
        r'\bkinda\b', r'\bsorta\b', r'\bgonna\b', r'\bwanna\b',
        r'\blol\b', r'\bomg\b', r'\bwtf\b', r'\btbh\b', r'\bimo\b'
    ]
    for pattern in informal_patterns:
        if re.search(pattern, narrative, re.IGNORECASE):
            issues.append("Contains informal language")
            break

    # Check 7: Contains numeric values
    number_count = len(re.findall(r'\b\d+\.?\d*\b', narrative))
    if number_count < 2:
        issues.append("Missing numeric values (should have score and average)")

    # Check 8: Reasonable length
    if len(narrative) > 500:
        issues.append(f"Narrative too long ({len(narrative)} chars, max 500)")

    # Check 9: No repeated words indicating generation error
    words = narrative.lower().split()
    for i in range(len(words) - 2):
        if words[i] == words[i+1] == words[i+2]:
            issues.append(f"Repeated word pattern detected: '{words[i]}'")
            break

    return issues

def validate_all_narratives(idm_data: Dict[str, Any]) -> Tuple[bool, int, List[Tuple[str, List[str], str]]]:
    """
    Gap 3: Validate all narrative content and quality.

    Returns: (passed, validated_count, issues_list)
    """
    all_issues = []
    validated_count = 0

    # Validate overall benchmark narrative
    scores = idm_data.get('scores_summary', {})
    overall_bm = scores.get('overall_benchmark', {})

    if overall_bm and 'benchmark_narrative' in overall_bm:
        narrative = overall_bm['benchmark_narrative']
        issues = validate_narrative(narrative, "Overall")
        validated_count += 1

        if issues:
            all_issues.append(("Overall benchmark", issues, narrative[:100] if narrative else ""))
        else:
            print_success(f"Overall narrative: \"{narrative[:80]}...\"")
    else:
        all_issues.append(("Overall benchmark", ["Missing benchmark_narrative field"], "N/A"))

    # Validate chapter benchmark narratives
    for chapter in idm_data.get('chapters', []):
        code = chapter.get('chapter_code', 'UNKNOWN')
        bm = chapter.get('benchmark', {})

        if bm and 'benchmark_narrative' in bm:
            narrative = bm['benchmark_narrative']
            issues = validate_narrative(narrative, code)
            validated_count += 1

            if issues:
                all_issues.append((f"Chapter {code}", issues, narrative[:100] if narrative else ""))
            else:
                print_success(f"{code} narrative: \"{narrative[:60]}...\"")
        else:
            all_issues.append((f"Chapter {code}", ["Missing benchmark_narrative field"], "N/A"))

    # Determine if critical issues exist
    critical_keywords = ['undefined', 'null', 'template', 'Missing']
    has_critical = any(
        any(kw in str(issues) for kw in critical_keywords)
        for _, issues, _ in all_issues
    )

    return not has_critical, validated_count, all_issues


# =============================================================================
# Gap 5: Enhanced Report HTML Structure Validation
# =============================================================================

def validate_report_structure(filepath: Path, report_name: str) -> List[str]:
    """Validate benchmark content structure in HTML report."""
    issues = []

    try:
        content = filepath.read_text(encoding='utf-8')
    except FileNotFoundError:
        return [f"Report file not found: {filepath}"]
    except Exception as e:
        return [f"Error reading file: {e}"]

    # Check 1: Benchmark section exists
    benchmark_section_patterns = [
        r'<div[^>]*class="[^"]*benchmark[^"]*"',
        r'<section[^>]*benchmark',
        r'id="[^"]*benchmark[^"]*"',
        r'class="[^"]*peer-comparison[^"]*"',
        r'class="[^"]*percentile[^"]*"',
    ]

    has_benchmark_section = any(
        re.search(pattern, content, re.IGNORECASE)
        for pattern in benchmark_section_patterns
    )

    if not has_benchmark_section:
        # Fallback: check if percentile appears in visible content
        clean_content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
        clean_content = re.sub(r'<script[^>]*>.*?</script>', '', clean_content, flags=re.DOTALL)

        if 'percentile' not in clean_content.lower():
            issues.append("No benchmark section or percentile content found")

    # Check 2: Percentile values are actual numbers
    percentile_value_patterns = [
        r'\b\d{1,2}(?:st|nd|rd|th)\s+percentile\b',
        r'percentile[:\s]+\d{1,2}\b',
        r'top\s+\d{1,2}%',
    ]

    has_percentile_values = any(
        re.search(pattern, content, re.IGNORECASE)
        for pattern in percentile_value_patterns
    )

    if not has_percentile_values:
        if 'percentile' in content.lower():
            issues.append("'percentile' mentioned but no numeric values found nearby")

    # Check 3: No undefined/null/NaN in visible content
    bad_value_patterns = [
        r'>\s*undefined\s*<',
        r'>\s*null\s*<',
        r'>\s*NaN\s*<',
        r'percentile[:\s]*undefined',
        r'percentile[:\s]*null',
        r'percentile[:\s]*NaN',
    ]

    for pattern in bad_value_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            issues.append(f"Found rendering failure pattern: {pattern}")
            break

    # Check 4: Peer group description rendered
    peer_group_indicators = [
        r'\d+-\d+\s+employees',
        r'\$[\d,]+[KMB]?\s*-\s*\$[\d,]+[KMB]?',
        r'peer\s+group',
        r'compared\s+to',
        r'industry\s+average',
    ]

    has_peer_context = any(
        re.search(pattern, content, re.IGNORECASE)
        for pattern in peer_group_indicators
    )

    if not has_peer_context:
        issues.append("No peer group context found in report")

    return issues

def validate_all_reports(report_dir: Path) -> Tuple[bool, int, List[Tuple[str, str, List[str]]]]:
    """
    Gap 5: Validate HTML structure of all reports.

    Returns: (passed, total_issues, issues_list)
    """
    # Reports with required benchmark content
    required_benchmark_reports = [
        ("comprehensive.html", "Comprehensive Report"),
    ]

    # Reports where benchmark content is optional (informational only)
    optional_benchmark_reports = [
        ("owner.html", "Owner Report"),
        ("executiveBrief.html", "Executive Brief"),
        ("financial.html", "Financial Report"),
    ]

    all_issues = []
    critical_issues = 0

    # Check required reports (failures here are critical)
    for filename, display_name in required_benchmark_reports:
        filepath = report_dir / filename
        issues = validate_report_structure(filepath, display_name)

        if issues:
            all_issues.append((display_name, filename, issues))
            # Check for rendering failures (undefined, null, etc.)
            for issue in issues:
                if any(bad in issue.lower() for bad in ['undefined', 'null', 'nan', 'rendering']):
                    critical_issues += 1
            # "No benchmark section" in required reports is also critical
            if any('No benchmark' in issue for issue in issues):
                critical_issues += 1
        else:
            print_success(f"{display_name} ({filename}): Structure valid [REQUIRED]")

    # Check optional reports (only rendering failures are critical)
    for filename, display_name in optional_benchmark_reports:
        filepath = report_dir / filename
        issues = validate_report_structure(filepath, display_name)

        if issues:
            # Only count as critical if there are rendering failures (undefined/null/NaN)
            rendering_failures = [i for i in issues if any(bad in i.lower() for bad in ['undefined', 'null', 'nan', 'rendering'])]
            if rendering_failures:
                all_issues.append((display_name, filename, rendering_failures))
                critical_issues += len(rendering_failures)
            else:
                # Just informational - benchmark content is optional for these reports
                print_warning(f"{display_name} ({filename}): No benchmark content (optional)")
        else:
            print_success(f"{display_name} ({filename}): Structure valid")

    return critical_issues == 0, critical_issues, all_issues


# =============================================================================
# Main Validation Runner
# =============================================================================

def find_latest_report_dir(output_dir: Path) -> Path:
    """Find the most recently modified report directory."""
    report_dirs = list((output_dir / 'reports').glob('*/'))
    if not report_dirs:
        return output_dir / 'reports'

    # Sort by modification time, newest first
    report_dirs.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return report_dirs[0]

def main():
    print_header("ENHANCED BENCHMARK VALIDATION PROTOCOL")
    print(f"Validating Gaps 2, 3, and 5 (Expert Recommendations)\n")

    # Find project root (script is in scripts/ directory)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    # Load IDM output
    idm_path = project_root / 'output' / 'idm_output.json'
    if not idm_path.exists():
        print_failure(f"IDM output not found: {idm_path}")
        sys.exit(1)

    try:
        with open(idm_path, 'r') as f:
            idm_data = json.load(f)
        print_success(f"Loaded IDM output: {idm_path}")
    except Exception as e:
        print_failure(f"Failed to load IDM output: {e}")
        sys.exit(1)

    results = {}

    # ==========================================================================
    # Gap 2: Confidence Level Correctness
    # ==========================================================================
    print_header("Gap 2: Confidence Level Correctness")

    passed, checks, errors = validate_confidence_levels(idm_data)

    for check in checks:
        print_success(check)

    for error in errors:
        print_failure(error)

    if passed:
        print(f"\n{Colors.GREEN}✓ All confidence levels validated successfully{Colors.RESET}")
    else:
        print(f"\n{Colors.RED}✗ {len(errors)} confidence level issues found{Colors.RESET}")

    results['gap2'] = passed

    # ==========================================================================
    # Gap 3: Narrative Quality Validation
    # ==========================================================================
    print_header("Gap 3: Narrative Quality Validation")

    passed, validated_count, issues_list = validate_all_narratives(idm_data)

    if issues_list:
        print(f"\n{Colors.YELLOW}Issues found in {len(issues_list)} narrative(s):{Colors.RESET}\n")
        for context, issues, sample in issues_list:
            print(f"  {Colors.YELLOW}{context}:{Colors.RESET}")
            for issue in issues:
                print(f"    - {issue}")
            if sample != "N/A" and sample:
                print(f"    Sample: \"{sample}...\"")
            print()

    if passed:
        print(f"\n{Colors.GREEN}✓ All {validated_count} narratives passed quality validation{Colors.RESET}")
    else:
        print(f"\n{Colors.RED}✗ Critical narrative issues found{Colors.RESET}")

    results['gap3'] = passed

    # ==========================================================================
    # Gap 5: Enhanced Report HTML Structure
    # ==========================================================================
    print_header("Gap 5: Report HTML Structure Validation")

    report_dir = find_latest_report_dir(project_root / 'output')
    print(f"Validating reports in: {report_dir}\n")

    passed, total_issues, issues_list = validate_all_reports(report_dir)

    if issues_list:
        print(f"\n{Colors.YELLOW}Issues found:{Colors.RESET}\n")
        for display_name, filename, issues in issues_list:
            print(f"  {Colors.YELLOW}{display_name} ({filename}):{Colors.RESET}")
            for issue in issues:
                print(f"    - {issue}")
            print()

    if passed:
        print(f"\n{Colors.GREEN}✓ All report structures validated successfully{Colors.RESET}")
    else:
        print(f"\n{Colors.RED}✗ {total_issues} report structure issues found{Colors.RESET}")

    results['gap5'] = passed

    # ==========================================================================
    # Summary
    # ==========================================================================
    print_header("VALIDATION SUMMARY")

    print("Results:")
    print(f"  Gap 2 (Confidence Correctness): {'PASS' if results['gap2'] else 'FAIL'}")
    print(f"  Gap 3 (Narrative Quality):      {'PASS' if results['gap3'] else 'FAIL'}")
    print(f"  Gap 5 (HTML Structure):         {'PASS' if results['gap5'] else 'FAIL'}")
    print()

    all_passed = all(results.values())

    if all_passed:
        print(f"{Colors.GREEN}{Colors.BOLD}✓ ALL ENHANCED VALIDATIONS PASSED{Colors.RESET}")
        return 0
    else:
        print(f"{Colors.RED}{Colors.BOLD}✗ SOME VALIDATIONS FAILED{Colors.RESET}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
