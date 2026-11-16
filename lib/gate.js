import { packagePath, toDocumentPath } from './paths.js'
import { teamById } from './teams.js'
import { runPython } from './python.js'

const DECISION = /^(ALLOW|REFUSE)\s+(\S+):\s*(.*)$/
const GLOBAL_REFUSAL = /^REFUSE\(全局\):\s*(.*)$/

/**
 * Run the team's contract-approval gate — the machine half of "no approval, no code".
 *
 * The gate script decides; this wrapper only shapes its output. The project root is the
 * directory of the approval file (the script's own rule), and `cwd` must be that same directory
 * because relative `targets` are resolved against the process working directory.
 *
 * @param request - team, targets, approval path, git modes, and working directory.
 * @returns the verdict plus every per-target decision the script printed.
 */
export async function runContractGate(request) {
  const team = teamById(request.team)
  const script = toDocumentPath(packagePath(team.skillDir, team.gateScript))
  const args = [script]
  if (request.approval) args.push('--approval', request.approval)
  if (request.staged) args.push('--staged')
  if (request.changed) args.push('--changed')
  if (request.selfTest) args.push('--self-test')
  args.push(...(request.targets ?? []))

  const result = await runPython(args, { cwd: request.cwd, signal: request.signal })
  const output = result.stdout.split(/\r?\n/).filter((line) => line.trim() !== '')
  const decisions = []
  const warnings = []
  let summary = ''

  for (const line of output) {
    const decision = DECISION.exec(line)
    if (decision) {
      decisions.push({ decision: decision[1], path: decision[2], reason: decision[3] })
      continue
    }
    const global = GLOBAL_REFUSAL.exec(line)
    if (global) {
      warnings.push(`全局拒绝：${global[1]}`)
      continue
    }
    if (line.startsWith('结论:')) {
      summary = line.replace(/^结论:\s*/, '')
      continue
    }
    if (line.startsWith('WARN:')) {
      warnings.push(line.replace(/^WARN:\s*/, ''))
      continue
    }
    if (!summary) summary = line
  }

  return {
    team: team.id,
    verdict: result.code === 0 ? 'pass' : result.code === 1 ? 'refused' : 'error',
    exitCode: result.code,
    summary: summary || (result.code === 0 ? '门禁放行' : '门禁未放行'),
    decisions,
    warnings,
    output,
    stderr: result.stderr.trim(),
    script,
  }
}