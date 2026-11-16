import { listRoster, readPersona } from './agents.js'
import { runContractGate } from './gate.js'
import { runSecurityAudit } from './audit.js'

/**
 * Build the three tools one team plugin registers.
 *
 * Each team owns its own tool names (`plugin_forge_expert`, `coopanion_forge_expert`, ...) because
 * the tool registry refuses duplicate names in one layer: two teams that could be enabled
 * independently must not fight over `forge_expert`. The team is baked in, so a call can never
 * cross teams by mistake.
 *
 * @param ctx - registrant context, read for the session working directory.
 * @param team - the team descriptor this plugin owns.
 * @param prefix - tool-name prefix for that team, e.g. `plugin_forge`.
 * @returns the tool definitions to register.
 */
export function createTeamTools(ctx, team, prefix) {
  return [
    expertTool(team, `${prefix}_expert`),
    contractGateTool(ctx, team, `${prefix}_contract_gate`),
    securityAuditTool(ctx, team, `${prefix}_security_audit`),
  ]
}

function expertTool(team, toolName) {
  return {
    name: toolName,
    description:
      `Read a member persona of the ${team.id} expert team (${team.scope}) and get a `
      + 'ready-to-send subagent prompt. Omit `role` to list the roster and its dispatch rules. '
      + 'Pass the returned `prompt` as the `subagent` prompt (or `subagent_fork` when the child must '
      + 'inherit this conversation); the lead role is the current session itself, so never spawn it. '
      + `Use whenever the ${team.id} skill tells you to dispatch 契约审议师 / 插件开发工程师 / 安全工程师 `
      + 'or any other roster member.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        role: {
          type: 'string',
          description:
            '成员选择器，可写完整 Agent ID（如 `plugin-forge-contract`）、团队内后缀（`contract`）、'
            + '中文名（`契约审议师`）或英文名。省略则只返回名册。',
        },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['team', 'label', 'roster'],
        properties: {
          team: { type: 'string' },
          label: { type: 'string' },
          roster: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'role', 'nameZh', 'duty', 'whenToDispatch'],
              properties: {
                id: { type: 'string' },
                role: { type: 'string' },
                nameZh: { type: 'string' },
                nameEn: { type: 'string' },
                duty: { type: 'string' },
                whenToDispatch: { type: 'string' },
                maxTurns: { type: 'integer' },
              },
            },
          },
          persona: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'nameZh', 'duty', 'maxTurns', 'prompt'],
            properties: {
              id: { type: 'string' },
              nameZh: { type: 'string' },
              duty: { type: 'string' },
              maxTurns: { type: 'integer' },
              prompt: { type: 'string' },
            },
          },
        },
      },
      render(_args, value) {
        if (!value.persona) return [{ type: 'text', text: rosterText(value) }]
        return [
          {
            type: 'text',
            text: [
              `【${value.label}】${value.persona.nameZh}（${value.persona.id}）人设，`
              + `轮次预算约 ${value.persona.maxTurns} 轮。把这个 prompt 交给 subagent：`,
              '',
              value.persona.prompt,
            ].join('\n'),
          },
        ]
      },
    },
    async execute(args) {
      const roster = await listRoster(team.id)
      const summary = roster.map((member) => ({
        id: member.id,
        role: member.role,
        nameZh: member.nameZh,
        nameEn: member.nameEn,
        duty: member.duty,
        whenToDispatch: member.whenToDispatch,
        maxTurns: member.maxTurns,
      }))
      if (!args.role) return { team: team.id, label: team.label, roster: summary }
      const member = await readPersona(team.id, args.role)
      return {
        team: team.id,
        label: team.label,
        roster: summary,
        persona: {
          id: member.id,
          nameZh: member.nameZh,
          duty: member.duty,
          maxTurns: member.maxTurns,
          prompt: member.prompt,
        },
      }
    },
  }
}

function rosterText(value) {
  const lines = [
    `【${value.label}】名册（${value.roster.length} 人）。`
    + '需要谁的人设就再调本工具并传 role，返回的 prompt 交给 subagent。',
    '',
    '| Agent ID | 名号 | 什么时候派 |',
    '|---|---|---|',
  ]
  for (const member of value.roster) {
    lines.push(`| ${member.id} | ${member.nameZh} | ${member.whenToDispatch || member.duty} |`)
  }
  return lines.join('\n')
}

