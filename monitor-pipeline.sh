#!/bin/bash
# Pipeline Monitor Script
# Usage: ./monitor-pipeline.sh

echo "==============================================="
echo "BizHealth Pipeline Monitor"
echo "==============================================="
echo ""

# Check if pipeline is running
if ps aux | grep -q "[n]px tsx src/run-pipeline.ts"; then
    echo "✓ Pipeline is RUNNING"
    echo ""
else
    echo "✗ Pipeline is NOT running"
    echo ""
fi

# Show last 30 lines of log
echo "Recent Log Output:"
echo "-----------------------------------------------"
tail -30 pipeline-full.log 2>/dev/null || echo "No log file found"
echo ""
echo "==============================================="
echo "To view full log: tail -f pipeline-full.log"
echo "To check status: ./monitor-pipeline.sh"
echo "==============================================="
