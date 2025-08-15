#!/bin/bash

# Test suite for Claude Config Protector

echo "🧪 Claude Config Protector Test Suite"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

# Helper functions
test_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

test_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

# Check if protector is installed
echo "Checking installation..."
if command -v node &> /dev/null; then
    test_pass "Node.js installed"
else
    test_fail "Node.js not installed"
    exit 1
fi

if [[ -f "protector.js" ]]; then
    test_pass "Protector script found"
else
    test_fail "Protector script not found"
    exit 1
fi

# Test 1: Config validation
echo ""
echo "Testing config validation..."
CONFIG_PATH="$HOME/.claude.json"
if [[ -f "$CONFIG_PATH" ]]; then
    if node -e "JSON.parse(require('fs').readFileSync('$CONFIG_PATH'))" 2>/dev/null; then
        test_pass "Current config is valid JSON"
    else
        test_fail "Current config is invalid JSON"
        echo "  Running fix..."
        node fix-config.js
    fi
else
    test_pass "No config file (will be created by Claude)"
fi

# Test 2: Backup directory
echo ""
echo "Testing backup system..."
BACKUP_DIR="$HOME/.claude-backups"
if [[ -d "$BACKUP_DIR" ]]; then
    test_pass "Backup directory exists"
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/claude-*.json 2>/dev/null | wc -l)
    echo "  Found $BACKUP_COUNT backup(s)"
else
    mkdir -p "$BACKUP_DIR"
    test_pass "Created backup directory"
fi

# Test 3: Protector syntax check
echo ""
echo "Testing protector syntax..."
if node -c protector.js 2>/dev/null; then
    test_pass "Protector syntax valid"
else
    test_fail "Protector has syntax errors"
fi

# Test 4: Fix script syntax check
echo ""
echo "Testing fix script syntax..."
if node -c fix-config.js 2>/dev/null; then
    test_pass "Fix script syntax valid"
else
    test_fail "Fix script has syntax errors"
fi

# Test 5: Corruption recovery simulation
echo ""
echo "Testing corruption recovery..."
if [[ -f "$CONFIG_PATH" ]]; then
    # Backup current config
    cp "$CONFIG_PATH" "$CONFIG_PATH.test-backup"
    
    # Create corrupted config
    echo '{"broken": json file' > "$CONFIG_PATH"
    
    # Run fix script
    if node fix-config.js > /dev/null 2>&1; then
        if node -e "JSON.parse(require('fs').readFileSync('$CONFIG_PATH'))" 2>/dev/null; then
            test_pass "Corruption recovery works"
        else
            test_fail "Config still corrupted after fix"
        fi
    else
        test_fail "Fix script failed"
    fi
    
    # Restore original
    mv "$CONFIG_PATH.test-backup" "$CONFIG_PATH"
else
    test_pass "Skipped (no config to test)"
fi

# Test 6: Size check
echo ""
echo "Testing size management..."
if [[ -f "$CONFIG_PATH" ]]; then
    SIZE=$(stat -f%z "$CONFIG_PATH" 2>/dev/null || stat -c%s "$CONFIG_PATH" 2>/dev/null || echo 0)
    SIZE_MB=$((SIZE / 1024 / 1024))
    if [[ $SIZE_MB -lt 5 ]]; then
        test_pass "Config size OK (${SIZE_MB}MB < 5MB)"
    else
        test_fail "Config too large (${SIZE_MB}MB >= 5MB)"
        echo "  Run: node fix-config.js"
    fi
else
    test_pass "No config file"
fi

# Test 7: Check if protector is running
echo ""
echo "Testing runtime status..."
if ps aux | grep -v grep | grep -q "protector.js"; then
    test_pass "Protector is running"
    PID=$(ps aux | grep -v grep | grep "protector.js" | awk '{print $2}')
    echo "  PID: $PID"
else
    echo -e "${YELLOW}⚠️  Protector not running${NC}"
    echo "  Run: ./install.sh"
fi

# Summary
echo ""
echo "======================================"
echo "Test Results:"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "The Claude Config Protector is ready to use."
    echo "Run ./install.sh to set up automatic protection."
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Please fix the issues and try again."
    exit 1
fi