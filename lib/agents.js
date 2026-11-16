import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { packagePath, toDocumentPath } from './paths.js'
import { splitFrontmatter } from './frontmatter.js'
import { skillOfTeam, teamById } from './teams.js'

const rosters = new Map()

/**
 * Read one team's roster (`roster.json`, the upstream single source of truth for membership).
 * @param teamId - `plugin-forge` or `coopanion-forge`.
 * @returns the members, in roster order.
 */
export async function listRoster(teamId) {
  const team = teamById(teamId)
  if (!rosters.has(team.id)) {
    const raw = await readFile(path.join(packagePath(team.agentsDir), 'roster.json'), 'utf8')
    rosters.set(team.id, JSON.parse(raw).members.map((member) => toEntry(team, member)))
  }
  return rosters.get(team.id)
}

/**
 * Resolve one roster member, then read the persona document a subagent should run with.
 *
 * `role` accepts the exact Agent ID, its team-relative suffix (`contract`), the Chinese or English
 * name, or the profession label the roster uses — the same strings the roster table shows a user.
 *
 * @param teamId - `plugin-forge` or `coopanion-forge`.
 * @param role - the member selector.
 * @returns the member metadata plus the prompt to hand to `subagent`.
 */
export async function readPersona(teamId, role) {
  const team = teamById(teamId)
  const members = await listRoster(team.id)
  const member = matchMember(members, role)
  const home = toDocumentPath(packagePath(skillOfTeam(team.id).dir))
  const file = path.join(packagePath(team.agentsDir), member.file)
  const raw = await readFile(file, 'utf8')
  const { fields, body } = splitFrontmatter(raw)
  const prompt = [
    '【DSH 子代理运行约定】',
    `- 你是 ${team.label} 的成员 ${member.id}（${member.nameZh} / ${member.nameEn || member.nameZh}），职责：${member.duty}。`,
    `- 本团 skill 装在这里：\`${home}\`。人设文档里指向 skill 安装目录的 FORGE_HOME 占位符已替换成该路径，`
      + '`references/`、`scripts/` 都在其下，直接用 read 工具读。',
    `- 轮次预算约 ${member.maxTurns} 轮；超出前先收敛，给出结论与未完成项。`,
    '- 你只承担本职产出，不 spawn 其他成员、不代写他人结论；派工方给你的任务书之外不要扩展范围。',
    '- 最终产出直接作为本轮回复正文回传，按本团宪法做证据分级，不编造未核验事实。',
    '',
    substituteHome(body, home).trim(),
    '',
  ].join('\n')
  return { ...member, description: fields.description || '', prompt }
}

function toEntry(team, member) {
  return {
    id: member.agent_id,
    role: member.role,
    nameZh: member.name_zh,
    nameEn: member.name_en || '',
    professionZh: member.profession_zh || '',
    duty: member.duty || '',
    whenToDispatch: member.when_to_dispatch || '',
    maxTurns: member.max_turns ?? 60,
    file: path.basename(member.file),
  }
}

function matchMember(members, role) {
  const wanted = String(role).trim()
  const folded = wanted.toLowerCase()
  const exact = members.find((member) => member.id === wanted)
  if (exact) return exact
  const bySuffix = members.find((member) => member.id.toLowerCase().endsWith(`-${folded}`))
  const byName = members.find(
    (member) =>
      member.nameZh === wanted
      || member.nameEn.toLowerCase() === folded
      || member.professionZh === wanted
      || member.file.replace(/\.md$/i, '').toLowerCase() === folded,
  )
  const member = bySuffix || byName
  if (member) return member
  throw new Error(
    `团队 ${members[0]?.id?.replace(/-[^-]+$/, '') ?? ''} 里没有成员 ${JSON.stringify(wanted)}；`
    + `可选值：${members.map((entry) => entry.id).join('、')}`,
  )
}

function substituteHome(text, home) {
  return text.replaceAll('${FORGE_HOME}', home)
}