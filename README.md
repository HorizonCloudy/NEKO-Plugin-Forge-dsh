# NEKO-Plugin-Forge-dsh

[plugin-forge](https://github.com/HorizonCloudy/plugin-forge) 的 DeepSeek Harness 插件版：
一个插件，一支专家团——范式 skill（含 N.E.K.O profile）、14 位成员人设、契约门禁与安全审计。

另一个仓库 [Coo-plugin-forge-dsh](https://github.com/HorizonCloudy/Coo-plugin-forge-dsh) 是
Cortico / Coopanion 那支团，两者完全独立：各自安装、各自启用、互不引用。

## 提供什么

| 类别 | 内容 |
|---|---|
| skill | `plugin-forge`（通用插件范式：契约先行、先搜后建、TDD、极简、安全门禁、运行时验证；内置 N.E.K.O profile 与 23 份扩展阅读）、`neko-plugin-sandbox`（隔离 N.E.K.O 运行时沙箱） |
| 人设 | 14 位（lead + 13 专家），来自上游 `roster.json` |
| 工具 | `plugin_forge_expert` / `plugin_forge_contract_gate` / `plugin_forge_security_audit` |

### 三个工具

- `plugin_forge_expert`：不传 `role` 出名册；传了返回可直接交给 `subagent` 的完整人设 prompt
  （DSH 运行约定、已替换的 skill 目录、轮次预算、人设正文）。
- `plugin_forge_contract_gate`：跑上游的 `check_contract_approval.py`。无准奏、过期、scope 外、
  方案被改过一律 REFUSE；`refused` 即不许写码。
- `plugin_forge_security_audit`：跑上游的 `security_audit.py`。SEC-1..4 计分（SEC-2 一票否决）、
  SEC-5 清单形状提示，输出 0–100 与门禁结论。

两个门禁直接调用本包内附的 Python 脚本（零第三方依赖，Python 3.8+），不重写判据；本机无 `python`
时工具报错并给替代命令，此时按「未验证」交付。`DSH_FORGE_PYTHON` 可指定解释器。

## 安装

```
plugin_manager({ action: "install_bundle", target: "C:/path/to/NEKO-Plugin-Forge-dsh" })
```

或：

```bash
dsh plugin --profile <profile> add "C:/path/to/NEKO-Plugin-Forge-dsh"
```

装完清单里多一行 **插件制造专家团**（`id: neko-plugin-forge`）。

## 在 DSH 里跑这支团

1. 加载 skill `plugin-forge`。
2. 主理人由当前会话承担；成员用 `plugin_forge_expert` 取人设，交给 `subagent` 或 `subagent_fork`。
3. 写码前调 `plugin_forge_contract_gate`，`refused` 就回退补齐契约审议。
4. 交付前调 `plugin_forge_security_audit`，`blocked` / `fix-required` 就修完再跑。

## 与上游的差异

- 原样搬运：`skills/**`、`agents/**`、上游 `AUDIT.md` 与许可原文（见 `NOTICE.md` / `licenses/`）。
- 运行时替换：加载 skill / 人设时把 `${FORGE_HOME}` 换成安装目录绝对路径，正文前加一节「DSH 宿主适配」。
- 新增：DSH 接线（`index.js`、`lib/`、`cordis.patch.yml`、`locale/`、`icon.svg`）与 `test/`。
- 未搬运：上游维护面（`tools/`、`scripts/profile_drift.py`、CI、`codex/prompts/`）。

## 自检

```bash
node test/smoke.mjs
```

离线跑：断言 skill provider 只挂本包的 skill、`${FORGE_HOME}` 已替换、名册 14 人与按角色取人设、
三个工具已注册、门禁三态（无准奏拒 / scope 内放行 / scope 外拒）、干净树 100 分、明文密钥阻断。

包自身也用上游的安全审计扫过，命令与豁免依据在 `AUDIT.md`。

## 许可

MIT。上游 plugin-forge 同为 MIT，署名 2026 云朵（HorizonCloudy）；许可原文在 `licenses/`，
改动与第三方来源见 `NOTICE.md`。