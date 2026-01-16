#!/bin/bash
# Comprehensive report testing script
# Usage: ./scripts/test-reports.sh

set -e  # Exit on error

echo "========================================"
echo "  BIZHEALTH REPORT TESTING"
echo "========================================"
echo ""

# Run unit tests
echo "🧪 Running unit tests..."
npm run test:mappings || {
  echo "❌ Unit tests failed"
  exit 1
}

# Check if pipeline has been run (reports exist)
REPORT_DIR="output/reports"
if [ -d "$REPORT_DIR" ] && [ "$(ls -A $REPORT_DIR 2>/dev/null)" ]; then
  echo ""
  echo "🔍 Validating section mappings..."
  npm run validate:reports || {
    echo "❌ Validation failed"
    exit 1
  }

  # Check Owner's Report content
  echo ""
  echo "📋 Checking Owner's Report content..."

  OWNER_FILE=$(find output/reports -name "*owner*.html" 2>/dev/null | head -1)
  if [ -z "$OWNER_FILE" ]; then
    echo "⚠️  Owner's Report not found (pipeline may not have run yet)"
  else
    echo "  Found: $OWNER_FILE"

    # Check for required sections
    for section in "Your Business Health at a Glance" \
                   "What This Means" \
                   "Critical Priorities" \
                   "Investment" \
                   "Where to Go for Detail"; do
      if grep -q "$section" "$OWNER_FILE" 2>/dev/null; then
        echo "  ✓ Found: $section"
      else
        echo "  ⚠ May be missing: $section"
      fi
    done

    # Check for cross-references
    REF_COUNT=$(grep -c "comprehensive-reference" "$OWNER_FILE" 2>/dev/null || echo "0")
    echo ""
    echo "  Cross-references found: $REF_COUNT"
  fi

  # Check Comprehensive Report content
  echo ""
  echo "📚 Checking Comprehensive Report content..."

  COMP_FILE=$(find output/reports -name "*comprehensive*.html" 2>/dev/null | head -1)
  if [ -z "$COMP_FILE" ]; then
    echo "⚠️  Comprehensive Report not found (pipeline may not have run yet)"
  else
    echo "  Found: $COMP_FILE"

    # Check for relationship notice
    if grep -q "report-relationship-notice" "$COMP_FILE" 2>/dev/null; then
      echo "  ✓ Relationship notice present"
    else
      echo "  ⚠ Relationship notice may be missing"
    fi

    # Size comparison
    if [ -n "$OWNER_FILE" ]; then
      echo ""
      echo "📏 Size comparison..."
      OWNER_SIZE=$(wc -c < "$OWNER_FILE" 2>/dev/null | tr -d ' ')
      COMP_SIZE=$(wc -c < "$COMP_FILE" 2>/dev/null | tr -d ' ')

      if [ -n "$OWNER_SIZE" ] && [ -n "$COMP_SIZE" ] && [ "$COMP_SIZE" -gt 0 ]; then
        RATIO=$((OWNER_SIZE * 100 / COMP_SIZE))

        echo "  Owner's Report:      $OWNER_SIZE bytes"
        echo "  Comprehensive:       $COMP_SIZE bytes"
        echo "  Ratio:               ${RATIO}%"

        if [ "$RATIO" -ge 40 ] && [ "$RATIO" -le 70 ]; then
          echo "  ✓ Size ratio in acceptable range (40-70%)"
        else
          echo "  ⚠ Size ratio outside target range (target: 50-60%)"
        fi
      fi
    fi
  fi
else
  echo ""
  echo "ℹ️  No reports found in output/reports/"
  echo "   Run the pipeline first: npm run start"
  echo "   Then run this script again to validate reports."
fi

echo ""
echo "========================================"
echo "  ✅ TESTING COMPLETE"
echo "========================================"