function contractGateTool(ctx, team, toolName) {
  return {
    name: toolName,
    description:
      `Run the ${team.id} contract-approval gate: it decides whether code may be written for a task. `
      + 'Call it right before writing or editing files, with the exact files you intend to write '
      + '(or use `changed` / `staged` to let it collect them from git). The project root is the '
      + 'directory of the approval file (`contract-approval.json` by default). '
      + 'A `refused` verdict means do not write: fix the contract review first, then rerun. '
      + 'Never report a gate as passed without this tool output; if python is missing the tool says so.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        targets: {
          type: 'array',
          items: { type: 'string' },
          description: '将要写入的文件路径，项目根相对或绝对。一次把整轮要动的文件都列上。',
        },
        approval: {
          type: 'string',
          description: '准奏记录路径，默认 `contract-approval.json`（相对 cwd）。',
        },
        changed: {
          type: 'boolean',
          description: 'true 时改为检查 git 工作区未暂存改动 + 未跟踪新文件。',
        },
        staged: {
          type: 'boolean',
          description: 'true 时改为检查 git 已暂存（ACMR）文件。',
        },
        cwd: {
          type: 'string',
          description: '项目根目录；省略时用当前会话的工作目录。',
        },
        selfTest: {
          type: 'boolean',
          description: 'true 时跑脚本内置自检（CI 用），不检查真实目标。',
        },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['team', 'verdict', 'exitCode', 'summary', 'decisions', 'warnings', 'output'],
        properties: {
          team: { type: 'string' },
          verdict: { type: 'string' },
          exitCode: { type: 'integer' },
          summary: { type: 'string' },
          decisions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['decision', 'path', 'reason'],
              properties: {
                decision: { type: 'string' },
                path: { type: 'string' },
                reason: { type: 'string' },
              },
            },
          },
          warnings: { type: 'array', items: { type: 'string' } },
          output: { type: 'array', items: { type: 'string' } },
          stderr: { type: 'string' },
          script: { type: 'string' },
        },
      },
      render(_args, value) {
        const lines = [`契约门禁（${value.team}）：${verdictLabel(value.verdict)} — ${value.summary}`]
        for (const warning of value.warnings) lines.push(`WARN ${warning}`)
        for (const decision of value.decisions) {
          lines.push(`${decision.decision === 'ALLOW' ? 'ALLOW' : 'REFUSE'} ${decision.path}: ${decision.reason}`)
        }
        if (!value.decisions.length) lines.push(...value.output)
        if (value.stderr) lines.push(`stderr: ${value.stderr}`)
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(args, exec) {
      if (!args.selfTest && !args.targets?.length && !args.changed && !args.staged) {
        throw new Error(`${toolName} 需要目标文件：传 targets，或把 changed / staged 设为 true；自检用 selfTest`)
      }
      const gate = await runContractGate({
        team: team.id,
        targets: args.targets,
        approval: args.approval || 'contract-approval.json',
        changed: Boolean(args.changed),
        staged: Boolean(args.staged),
        selfTest: Boolean(args.selfTest),
        cwd: args.cwd || sessionDirectory(ctx, exec),
        signal: exec.signal,
      })
      return {
        team: gate.team,
        verdict: gate.verdict,
        exitCode: gate.exitCode,
        summary: gate.summary,
        decisions: gate.decisions,
        warnings: gate.warnings,
        output: gate.output,
        stderr: gate.stderr,
        script: gate.script,
      }
    },
  }
}

