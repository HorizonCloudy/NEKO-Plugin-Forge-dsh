/**
 * Offline smoke test for the single-team plugin. Run with `node test/smoke.mjs`.
 *
 * It applies the plugin to a stand-in context, asserts exactly this package's surface, and then
 * runs the bundled gate scripts against a temporary project so a refusal, an approval, an
 * out-of-scope target, a clean tree, and a plaintext secret are all observed for real.
 */
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import * as entry from '../index.js'

const EXEC = { signal: new AbortController().signal }
const registered = { providers: new Map(), tools: new Map() }

const ctx = {
  effect: (body) => {
    body()
  },
  skills: {
    registerProvider: (factory) => {
      const provider = factory({ signal: new AbortController().signal, invalidate: () => {} })
      registered.providers.set(provider.name, provider)
      return () => {}
    },
  },
  tools: {
    register: (definition) => {
      registered.tools.set(definition.name, definition)
      return () => {}
    },
  },
  get: () => undefined,
}

entry.apply(ctx)

assert.equal(entry.name, 'neko-plugin-forge')
assert.deepEqual(entry.inject, ['skills', 'tools'])
assert.deepEqual([...registered.providers.keys()], ['plugin-forge'])
console.log('PASS one plugin, one skill provider')

const provider = registered.providers.get('plugin-forge')
const candidates = await provider.list()
assert.deepEqual(candidates.map((skill) => skill.name).sort(), ['neko-plugin-sandbox', 'plugin-forge'])
console.log('PASS skill catalog:', candidates.map((skill) => skill.name).sort().join(', '))

for (const candidate of candidates) {
  const skill = await provider.get(candidate)
  assert.ok(skill, `skill ${candidate.name} loads`)
  assert.ok(skill.content.length > 2000, `skill ${candidate.name} has a body`)
  assert.ok(!skill.content.includes('${FORGE_HOME}'), `skill ${candidate.name} resolves FORGE_HOME`)
  assert.ok(skill.content.includes(skill.resourceBase.path), `skill ${candidate.name} states its directory`)
}
console.log('PASS skill bodies resolve ${FORGE_HOME} to the installed directory')

assert.deepEqual([...registered.tools.keys()].sort(), [
  'plugin_forge_contract_gate',
  'plugin_forge_expert',
  'plugin_forge_security_audit',
])
for (const tool of registered.tools.values()) {
  assert.ok(!('team' in tool.parameters.properties), `${tool.name} bakes in its team`)
}
console.log('PASS three team-scoped tools, no team parameter')

const expert = registered.tools.get('plugin_forge_expert')
const roster = await expert.execute({}, EXEC)
assert.equal(roster.roster.length, 14)
assert.equal(roster.team, 'plugin-forge')
const persona = await expert.execute({ role: 'contract' }, EXEC)
assert.equal(persona.persona.id, 'plugin-forge-contract')
assert.ok(persona.persona.prompt.includes('DSH 子代理运行约定'))
assert.ok(!persona.persona.prompt.includes('${FORGE_HOME}'))
assert.match(expert.output.render({}, persona)[0].text, /契约审议师/)
const coopanionPersona = await expert.execute({ role: 'coopanion-forge-contract' }, EXEC).catch((error) => error)
assert.ok(coopanionPersona instanceof Error, 'another team\'s persona must not resolve here')
console.log('PASS roster and persona lookup, foreign roles rejected')

const project = await mkdtemp(path.join(os.tmpdir(), 'neko-plugin-forge-'))
try {
  await mkdir(path.join(project, 'src'), { recursive: true })
  await writeFile(path.join(project, 'src', 'entry.js'), 'export const value = 1\n', 'utf8')

  const gate = registered.tools.get('plugin_forge_contract_gate')
  const noApproval = await gate.execute({ cwd: project, targets: ['src/entry.js'] }, EXEC)
  assert.equal(noApproval.verdict, 'refused', 'missing approval must refuse')
  console.log('PASS contract gate refuses without approval:', noApproval.summary)

  await writeFile(
    path.join(project, 'contract-approval.json'),
    JSON.stringify({
      schema: 'plugin-forge/contract-approval@1',
      task: 'smoke test',
      platform: 'dsh',
      decision: 'approved',
      issued_by: 'plugin-forge-contract',
      issued_at: '2026-11-16T09:00:00+08:00',
      scope: ['src/**'],
    }),
    'utf8',
  )
  const approved = await gate.execute({ cwd: project, targets: ['src/entry.js'] }, EXEC)
  assert.equal(approved.verdict, 'pass', `approved scope must pass: ${approved.output.join(' | ')}`)
  console.log('PASS contract gate allows an in-scope target:', approved.summary)

  const outside = await gate.execute({ cwd: project, targets: ['outside.js'] }, EXEC)
  assert.equal(outside.verdict, 'refused', 'unscoped target must refuse')
  console.log('PASS contract gate refuses an out-of-scope target')

  const clean = await mkdtemp(path.join(os.tmpdir(), 'neko-plugin-forge-clean-'))
  await writeFile(path.join(clean, 'index.js'), 'export const answer = 42\n', 'utf8')
  const audit = registered.tools.get('plugin_forge_security_audit')
  const cleanReport = await audit.execute({ repo: clean, cwd: clean }, EXEC)
  assert.equal(cleanReport.verdict, 'pass', cleanReport.conclusion)
  assert.equal(cleanReport.total, 100)
  console.log('PASS security audit passes a clean tree:', cleanReport.total)

  await writeFile(path.join(clean, 'leak.js'), 'const token = "ghp_' + 'A'.repeat(24) + '"\n', 'utf8')
  const dirtyReport = await audit.execute({ repo: clean, cwd: clean }, EXEC)
  assert.equal(dirtyReport.verdict, 'blocked', dirtyReport.conclusion)
  assert.ok(dirtyReport.findings['SEC-2'].length > 0)
  await rm(clean, { recursive: true, force: true })
  console.log('PASS security audit blocks a plaintext secret:', dirtyReport.conclusion)
} finally {
  await rm(project, { recursive: true, force: true })
}

console.log('ALL SMOKE CHECKS PASSED')