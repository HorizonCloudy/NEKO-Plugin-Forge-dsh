# Plugin-forge team as one DSH plugin

One plugin, one team. The package registers a skill provider named `plugin-forge`, publishing the
`plugin-forge` paradigm skill (whose N.E.K.O profile is the shipped first profile) and the
`neko-plugin-sandbox` skill from the same upstream repository, plus three team-scoped tools:

| Tool | Behaviour |
|---|---|
| `plugin_forge_expert` | No `role`: the roster from upstream `roster.json` (14 members). With `role`: a complete subagent prompt — DSH runtime conventions, the resolved skill directory, the turn budget, and the persona body. Accepts a full agent id, the team suffix, the Chinese name, or the English name. |
| `plugin_forge_contract_gate` | Runs the bundled `check_contract_approval.py` over the files about to be written, or over git changed/staged files. `refused` means no writing. |
| `plugin_forge_security_audit` | Runs the bundled `security_audit.py`, reads its `--json` report, and returns the score breakdown, capped findings, and a verdict. |

The team is baked into the tools rather than passed as an argument, so a call cannot address another
team's roster or another team's gate script. Both gates delegate to the bundled Python scripts
instead of reimplementing their rules; `DSH_FORGE_PYTHON` points the interpreter probe at a specific
binary, and without any Python 3 the tool fails loudly rather than inventing a gate result.

## Verification

`node test/smoke.mjs` applies the plugin to a stand-in context: one provider publishing exactly this
package's two skills, `${FORGE_HOME}` resolved in every body, roster and persona lookup, the three
tools registered with their team prefix, then real gate runs (refusal without approval, approval in
scope, refusal out of scope, clean tree scoring 100, plaintext secret blocked).

## Provenance

Upstream files under `skills/`, `agents/`, and `docs/upstream/` are byte-for-byte copies at the
commit recorded in `NOTICE.md`; the MIT notice travels in `licenses/`. Everything else is the DSH
wiring. The coopanion-forge team is a separate repository (`Coo-plugin-forge-dsh`) with no shared
code.