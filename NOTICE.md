# 来源与许可

本仓库把 [HorizonCloudy/plugin-forge](https://github.com/HorizonCloudy/plugin-forge) 改编成
DeepSeek Harness 插件。上游正文逐字保留，改动只有宿主接线。

## 上游

| 仓库 | 版本 | commit | 许可 |
|---|---|---|---|
| https://github.com/HorizonCloudy/plugin-forge | 2.7.4 | `ac9af4d65cee6bfbddd5803d163e31f27baa61d2`（2026-11-15） | MIT，Copyright (c) 2026 云朵 (HorizonCloudy) |

许可原文：`licenses/plugin-forge.LICENSE`。

## 逐字搬运的上游文件

- `skills/plugin-forge/**`
- `skills/neko-plugin-sandbox/**`
- `agents/plugin-forge/**`（含 `roster.json`）
- `docs/upstream/AUDIT-plugin-forge.md`

这些文件未做任何文本修改。DSH 需要的路径替换发生在运行时（`lib/skills.js`、`lib/agents.js`），
不写回文件，所以同步上游时只需覆盖同目录。

## 本仓新增

`package.json`、`index.js`、`lib/**`、`cordis.patch.yml`、`locale/**`、`icon.svg`、
`DETAIL.md`、`README.md`、`NOTICE.md`、`AUDIT.md`、`test/**`、`.gitattributes`（沿用上游规则）。

## 未搬运

上游的仓库维护面不随包分发：`scripts/profile_drift.py`、`scripts/generate_roster_tables.py`、
`tools/**`、`.github/workflows/**`、`codex/prompts/**`、`.claude-plugin/**`。

## 与另一支团的关系

Cortico / Coopanion 那支团在另一个仓库
[Coo-plugin-forge-dsh](https://github.com/HorizonCloudy/Coo-plugin-forge-dsh)，两者不互相依赖、
不共享代码，可以只装其中一个。

## 第三方来源

上游 `AUDIT.md` 记录了它自己的第三方摘要与来源核对，本仓原样附带。其中
`references/delivery-self-check.md` 的来源与许可在上游尚未确立，上游明确标注「来源确立前不得作为
交付闸门接线」；本仓不把它当闸门，闸门仍是契约门禁与安全审计两个脚本。