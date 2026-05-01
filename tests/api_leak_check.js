#!/usr/bin/env node
/**
 * NeighbourScore — Static Security Scan
 *
 * Does NOT make network requests. Scans source files for:
 *   1. Hardcoded secrets / API keys in frontend or backend
 *   2. console.log leaking user data or raw API responses
 *   3. Error handlers sending err.message/stack to the client
 *   4. CORS configuration safety
 *   5. Body size and rate-limit configuration hygiene
 *
 * Run: node tests/api_leak_check.js
 * Exit 1 if any HIGH severity issues found.
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const FRONTEND_SRC = path.join(ROOT, 'frontend', 'src')
const BACKEND = path.join(ROOT, 'backend')

const issues = []

function addIssue(severity, file, line, issue, recommendation) {
  issues.push({
    severity,
    file: path.relative(ROOT, file).replace(/\\/g, '/'),
    line: line || null,
    issue,
    recommendation,
  })
}

function readLines(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').split('\n')
  } catch {
    return []
  }
}

function walkDir(dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  const files = []
  if (!fs.existsSync(dir)) return files
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'build') {
      files.push(...walkDir(fullPath, extensions))
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath)
    }
  }
  return files
}

// ══════════════════════════════════════════════════════════
// SCAN 1 — Frontend: hardcoded secrets, env var misuse
// ══════════════════════════════════════════════════════════

console.log('\nScanning frontend/src/ ...')
const frontendFiles = walkDir(FRONTEND_SRC)
console.log(`  Found ${frontendFiles.length} files`)

for (const file of frontendFiles) {
  const lines = readLines(file)
  lines.forEach((line, idx) => {
    const lineNum = idx + 1
    const trimmed = line.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return

    // Google API key pattern (AIza + 35 alphanumeric chars)
    if (/AIza[0-9A-Za-z\-_]{35}/.test(line)) {
      addIssue('HIGH', file, lineNum,
        'Hardcoded Google API key in frontend source — will be bundled and exposed',
        'Key is already exposed in the browser bundle regardless; rotate it and restrict to allowed domains/APIs in Cloud Console'
      )
    }

    // Non-REACT_APP_ env var in frontend (CRA strips these at build time)
    const envMatches = line.match(/process\.env\.([A-Z0-9_]+)/g) || []
    for (const match of envMatches) {
      const varName = match.replace('process.env.', '')
      if (!varName.startsWith('REACT_APP_') && varName !== 'NODE_ENV' && varName !== 'PUBLIC_URL') {
        addIssue('MEDIUM', file, lineNum,
          `Non-REACT_APP_ env var: process.env.${varName} — CRA strips this at build, value will be undefined in production`,
          `Rename to REACT_APP_${varName} or move to backend`
        )
      }
    }

    // Hardcoded Firebase apiKey (beyond projectId — these are sensitive)
    if (/apiKey\s*:\s*['"][A-Za-z0-9\-_]{20,}['"]/.test(line)) {
      addIssue('HIGH', file, lineNum,
        'Hardcoded Firebase apiKey in source — included in bundle and visible to anyone',
        'Move to environment variables; use Firebase Hosting auto-config (__/firebase/init.json) or restrict the key to authorised domains in Firebase Console'
      )
    }

    // Hardcoded Cloud Run URL (not from env var)
    if (/https?:\/\/[a-z0-9\-]+\.run\.app/.test(line) && !line.includes('REACT_APP_API_URL') && !line.includes('//')) {
      addIssue('MEDIUM', file, lineNum,
        'Hardcoded Cloud Run URL in frontend source — should come from REACT_APP_API_URL',
        'Replace with process.env.REACT_APP_API_URL'
      )
    }

    // Wrong localhost fallback (points to React dev server, not backend)
    if (line.includes("'http://localhost:3000'") && line.includes('API_URL')) {
      addIssue('LOW', file, lineNum,
        'API_URL fallback is localhost:3000 (React dev server), not localhost:5000 (backend) — silent failure if REACT_APP_API_URL not set in production',
        'Change fallback to http://localhost:5000 or remove fallback and make REACT_APP_API_URL required'
      )
    }

    // Generic long secret pattern near sensitive keywords
    if (/(?:secret|password|private_key)\s*[:=]\s*['"][A-Za-z0-9+/]{20,}['"]/i.test(line)) {
      addIssue('HIGH', file, lineNum,
        'Potential hardcoded secret (password/private_key with long value)',
        'Move to environment variables; ensure .env is gitignored'
      )
    }
  })
}

// ══════════════════════════════════════════════════════════
// SCAN 2 — Backend: hardcoded keys, data leaks, stack traces
// ══════════════════════════════════════════════════════════

console.log('Scanning backend/ ...')
const backendFiles = walkDir(BACKEND)
console.log(`  Found ${backendFiles.length} files`)

for (const file of backendFiles) {
  const lines = readLines(file)
  lines.forEach((line, idx) => {
    const lineNum = idx + 1
    const trimmed = line.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return

    // Hardcoded Google API key in backend
    if (/AIza[0-9A-Za-z\-_]{35}/.test(line)) {
      addIssue('HIGH', file, lineNum,
        'Hardcoded Google API key in backend source',
        'Remove hardcoded value; read from process.env.GOOGLE_MAPS_API_KEY'
      )
    }

    // Hardcoded Gemini/Firebase key patterns
    if (/(?:apiKey|api_key|token)\s*=\s*['"][A-Za-z0-9\-_]{30,}['"]/i.test(line) &&
        !line.includes('process.env') && !line.includes('require(')) {
      addIssue('HIGH', file, lineNum,
        'Potential hardcoded API key or token assigned directly in source',
        'Read from process.env and keep in .env (verify .env is in .gitignore)'
      )
    }

    // console.log printing req.body (logs user PII to Cloud Run logs)
    if (/console\.(log|info)\s*\(.*req\.body/.test(line)) {
      addIssue('MEDIUM', file, lineNum,
        'console.log prints req.body — user input (potentially PII) visible in Cloud Run logs',
        'Remove or replace with structured logging that redacts locality_name and coordinates'
      )
    }

    // console.log printing full raw external API responses
    if (/console\.log\s*\(.*[Rr]aw response/.test(line)) {
      addIssue('LOW', file, lineNum,
        'console.log prints raw external API response — full JSON visible in Cloud Run logs, may contain sensitive fields',
        'Log only the specific fields needed for debugging (station name, distance) — not the full response object'
      )
    }

    // err.message sent to client in HTTP response body
    if (/message\s*:\s*err\.message/.test(line) && !trimmed.startsWith('//')) {
      addIssue('HIGH', file, lineNum,
        'err.message sent to client in HTTP response — may leak Firestore collection names, internal file paths, API key fragments from error strings',
        'Send only a generic message: res.status(500).json({ error: "Internal server error" }). Log err.message server-side only.'
      )
    }

    // err.stack sent to client
    if (/stack\s*:\s*err\.stack/.test(line) && !trimmed.startsWith('//')) {
      addIssue('HIGH', file, lineNum,
        'err.stack sent to client — exposes full stack trace with internal file paths',
        'Never send err.stack to clients. Log it with console.error on the server only.'
      )
    }

    // Prompt injection: locality_name used in Gemini prompt without sanitization note
    if (/localityName/.test(line) && /prompt/.test(line) && /\$\{/.test(line)) {
      addIssue('LOW', file, lineNum,
        'locality_name interpolated into Gemini prompt — curly braces/newlines not stripped by current sanitizer, enabling prompt injection',
        'Strip { } \\n \\r from locality_name before interpolating into AI prompts; or wrap in clear delimiters'
      )
    }
  })
}

// ══════════════════════════════════════════════════════════
// SCAN 3 — CORS configuration
// ══════════════════════════════════════════════════════════

console.log('Checking CORS config in backend/index.js ...')
const indexFile = path.join(BACKEND, 'index.js')
const indexLines = readLines(indexFile)
let corsFound = false

indexLines.forEach((line, idx) => {
  const lineNum = idx + 1
  const trimmed = line.trim()
  if (trimmed.startsWith('//')) return

  // Wildcard CORS
  if (/origin\s*:\s*['"]\*['"]/.test(line)) {
    corsFound = true
    addIssue('HIGH', indexFile, lineNum,
      'CORS origin set to wildcard "*" — any domain can call the API including malicious sites',
      "Restrict to specific origins: ['https://neighbourscore-492917.web.app', 'http://localhost:3000']"
    )
  }

  // cors() with no config at all
  if (/app\.use\s*\(\s*cors\s*\(\s*\)\s*\)/.test(line)) {
    corsFound = true
    addIssue('HIGH', indexFile, lineNum,
      'cors() called with no options — defaults to wildcard, any origin allowed',
      'Pass an options object with explicit origin array'
    )
  }
})

if (!corsFound) {
  console.log('  ✅ CORS: explicit origin allowlist found (not wildcard)')
}

// ══════════════════════════════════════════════════════════
// SCAN 4 — Body size limit
// ══════════════════════════════════════════════════════════

console.log('Checking express.json() body size limit ...')
const hasExplicitLimit = indexLines.some(l => /express\.json\s*\(.*limit/.test(l))
if (!hasExplicitLimit) {
  addIssue('MEDIUM', indexFile, null,
    'express.json() has no explicit body size limit — relies on Express default (100kb); if changed or overridden, no DoS protection',
    "Add explicit limit: app.use(express.json({ limit: '10kb' })) — score requests are small JSON objects"
  )
}

// ══════════════════════════════════════════════════════════
// SCAN 5 — Rate limit header information disclosure
// ══════════════════════════════════════════════════════════

console.log('Checking rate limit header config ...')
indexLines.forEach((line, idx) => {
  if (/standardHeaders\s*:\s*true/.test(line)) {
    addIssue('LOW', indexFile, idx + 1,
      'standardHeaders: true sends RateLimit-Policy, RateLimit-Limit, RateLimit-Remaining headers to every client — reveals window size (60s) and max (20)',
      'Consider standardHeaders: false in production to avoid leaking rate-limit internals to potential attackers'
    )
  }
})

// ══════════════════════════════════════════════════════════
// SCAN 6 — Slug validation gap in report router
// ══════════════════════════════════════════════════════════

console.log('Checking report router slug validation ...')
const reportFile = path.join(BACKEND, 'routes', 'report.js')
const reportLines = readLines(reportFile)
let hasSlugValidation = false
reportLines.forEach(line => {
  if (/slug.*length|slug.*regex|slug.*sanitize|validate.*slug|\.test\(slug\)|test\(req\.params/.test(line)) hasSlugValidation = true
})
if (!hasSlugValidation) {
  addIssue('MEDIUM', reportFile, 10,
    'GET /api/report/:slug uses req.params.slug as Firestore doc ID with no length or character validation — long/malformed slugs cause unhandled Firestore errors caught by the err.message-leaking handler',
    'Add: if (!/^[a-z0-9-]{1,100}$/.test(slug)) return res.status(400).json({ error: "Invalid report ID" })'
  )
}

// ══════════════════════════════════════════════════════════
// REPORT
// ══════════════════════════════════════════════════════════

const HIGH   = issues.filter(i => i.severity === 'HIGH')
const MEDIUM = issues.filter(i => i.severity === 'MEDIUM')
const LOW    = issues.filter(i => i.severity === 'LOW')

console.log('\n' + '═'.repeat(72))
console.log('  NEIGHBOUR SCORE — STATIC SECURITY SCAN REPORT')
console.log('═'.repeat(72))
console.log(`\n  Total issues: ${issues.length}  |  HIGH: ${HIGH.length}  |  MEDIUM: ${MEDIUM.length}  |  LOW: ${LOW.length}\n`)

function printIssues(label, list) {
  if (list.length === 0) return
  console.log(`${'─'.repeat(72)}`)
  console.log(`  ${label} (${list.length})`)
  console.log(`${'─'.repeat(72)}`)
  list.forEach((issue, n) => {
    const loc = issue.line ? `:${issue.line}` : ''
    console.log(`\n  [${n + 1}] ${issue.file}${loc}`)
    console.log(`      Issue : ${issue.issue}`)
    console.log(`      Fix   : ${issue.recommendation}`)
  })
  console.log()
}

printIssues('HIGH SEVERITY', HIGH)
printIssues('MEDIUM SEVERITY', MEDIUM)
printIssues('LOW SEVERITY', LOW)

// ── Summary table ────────────────────────────────────────
console.log('─'.repeat(72))
console.log('  SUMMARY TABLE')
console.log('─'.repeat(72))
const table = [
  ['File', 'HIGH', 'MEDIUM', 'LOW'],
  ...Object.entries(
    issues.reduce((acc, i) => {
      acc[i.file] = acc[i.file] || { HIGH: 0, MEDIUM: 0, LOW: 0 }
      acc[i.file][i.severity]++
      return acc
    }, {})
  ).map(([file, counts]) => [file, counts.HIGH, counts.MEDIUM, counts.LOW])
]
table.forEach(row => {
  console.log(`  ${String(row[0]).padEnd(50)} H:${row[1]}  M:${row[2]}  L:${row[3]}`)
})

// ── Machine-readable JSON output ─────────────────────────
console.log('\n' + '─'.repeat(72))
console.log('  JSON REPORT')
console.log('─'.repeat(72))
console.log(JSON.stringify(issues, null, 2))

// ── Exit code ────────────────────────────────────────────
if (HIGH.length > 0) {
  console.log(`\n⚠️   ${HIGH.length} HIGH severity issue(s) found. Fix before next deployment.\n`)
  process.exit(1)
} else {
  console.log('\n✅  No HIGH severity issues. Review MEDIUM/LOW items at your discretion.\n')
  process.exit(0)
}
