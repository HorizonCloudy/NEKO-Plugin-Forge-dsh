import { packagePath, toDocumentPath } from './paths.js'
import { teamById } from './teams.js'
import { runPython } from './python.js'

const CHECKS = ['SEC-1', 'SEC-2', 'SEC-3', 'SEC-4']
const FINDING_LIMIT = 20

/**
 * Run the team's delivery security audit — the machine half of the security gate.
 *
 * The script scans, scores, and blocks; this wrapper reads its `--json` report and caps the
 * per-check finding list so one noisy repository cannot flood the model's context. Blocking is
 * carried by `verdict`, never by prose: a blocked score is not negotiable inside this wrapper.
 *
 * @param request - team, repository path, exemptions, scan modes, and working directory.
 * @returns the score breakdown, capped findings, and the script's own conclusion.
 */
export async function runSecurityAudit(request) {
  const team = teamById(request.team)
  const script = toDocumentPath(packagePath(team.skillDir, team.auditScript))
  const args = [script]
  if (request.selfTest) {
    args.push('--self-test')
  } else {
    args.push(request.repo ?? '.')
  }
  for (const entry of request.allow ?? []) args.push('--allow', entry)
  if (request.includeDocs) args.push('--include-docs')
  if (request.failUnclear) args.push('--fail-unclear')
  if (request.strictPlaceholder) args.push('--strict-placeholder')
  if (!request.selfTest) args.push('--json')

  const result = await runPython(args, { cwd: request.cwd, signal: request.signal })
  const report = parseReport(result.stdout)

  return {
    team: team.id,
    repo: report?.repo ?? request.repo ?? '.',
    verdict: verdictOf(result.code),
    exitCode: result.code,
    score: report?.score ?? null,
    total: report?.total ?? null,
    counts: report?.counts ?? {},
    findings: capFindings(report?.findings ?? {}),
    blindSpots: report?.blind_spots ?? null,
    scannedFiles: report?.scanned_files ?? null,
    advisorySec5: report?.advisory_sec5 ?? null,
    conclusion: report?.verdict ?? lastLine(result.stdout) ?? (result.code === 0 ? '放行' : '未放行'),
    output: report ? [] : result.stdout.split(/\r?\n/).filter((line) => line.trim() !== ''),
    stderr: result.stderr.trim(),
    script,
  }
}

function parseReport(stdout) {
  const text = stdout.trim()
  if (!text.startsWith('{')) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function capFindings(findings) {
  const capped = {}
  for (const check of CHECKS) capped[check] = (findings[check] ?? []).slice(0, FINDING_LIMIT)
  return capped
}

function verdictOf(code) {
  switch (code) {
    case 0:
      return 'pass'
    case 1:
      return 'fix-required'
    case 2:
      return 'blocked'
    case 3:
      return 'unclear'
    default:
      return 'error'
  }
}

function lastLine(stdout) {
  const lines = stdout.split(/\r?\n/).filter((line) => line.trim() !== '')
  return lines.at(-1)
}