import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { packagePath, toDocumentPath } from './paths.js'
import { splitFrontmatter } from './frontmatter.js'
import { SKILLS } from './teams.js'

const RANK = 100

/**
 * Build one team plugin's skill provider.
 *
 * The provider is deliberately thin: it reads the paradigm documents from disk on demand, so an
 * upstream refresh that replaces `skills/<id>/SKILL.md` reaches the model without a code change.
 * `resourceBase` points at the installed skill directory, which is where every
 * `references/...` path in those documents resolves.
 *
 * Each team registers its own provider name, so disabling one team removes exactly its skills and
 * never touches the other team's catalog entries.
 *
 * @param providerName - the layer-visible provider name, e.g. `plugin-forge`.
 * @param skillIds - skill ids this team publishes, in catalog order.
 * @returns the provider to hand to `ctx.skills.registerProvider`.
 */
export function createSkillProvider(providerName, skillIds) {
  const descriptors = skillIds.map((id) => {
    const descriptor = SKILLS.find((candidate) => candidate.id === id)
    if (!descriptor) throw new Error(`未知的 skill：${id}`)
    return descriptor
  })
  const summaries = new Map()

  const summaryOf = async (descriptor) => {
    if (summaries.has(descriptor.id)) return summaries.get(descriptor.id)
    const { fields } = await readDocument(descriptor)
    const summary = {
      name: fields.name || descriptor.id,
      description: composeDescription(fields.description, descriptor),
      invocation: { modelInvocable: true, userInvocable: true },
      source: 'custom',
      provider: providerName,
      resourceBase: { kind: 'directory', path: skillDirectory(descriptor) },
      rank: RANK,
      locator: descriptor.id,
    }
    summaries.set(descriptor.id, summary)
    return summary
  }

  return {
    name: providerName,
    async list() {
      const candidates = []
      for (const descriptor of descriptors) candidates.push(await summaryOf(descriptor))
      return candidates
    },
    async get(candidate) {
      const descriptor = descriptors.find((entry) => entry.id === candidate.locator)
      if (!descriptor) return undefined
      const { body } = await readDocument(descriptor)
      const summary = await summaryOf(descriptor)
      const home = skillDirectory(descriptor)
      return {
        name: summary.name,
        description: summary.description,
        invocation: summary.invocation,
        provider: providerName,
        source: summary.source,
        resourceBase: summary.resourceBase,
        content: `${dshNotes(descriptor, home)}\n\n${substituteHome(body, home).trim()}\n`,
      }
    },
  }
}

/** Absolute directory of one packaged skill. */
export function skillDirectory(descriptor) {
  return toDocumentPath(packagePath(descriptor.dir))
}

async function readDocument(descriptor) {
  const raw = await readFile(path.join(packagePath(descriptor.dir), 'SKILL.md'), 'utf8')
  return splitFrontmatter(raw)
}

function composeDescription(description, descriptor) {
  const base = (description || descriptor.id).replace(/\s+/g, ' ').trim()
  return `${base} ${descriptor.descriptionNote}`.trim()
}

/** `\${FORGE_HOME}` is the documents' own placeholder for the skill directory. */
function substituteHome(text, home) {
  return text.replaceAll('${FORGE_HOME}', home)
}

function dshNotes(descriptor, home) {
  const header = [
    '## DSH 宿主适配（由 dsh 插件 dsh-forge 提供）',
    '',
    `本 skill 装在这里：\`${home}\`。下文里指向 skill 安装目录的 FORGE_HOME 占位符已替换成该路径，`
    + '`references/` 与 `scripts/` 都在其下，直接用 read 工具读。',
    '',
  ]
  if (!descriptor.team) {
    return [
      ...header,
      '- 脚本随本 skill 一起安装：`python scripts/sandbox.py <子命令> --help` 查看用法；'
      + '它需要本机 Python 3 和一份 N.E.K.O 源码检出。缺任何一项就如实报「未验证」，不要伪造冒烟结论。',
      '- 宿主级用户偏好以本机 `AGENTS.md` 为准，优先于文档里的宿主假设。',
    ].join('\n')
  }
  return [
    ...header,
    '- 子代理形态：成员人设用 `forge_expert({ team: "' + descriptor.team + '", role: "<成员后缀>" })` 取，'
    + '返回值里的 `prompt` 直接作为 `subagent` 的 prompt；需要继承当前会话上下文时改用 `subagent_fork`。'
    + '主理人（lead）由当前会话自己承担，不要再为 lead 起子代理。',
    '- 契约门禁：用 `forge_contract_gate({ team: "' + descriptor.team + '", targets: [...] })`，'
    + `等价于下文那条 \`python ${home}/scripts/check_contract_approval.py\`。`
    + '返回 `verdict: "refused"` 时不许写码，先补齐契约审议或重新送审。',
    '- 安全门禁：用 `forge_security_audit({ team: "' + descriptor.team + '", repo: "<项目根>" })`，'
    + `等价于 \`python ${home}/scripts/security_audit.py\`。`,
    '- 两个门禁工具跑的是本 skill 自带的 Python 脚本（零第三方依赖，需要 Python 3.8+）。'
    + '本机没有 `python` 时工具会报错并给出替代命令；此时按「未验证」交付，不要伪造门禁结论。',
    '- 一次要编排多名成员时用 `workflow` 工具，把 `forge_expert` 返回的人设作为各阶段 prompt 的基础。',
    '- 文档里的 Claude Code / Codex / zcode 运行形态按上面两条映射到 DSH；'
    + '`/plugin-forge`、`/coopanion-forge` 这类 slash 入口在 DSH 里由本 skill 的触发描述承担。',
    '- 宿主级用户偏好以本机 `AGENTS.md` 为准，优先于文档里的宿主假设。',
  ].join('\n')
}