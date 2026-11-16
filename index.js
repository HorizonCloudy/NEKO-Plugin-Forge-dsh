import { createSkillProvider } from './lib/skills.js'
import { createTeamTools } from './lib/tools.js'
import { teamById } from './lib/teams.js'

/** Cordis plugin name; also the Loader row id this bundle inserts. */
export const name = 'neko-plugin-forge'

/** Skill and tool registries are both required to publish this team. */
export const inject = ['skills', 'tools']

/**
 * Publish the plugin-forge expert team (adapted from HorizonCloudy/plugin-forge).
 *
 * It owns the `plugin-forge` paradigm skill (whose N.E.K.O profile is the shipped first profile),
 * the `neko-plugin-sandbox` skill from the same upstream repository, its 14 member personas, and
 * three team-scoped tools.
 *
 * @param ctx - registrant context carrying `skills` and `tools`.
 */
export function apply(ctx) {
  const team = teamById('plugin-forge')
  ctx.effect(() =>
    ctx.skills.registerProvider(() =>
      createSkillProvider('plugin-forge', ['plugin-forge', 'neko-plugin-sandbox']),
    ),
  )
  for (const tool of createTeamTools(ctx, team, 'plugin_forge')) {
    ctx.effect(() => ctx.tools.register(tool))
  }
}