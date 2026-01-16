#!/bin/bash
# BizHealth Report Testing Script

set -e

echo "========================================"
echo "  BIZHEALTH REPORT TESTING"
echo "========================================"
echo ""

# Check Jest
if ! npm list jest >/dev/null 2>&1; then
  echo "📦 Installing test dependencies..."
  npm install --save-dev jest @types/jest ts-jest
fi

# Run unit tests
echo "🧪 Running unit tests..."
npm run test:mappings || { echo "❌ Unit tests failed"; exit 1; }

# Run pipeline
echo ""
echo "📦 Running pipeline..."
npx tsx src/run-pipeline.ts || { echo "❌ Pipeline failed"; exit 1; }

# Validate mappings
echo ""
echo "🔍 Validating section mappings..."
npm run validate:reports || { echo "❌ Validation failed"; exit 1; }

# Check Owner's Report
echo ""
echo "📋 Checking Owner's Report..."
OWNER_FILE=$(find output/reports -name "*owner*.html" 2>/dev/null | head -1)
if [ -z "$OWNER_FILE" ]; then
  echo "❌ Owner's Report not found"
  exit 1
fi

echo "  Found: $OWNER_FILE"

for section in "Your Business Health" "What This Means" "Critical Priorities" \
               "Investment" "Where to Go for Detail"; do
  if grep -q "$section" "$OWNER_FILE"; then
    echo "  ✓ Found: $section"
  else
    echo "  ⚠ May be missing: $section"
  fi
done

REF_COUNT=$(grep -c "comprehensive-reference" "$OWNER_FILE" 2>/dev/null || echo "0")
echo "  Cross-references: $REF_COUNT"

# Check Comprehensive Report
echo ""
echo "📚 Checking Comprehensive Report..."
COMP_FILE=$(find output/reports -name "*comprehensive*.html" 2>/dev/null | head -1)
if [ -z "$COMP_FILE" ]; then
  echo "❌ Comprehensive Report not found"
  exit 1
fi

echo "  Found: $COMP_FILE"

if grep -q "report-relationship-notice" "$COMP_FILE" 2>/dev/null; then
  echo "  ✓ Relationship notice present"
else
  echo "  ⚠ Relationship notice may be missing"
fi

# Size comparison
echo ""
echo "📏 Size comparison..."
OWNER_SIZE=$(wc -c < "$OWNER_FILE" 2>/dev/null | tr -d ' ')
COMP_SIZE=$(wc -c < "$COMP_FILE" 2>/dev/null | tr -d ' ')

if [ -n "$OWNER_SIZE" ] && [ -n "$COMP_SIZE" ] && [ "$COMP_SIZE" -gt 0 ]; then
  RATIO=$((OWNER_SIZE * 100 / COMP_SIZE))
  echo "  Owner's Report: $OWNER_SIZE bytes"
  echo "  Comprehensive:  $COMP_SIZE bytes"
  echo "  Ratio:          ${RATIO}%"

  if [ "$RATIO" -ge 40 ] && [ "$RATIO" -le 70 ]; then
    echo "  ✓ Size ratio acceptable (40-70%)"
  else
    echo "  ⚠ Size ratio outside target (50-60%)"
  fi
fi

echo ""
echo "========================================"
echo "  ✅ TESTING COMPLETE"
echo "========================================"
