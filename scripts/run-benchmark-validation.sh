#!/bin/bash
#
# BizHealth.ai Enhanced Benchmark Validation Protocol
#
# Runs all five expert-recommended validation gaps:
#   Gap 1: Boundary Value Tests (TypeScript/Vitest)
#   Gap 2: Confidence Level Correctness (Python)
#   Gap 3: Narrative Quality Validation (Python)
#   Gap 4: Performance Checkpoint (TypeScript/Vitest)
#   Gap 5: Report HTML Structure (Python)
#
# Usage: ./scripts/run-benchmark-validation.sh
#

# Don't exit on error - we track results ourselves
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Results tracking
declare -A RESULTS

print_header() {
    echo ""
    echo -e "${BLUE}${BOLD}================================================================${NC}"
    echo -e "${BLUE}${BOLD}    $1${NC}"
    echo -e "${BLUE}${BOLD}================================================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_failure() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

cd "$PROJECT_ROOT"

print_header "BIZHEALTH.AI ENHANCED BENCHMARK VALIDATION PROTOCOL"

echo "Timestamp: $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
echo "Project Root: $PROJECT_ROOT"
echo ""

# =============================================================================
# Pre-flight Checks
# =============================================================================

print_header "Pre-flight Checks"

# Check for required files
if [ ! -f "output/idm_output.json" ]; then
    print_failure "IDM output not found: output/idm_output.json"
    exit 1
fi
print_success "IDM output found"

if [ ! -f "config/industry-benchmarks.json" ]; then
    print_failure "Benchmark database not found: config/industry-benchmarks.json"
    exit 1
fi
print_success "Benchmark database found"

# Check for Node.js and Python
if ! command -v node &> /dev/null; then
    print_failure "Node.js not found"
    exit 1
fi
print_success "Node.js found: $(node --version)"

if ! command -v python3 &> /dev/null; then
    print_failure "Python3 not found"
    exit 1
fi
print_success "Python3 found: $(python3 --version)"

# =============================================================================
# Gap 1: Boundary Value Tests
# =============================================================================

print_header "Gap 1: Boundary Value Tests"

if [ -f "tests/benchmark-boundary-values.test.ts" ]; then
    echo "Running boundary value tests..."

    if npx vitest run tests/benchmark-boundary-values.test.ts --reporter=verbose 2>&1; then
        print_success "Boundary value tests PASSED"
        RESULTS["gap1"]="PASS"
    else
        print_failure "Boundary value tests FAILED"
        RESULTS["gap1"]="FAIL"
    fi
else
    print_warning "Boundary value test file not found"
    RESULTS["gap1"]="SKIP"
fi

# =============================================================================
# Gap 4: Performance Checkpoint
# =============================================================================

print_header "Gap 4: Performance Checkpoint Tests"

if [ -f "tests/benchmark-performance.test.ts" ]; then
    echo "Running performance tests..."

    if npx vitest run tests/benchmark-performance.test.ts --reporter=verbose 2>&1; then
        print_success "Performance tests PASSED"
        RESULTS["gap4"]="PASS"
    else
        print_failure "Performance tests FAILED"
        RESULTS["gap4"]="FAIL"
    fi
else
    print_warning "Performance test file not found"
    RESULTS["gap4"]="SKIP"
fi

# =============================================================================
# Gaps 2, 3, 5: Python Validations
# =============================================================================

print_header "Gaps 2, 3, 5: Python Validations"

if [ -f "scripts/validate-benchmark-gaps.py" ]; then
    echo "Running Python validations..."

    if python3 scripts/validate-benchmark-gaps.py; then
        print_success "Python validations PASSED"
        RESULTS["gap2"]="PASS"
        RESULTS["gap3"]="PASS"
        RESULTS["gap5"]="PASS"
    else
        print_failure "Python validations FAILED"
        RESULTS["gap2"]="FAIL"
        RESULTS["gap3"]="FAIL"
        RESULTS["gap5"]="FAIL"
    fi
else
    print_warning "Python validation script not found"
    RESULTS["gap2"]="SKIP"
    RESULTS["gap3"]="SKIP"
    RESULTS["gap5"]="SKIP"
fi

# =============================================================================
# Final Summary
# =============================================================================

print_header "ENHANCED BENCHMARK VALIDATION SUMMARY REPORT"

echo "Timestamp: $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
echo ""
echo "VALIDATION RESULTS:"
echo "-------------------"
echo ""

# Count results
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

for gap in "gap1" "gap2" "gap3" "gap4" "gap5"; do
    result="${RESULTS[$gap]:-SKIP}"

    case $gap in
        "gap1") desc="Boundary Value Tests" ;;
        "gap2") desc="Confidence Level Correctness" ;;
        "gap3") desc="Narrative Quality Validation" ;;
        "gap4") desc="Performance Checkpoint" ;;
        "gap5") desc="Report HTML Structure" ;;
    esac

    case $result in
        "PASS")
            echo -e "  ${GREEN}✓${NC} Gap ${gap#gap}: $desc"
            ((PASS_COUNT++))
            ;;
        "FAIL")
            echo -e "  ${RED}✗${NC} Gap ${gap#gap}: $desc"
            ((FAIL_COUNT++))
            ;;
        "SKIP")
            echo -e "  ${YELLOW}○${NC} Gap ${gap#gap}: $desc (SKIPPED)"
            ((SKIP_COUNT++))
            ;;
    esac
