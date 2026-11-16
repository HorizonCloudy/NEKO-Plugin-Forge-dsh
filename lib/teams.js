/**
 * What this plugin is adapted from: the plugin-forge paradigm skill, its agent roster, and its two
 * gate scripts. Paths are package-relative; `skills.js` and `agents.js` resolve them.
 *
 * This repository carries a single team. The coopanion-forge team lives in its own repository
 * (Coo-plugin-forge-dsh), so disabling one never removes the other.
 */
export const TEAM = {
  id: 'plugin-forge',
  label: 'plugin-forge 插件制造专家团',
  skillId: 'plugin-forge',
  skillDir: 'skills/plugin-forge',
  agentsDir: 'agents/plugin-forge',
  gateScript: 'scripts/check_contract_approval.py',
  auditScript: 'scripts/security_audit.py',
  scope: '任意宿主平台的插件/扩展（N.E.K.O 为其内置 profile）',
}

/** Skills this package publishes; the paradigm skill carries the roster, the sandbox one runs the runtime. */
export const SKILLS = [
  {
    id: 'plugin-forge',
    dir: TEAM.skillDir,
    team: TEAM.id,
    descriptionNote:
      '（DSH 适配版，由 dsh 插件 neko-plugin-forge-dsh 提供：成员人设用 plugin_forge_expert 工具取，'
      + '契约门禁用 plugin_forge_contract_gate，安全审计用 plugin_forge_security_audit。）',
  },
  {
    id: 'neko-plugin-sandbox',
    dir: 'skills/neko-plugin-sandbox',
    team: null,
    descriptionNote: '（DSH 适配版，由 dsh 插件 neko-plugin-forge-dsh 提供；脚本随 skill 目录一起安装。）',
  },
]

/**
 * Find this package's team.
 * @param id - must be `plugin-forge`.
 * @returns the team descriptor.
 */
export function teamById(id) {
  if (id !== TEAM.id) {
    throw new Error(`本包只提供 ${TEAM.id}，收到 ${JSON.stringify(id)}`)
  }
  return TEAM
}

/**
 * Find the paradigm skill descriptor.
 * @param team - the team identifier.
 * @returns the skill descriptor.
 */
export function skillOfTeam(team) {
  const descriptor = SKILLS.find((candidate) => candidate.team === team)
  if (!descriptor) throw new Error(`团队 ${team} 没有对应的 skill`)
  return descriptor
}