function securityAuditTool(ctx, team, toolName) {
  return {
    name: toolName,
    description:
      `Run the ${team.id} delivery security audit over a repository: SEC-1 path/scope leaks, SEC-2 `
      + 'plaintext secrets (a single hit blocks), SEC-3 arbitrary execution, SEC-4 undeclared '
      + 'network fetch points, '
      + 'plus SEC-5 manifest shape as advisory. Returns a 0-100 score and a verdict. '
      + '`blocked` or `fix-required` means do not deliver: fix and rerun. '
      + 'Exemptions passed through `allow` are path prefixes and must be recorded in AUDIT.md.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        repo: {
          type: 'string',
          description: '目标仓库路径，默认当前会话工作目录。',
        },
        allow: {
          type: 'array',
          items: { type: 'string' },
          description: '已复核并写进 AUDIT.md 的豁免路径前缀。',
        },
        includeDocs: {
          type: 'boolean',
          description: 'true 时把 md/html/txt 也纳入扫描（SEC-1/SEC-2 文档残留）。',
        },
        failUnclear: {
          type: 'boolean',
          description: 'true 时存在盲区（未读文件或疑似压缩）就把放行改为「不确定」。',
        },
        strictPlaceholder: {
          type: 'boolean',
          description: 'true 时占位词后跟数字也算真值（更严，文档示例会开始报）。',
        },
        selfTest: {
          type: 'boolean',
          description: 'true 时跑脚本内置自检（CI 用）。',
        },
        cwd: {
          type: 'string',
          description: '运行脚本的工作目录；省略时用当前会话的工作目录。',
        },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['team', 'repo', 'verdict', 'exitCode', 'conclusion', 'findings', 'counts'],
        properties: {
          team: { type: 'string' },
          repo: { type: 'string' },
          verdict: { type: 'string' },
          exitCode: { type: 'integer' },
          conclusion: { type: 'string' },
          score: { type: 'object', additionalProperties: true },
          total: { type: 'integer' },
          counts: { type: 'object', additionalProperties: true },
          blindSpots: { type: 'integer' },
          scannedFiles: { type: 'integer' },
          advisorySec5: { type: 'integer' },
          findings: {
            type: 'object',
            additionalProperties: false,
            required: ['SEC-1', 'SEC-2', 'SEC-3', 'SEC-4'],
            properties: {
              'SEC-1': { type: 'array', items: { type: 'object', additionalProperties: true } },
              'SEC-2': { type: 'array', items: { type: 'object', additionalProperties: true } },
              'SEC-3': { type: 'array', items: { type: 'object', additionalProperties: true } },
              'SEC-4': { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          },
          output: { type: 'array', items: { type: 'string' } },
          stderr: { type: 'string' },
          script: { type: 'string' },
        },
      },
      render(_args, value) {
        const lines = [
          `安全审计（${value.team}）：${auditVerdictLabel(value.verdict)} — ${value.conclusion}`,
        ]
        if (value.total !== undefined && value.total !== null) {
          lines.push(`总分 ${value.total}；分项 ${JSON.stringify(value.score ?? {})}`)
        }
        if (value.blindSpots) lines.push(`盲区 ${value.blindSpots} 处（未读或疑似压缩），不算“干净”`)
        for (const [check, findings] of Object.entries(value.findings)) {
          if (!findings.length) continue
          lines.push(`== ${check}（${findings.length} 处）`)
          for (const finding of findings) {
            lines.push(`   ${finding.file}:${finding.line} [${finding.note}] ${finding.snippet}`)
          }
        }
        if (!value.findings['SEC-1']?.length && !value.total) lines.push(...value.output)
        if (value.stderr) lines.push(`stderr: ${value.stderr}`)
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(args, exec) {
      const directory = args.cwd || sessionDirectory(ctx, exec)
      const audit = await runSecurityAudit({
        team: team.id,
        repo: args.repo || directory,
        allow: args.allow ?? [],
        includeDocs: Boolean(args.includeDocs),
        failUnclear: Boolean(args.failUnclear),
        strictPlaceholder: Boolean(args.strictPlaceholder),
        selfTest: Boolean(args.selfTest),
        cwd: directory,
        signal: exec.signal,
      })
      const value = {
        team: audit.team,
        repo: audit.repo,
        verdict: audit.verdict,
        exitCode: audit.exitCode,
        conclusion: audit.conclusion,
        score: audit.score ?? {},
        counts: audit.counts,
        findings: audit.findings,
        output: audit.output,
        stderr: audit.stderr,
        script: audit.script,
      }
      for (const key of ['total', 'blindSpots', 'scannedFiles', 'advisorySec5']) {
        if (audit[key] !== null && audit[key] !== undefined) value[key] = audit[key]
      }
      return value
    },
  }
}

function verdictLabel(verdict) {
  switch (verdict) {
    case 'pass':
      return '放行'
    case 'refused':
      return '拒绝（不许写码）'
    default:
      return '出错（不得当作放行）'
  }
}

function auditVerdictLabel(verdict) {
  switch (verdict) {
    case 'pass':
      return '放行'
    case 'fix-required':
      return '修完再放'
    case 'blocked':
      return '阻断'
    case 'unclear':
      return '不确定'
    default:
      return '出错（不得当作放行）'
  }
}

function sessionDirectory(ctx, exec) {
  try {
    const service = ctx.get('workingDirectory')
    const session = exec.agent?.session
    if (service && session) {
      const directory = service.get(session)
      if (directory) return directory
    }
  } catch {
    // Fall through to the process directory: a missing service must not fail the gate itself.
  }
  return process.cwd()
}