done

echo ""
echo "-------------------"
echo "Summary: $PASS_COUNT passed, $FAIL_COUNT failed, $SKIP_COUNT skipped"
echo ""

# Success criteria table
echo "SUCCESS CRITERIA (UPDATED):"
echo "----------------------------"
echo ""
printf "%-12s %-35s %-10s %-10s\n" "Category" "Criterion" "Required" "Status"
printf "%-12s %-35s %-10s %-10s\n" "--------" "---------" "--------" "------"
printf "%-12s %-35s %-10s %-10s\n" "Enhanced" "Boundary value tests pass" "Yes" "${RESULTS[gap1]:-SKIP}"
printf "%-12s %-35s %-10s %-10s\n" "Enhanced" "Confidence levels correct" "Yes" "${RESULTS[gap2]:-SKIP}"
printf "%-12s %-35s %-10s %-10s\n" "Enhanced" "Narrative quality validated" "Yes" "${RESULTS[gap3]:-SKIP}"
printf "%-12s %-35s %-10s %-10s\n" "Enhanced" "Performance < 2000ms" "Yes" "${RESULTS[gap4]:-SKIP}"
printf "%-12s %-35s %-10s %-10s\n" "Enhanced" "Report HTML structure valid" "Yes" "${RESULTS[gap5]:-SKIP}"
echo ""

# Final verdict
if [ $FAIL_COUNT -eq 0 ] && [ $SKIP_COUNT -eq 0 ]; then
    echo -e "${GREEN}${BOLD}================================================================${NC}"
    echo -e "${GREEN}${BOLD}    ALL ENHANCED VALIDATIONS PASSED${NC}"
    echo -e "${GREEN}${BOLD}    Benchmark implementation is COMPLETE${NC}"
    echo -e "${GREEN}${BOLD}================================================================${NC}"
    exit 0
elif [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${YELLOW}${BOLD}================================================================${NC}"
    echo -e "${YELLOW}${BOLD}    VALIDATIONS PASSED (with skips)${NC}"
    echo -e "${YELLOW}${BOLD}    Review skipped validations before completion${NC}"
    echo -e "${YELLOW}${BOLD}================================================================${NC}"
    exit 0
else
    echo -e "${RED}${BOLD}================================================================${NC}"
    echo -e "${RED}${BOLD}    VALIDATION FAILURES DETECTED${NC}"
    echo -e "${RED}${BOLD}    $FAIL_COUNT validation(s) failed - fix before completion${NC}"
    echo -e "${RED}${BOLD}================================================================${NC}"
    exit 1
fi
