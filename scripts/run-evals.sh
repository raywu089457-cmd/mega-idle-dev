#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Mega Idle Dev — Eval Harness Runner
# Runs all three eval layers and generates a pass@k report.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REPORT_DIR=".claude/evals"
LOG_FILE="$REPORT_DIR/last-run.log"
REPORT_FILE="$REPORT_DIR/last-report.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

UNIT_PASS=0; UNIT_FAIL=0
API_PASS=0;  API_FAIL=0
E2E_PASS=0;  E2E_FAIL=0

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

log() { echo -e "$*" | tee -a "$LOG_FILE"; }
separator() { log "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

# ─── Parse flags ─────────────────────────────────────────────────────────────
SKIP_UNIT=0; SKIP_API=0; SKIP_E2E=0; RUNS=1

for arg in "$@"; do
  case $arg in
    --skip-unit) SKIP_UNIT=1 ;;
    --skip-api)  SKIP_API=1  ;;
    --skip-e2e)  SKIP_E2E=1  ;;
    --runs=*)    RUNS="${arg#--runs=}" ;;
  esac
done

# ─── Header ──────────────────────────────────────────────────────────────────
mkdir -p "$REPORT_DIR"
: > "$LOG_FILE"  # reset log

separator
log "${CYAN}Mega Idle Dev — Eval Harness${NC}  |  $TIMESTAMP"
log "Layers: unit=$([[ $SKIP_UNIT -eq 0 ]] && echo ON || echo SKIP)  api=$([[ $SKIP_API -eq 0 ]] && echo ON || echo SKIP)  e2e=$([[ $SKIP_E2E -eq 0 ]] && echo ON || echo SKIP)  runs=$RUNS"
separator

# ─── Layer 1: Unit tests ──────────────────────────────────────────────────────
if [[ $SKIP_UNIT -eq 0 ]]; then
  log "\n${YELLOW}▶ Layer 1: Unit Tests (Vitest)${NC}"

  if npx vitest run --reporter=json --outputFile="$REPORT_DIR/unit-results.json" 2>>"$LOG_FILE"; then
    UNIT_PASS=$(node -e "const r=require('./$REPORT_DIR/unit-results.json'); console.log(r.numPassedTests ?? 0)" 2>/dev/null || echo 0)
    UNIT_FAIL=0
    log "${GREEN}✓ Unit: all passed ($UNIT_PASS tests)${NC}"
  else
    UNIT_FAIL=$(node -e "const r=require('./$REPORT_DIR/unit-results.json'); console.log(r.numFailedTests ?? '?')" 2>/dev/null || echo '?')
    UNIT_PASS=$(node -e "const r=require('./$REPORT_DIR/unit-results.json'); console.log(r.numPassedTests ?? 0)" 2>/dev/null || echo 0)
    log "${RED}✗ Unit: $UNIT_FAIL failed, $UNIT_PASS passed${NC}"
  fi
else
  log "\n${YELLOW}▶ Layer 1: Unit Tests — SKIPPED${NC}"
fi

# ─── Layer 2: API tests ───────────────────────────────────────────────────────
if [[ $SKIP_API -eq 0 ]]; then
  separator
  log "\n${YELLOW}▶ Layer 2: API Tests (Playwright)${NC}"

  if npx playwright test --config=playwright.api.config.ts 2>>"$LOG_FILE"; then
    log "${GREEN}✓ API tests passed${NC}"
    API_PASS=1
  else
    log "${RED}✗ API tests failed${NC}"
    API_FAIL=1
  fi

  # Parse JSON results if available
  if [[ -f "test-results/api-results.json" ]]; then
    API_PASS_N=$(node -e "const r=require('./test-results/api-results.json'); console.log(r.stats?.expected ?? 0)" 2>/dev/null || echo 0)
    API_FAIL_N=$(node -e "const r=require('./test-results/api-results.json'); console.log(r.stats?.unexpected ?? 0)" 2>/dev/null || echo 0)
    log "  API: $API_PASS_N passed, $API_FAIL_N failed"
  fi
else
  log "\n${YELLOW}▶ Layer 2: API Tests — SKIPPED${NC}"
fi

# ─── Layer 3: E2E tests ───────────────────────────────────────────────────────
if [[ $SKIP_E2E -eq 0 ]]; then
  separator
  log "\n${YELLOW}▶ Layer 3: E2E Tests (Playwright Browser)${NC}"
  log "  Note: Requires Discord OAuth session. Run login flow first if no .auth/discord-session.json exists."

  if npx playwright test --config=playwright.config.ts tests/e2e/landing.spec.ts tests/e2e/game-journey.spec.ts 2>>"$LOG_FILE"; then
    log "${GREEN}✓ E2E tests passed${NC}"
    E2E_PASS=1
  else
    log "${RED}✗ E2E tests failed (check test-results/ for traces)${NC}"
    E2E_FAIL=1
  fi
else
  log "\n${YELLOW}▶ Layer 3: E2E Tests — SKIPPED${NC}"
fi

# ─── Report ──────────────────────────────────────────────────────────────────
separator
log "\n${CYAN}EVAL REPORT — $TIMESTAMP${NC}"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

OVERALL_FAIL=0

if [[ $SKIP_UNIT -eq 0 ]]; then
  if [[ $UNIT_FAIL -eq 0 ]]; then
    log "  ${GREEN}✓ Unit     PASS${NC}  ($UNIT_PASS tests)"
  else
    log "  ${RED}✗ Unit     FAIL${NC}  ($UNIT_FAIL failed / $UNIT_PASS passed)"
    OVERALL_FAIL=1
  fi
fi

if [[ $SKIP_API -eq 0 ]]; then
  if [[ $API_FAIL -eq 0 ]]; then
    log "  ${GREEN}✓ API      PASS${NC}"
  else
    log "  ${RED}✗ API      FAIL${NC}"
    OVERALL_FAIL=1
  fi
fi

if [[ $SKIP_E2E -eq 0 ]]; then
  if [[ $E2E_FAIL -eq 0 ]]; then
    log "  ${GREEN}✓ E2E      PASS${NC}"
  else
    log "  ${RED}✗ E2E      FAIL${NC}  (check test-results/ for failure artifacts)"
    OVERALL_FAIL=1
  fi
fi

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Generate JSON report
node scripts/eval-report.js --timestamp="$TIMESTAMP" \
  --unit-pass="$UNIT_PASS" --unit-fail="${UNIT_FAIL:-0}" \
  --api-pass="$API_PASS" --api-fail="${API_FAIL:-0}" \
  --e2e-pass="$E2E_PASS" --e2e-fail="${E2E_FAIL:-0}" \
  > "$REPORT_FILE" 2>/dev/null || true

log "\nFull log: $LOG_FILE"
log "JSON report: $REPORT_FILE"
separator

if [[ $OVERALL_FAIL -ne 0 ]]; then
  log "${RED}HARNESS STATUS: FAIL${NC}"
  exit 1
else
  log "${GREEN}HARNESS STATUS: PASS ✓${NC}"
fi
