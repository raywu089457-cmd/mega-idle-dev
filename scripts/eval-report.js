#!/usr/bin/env node
/**
 * Eval Report Generator
 * Reads Vitest + Playwright JSON outputs and emits a structured eval report.
 * Can also be used to save/compare baselines.
 *
 * Usage:
 *   node scripts/eval-report.js               # generate report from last run results
 *   node scripts/eval-report.js --save-baseline  # save current results as baseline
 *   node scripts/eval-report.js --compare-baseline  # compare against saved baseline
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EVALS_DIR = path.join(ROOT, '.claude', 'evals');
const BASELINE_FILE = path.join(EVALS_DIR, 'baseline.json');

// ─── Parse CLI args ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flags = {};
for (const arg of args) {
  const [key, val] = arg.replace(/^--/, '').split('=');
  flags[key] = val ?? true;
}

// ─── Load results ────────────────────────────────────────────────────────────

function loadUnitResults() {
  const file = path.join(EVALS_DIR, 'unit-results.json');
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return {
      passed: data.numPassedTests ?? 0,
      failed: data.numFailedTests ?? 0,
      total: data.numTotalTests ?? 0,
      suites: data.numPassedTestSuites ?? 0,
      failedSuites: data.numFailedTestSuites ?? 0,
    };
  } catch {
    return null;
  }
}

function loadApiResults() {
  const file = path.join(ROOT, 'test-results', 'api-results.json');
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const stats = data.stats ?? {};
    return {
      passed: stats.expected ?? 0,
      failed: stats.unexpected ?? 0,
      skipped: stats.skipped ?? 0,
    };
  } catch {
    return null;
  }
}

function loadE2EResults() {
  const file = path.join(ROOT, 'test-results', 'results.json');
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const stats = data.stats ?? {};
    return {
      passed: stats.expected ?? 0,
      failed: stats.unexpected ?? 0,
      skipped: stats.skipped ?? 0,
      flaky: stats.flaky ?? 0,
    };
  } catch {
    return null;
  }
}

// ─── pass@k calculation ──────────────────────────────────────────────────────

function passAtK(passed, total) {
  if (total === 0) return null;
  return Math.round((passed / total) * 100) / 100;
}

// ─── Build report ────────────────────────────────────────────────────────────

const timestamp = flags.timestamp || new Date().toISOString();

const unit = loadUnitResults() ?? {
  passed: parseInt(flags['unit-pass'] ?? '0', 10),
  failed: parseInt(flags['unit-fail'] ?? '0', 10),
  total: parseInt(flags['unit-pass'] ?? '0', 10) + parseInt(flags['unit-fail'] ?? '0', 10),
};

const api = loadApiResults() ?? {
  passed: parseInt(flags['api-pass'] ?? '0', 10),
  failed: parseInt(flags['api-fail'] ?? '0', 10),
};

const e2e = loadE2EResults() ?? {
  passed: parseInt(flags['e2e-pass'] ?? '0', 10),
  failed: parseInt(flags['e2e-fail'] ?? '0', 10),
};

const report = {
  timestamp,
  project: 'mega-idle-dev',
  layers: {
    unit: {
      ...unit,
      passAt1: passAtK(unit.passed, unit.total || unit.passed + unit.failed),
      target: 'pass^3 = 1.00',
    },
    api: {
      ...api,
      total: api.passed + api.failed,
      passAt1: passAtK(api.passed, api.passed + api.failed),
      target: 'pass@3 >= 0.90',
    },
    e2e: {
      ...e2e,
      total: e2e.passed + e2e.failed,
      passAt1: passAtK(e2e.passed, e2e.passed + e2e.failed),
      target: 'pass@3 >= 0.85',
    },
  },
  overall: {
    status: (unit.failed === 0 && api.failed === 0 && e2e.failed === 0) ? 'PASS' : 'FAIL',
    totalPassed: unit.passed + api.passed + e2e.passed,
    totalFailed: unit.failed + api.failed + e2e.failed,
  },
};

// ─── Save baseline ────────────────────────────────────────────────────────────
if (flags['save-baseline']) {
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(report, null, 2));
  process.stderr.write(`Baseline saved to ${BASELINE_FILE}\n`);
}

// ─── Compare baseline ─────────────────────────────────────────────────────────
if (flags['compare-baseline'] && fs.existsSync(BASELINE_FILE)) {
  const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf-8'));
  const regressions = [];

  for (const layer of ['unit', 'api', 'e2e']) {
    const curr = report.layers[layer];
    const base = baseline.layers[layer];
    if (!base) continue;
    if ((curr.failed ?? 0) > (base.failed ?? 0)) {
      regressions.push(`${layer}: ${curr.failed} failures (was ${base.failed})`);
    }
  }

  if (regressions.length > 0) {
    process.stderr.write(`REGRESSIONS DETECTED:\n${regressions.join('\n')}\n`);
    report.regressions = regressions;
  } else {
    process.stderr.write('No regressions vs baseline.\n');
  }
}

// ─── Output ───────────────────────────────────────────────────────────────────
console.log(JSON.stringify(report, null, 2));
