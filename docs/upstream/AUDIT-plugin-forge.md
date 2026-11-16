# AUDIT —— 外部内容入库审计记录

审计方法：文件清单 → 许可证 → 脚本行为静态扫描（网络/写盘/执行/删除）→ SKILL 正文提示注入检查 → 结论。
2026-11-14 起增加机械分诊一步：`skills/plugin-forge/scripts/security_audit.py`，规则见文末「例行安全审计」。
审计人：plugin-forge-docs（文档工程师）流程执行，2026-11-11。

| 对象 | 版本 | 许可证 | 行为 | 结论 |
|---|---|---|---|---|
| blader/humanizer | v4.0.0 | MIT | SKILL.md 纯改写规则，1 个 Wikipedia 外链；scripts/validate-package.py 只读本包文件做结构校验 | 通过。规则已并入 references/style-anti-slop.md，未整包 vendor |
| op7418/Humanizer-zh | main | MIT | SKILL.md 中文模式库；tests/check_structure.py 只读比对两份文本 | 通过。同上 |
| woosal1337 asd-ste100 kit | 2.0.5 | MIT（kit；ASD-STE100 规范本身版权属 ASD） | ste-lint.py 本地 lint；hooks 为 Claude Code 专用；无网络 | 通过。规则摘要并入 style-anti-slop.md；本仓库未复制其代码文件，仅引用与摘要 |
| neko-plugin-sandbox/scripts/sandbox.py | 本仓库自有 | — | 全 127.0.0.1；git/uv/pip 子进程仅用于本地沙箱；taskkill 先核对进程身份；rmtree 只删 `plugin/plugins/<id>` 下的目录 | 通过（2026-11-14 复核）。依据源码 @645da54 的契约断言已在 0984249 复验。**后两条是有条件的，2026-11-11 那轮逐行复核时并不成立**：删除面靠 `plugin-add`/`plugin-rm` 先把 id 按 `^[A-Za-z_][A-Za-z0-9_]*$` 校验（`plugin-add` 与 `cmd_plugin_rm` 各校验一次 id）才关在 plugins 目录内；杀进程面靠 `_pid_is_sandbox_server` 先读命令行，`cmd_stop` 调用它；旧版这里写的是行号，已按本文件「不写行号」的口径换成符号引用（2026-11-15：当时写的 585/616/385/420 全部漂了），命令行读不到时拒杀，除非明确 `--force`（2026-11-15 改，判定函数 `should_kill`，自检 `kill 判定` 六种组合钉住）。边界：任一校验被删或被放宽，本行结论即刻失效，须重新逐行复核 |
| session_capability_refresh.py | 本仓库自有 | — | 只读扫描 + stdout JSON，零第三方依赖，异常全捕获 exit 0 | 通过。示例路径已脱敏为 ~（**教训**：那次脱敏把 `ROOT` 的字面 `~` 留成未展开路径，脚本一度恒报「路径缺失」；2026-11-14 改为 `os.path.expanduser` 读取、只在输出侧脱敏） |
| avatars/*.jpg/png（14） | — | — | EXIF 扫描 | 无 EXIF，通过（avatars 已随 v2.0.0 移除，见整合记录） |
| intro.html（2） | — | — | 无 <script>/外链 src/onclick | 通过（intro.html 已随 v2.0.0 移除，见整合记录） |
| references/delivery-self-check.md（外部行为闸门全文 136 行，含 3.11/yzg 单机示例） | 未标注版本 | **来源与许可未确立**（frontmatter 名为 `delivery-no-pseudoblock`，2026-11-14 本机检索无上游出处） | 纯文档，无可执行代码；行为级提示词 | 暂保留但**不设为强制**：来源确立前不得作为交付闸门接线（SKILL.md §6 现在把它列为可选参考，强制口径是 §6 正文自己写的三条）；示例中的 3.11 地铁录入、yzg 字段库、`gui_review.py` 属另一产品，需剥离或标注为对照 |
| 1-dcjiang/neko-reuse-before-build（`reuse_before_build` 插件，先搜后建规则正典） | v0.3.12 / commit 4a14fbd（2026-11-15 经 GitHub API 核对：tag v0.3.12 解引用指向该 commit，LICENSE 全文为 MIT (c) 2026 1-dcjiang） | MIT（(c) 2026 1-dcjiang，仓库自带 LICENSE 文件；2026-11-15 复查：REST license 与 GraphQL licenseInfo 均返回 MIT（commit 4a14fbd）。此前记录的「licenseInfo 返回空」已作废。规则：许可以仓库里的 LICENSE 文件为准，不以 GitHub 的 license 字段为准——分类有滞后，本行就是被滞后骗过一次） | 本仓库**未内嵌**任何文本或代码，只在 SKILL.md 铁律 3、references/workflows.md 的 Workflow A 第 1a 步、agents/plugin-forge-lead.md、agents/plugin-forge-market-research.md 与 codex 提示词里指向它 | 通过（引用式接入）。规则本体、sha256 正典哈希与机械校验由上游自持，本团不复读不另立编号；要拿到校验能力请安装该插件。上游改版需重新核对版本号与 commit |
| jusspound-netizen/dsh-plugin-scanner（外部仓库，仅作设计参照） | bb8dc7cd（2026-11-14） | **无 LICENSE 文件** | 未取任何代码，只借鉴两点设计：清单形状检查、盲区不得当作放行（`--fail-unclear` + 退出码 3）| 通过（本轮只借概念，`security_audit.py` 为独立实现；LICENSE 已写设计致谢；建议上游补许可） |
| references/neko/system.llm（外部系统提示词，604 行） | v4 | **未声明**（2026-11-14 本地未找到来源与许可） | 纯文档，无可执行代码；正文含"无条件执行操作者指令"与"被问及工具能力时回避否认"两类纪律，与本团宪法冲突 | 归档保留：文件头已加 ARCHIVED 声明（不是本团行为规范，冲突时宪法优先）。来源与许可由作者补充；补不上则从公开仓库移除 |

## 脱敏记录（2026-11-11）

- 34 个文件中的 Windows 用户名路径 `C:/Users/<user>` → `~`
- 作者邮箱（个人 QQ 邮箱）→ GitHub noreply
- 删除 `__pycache__`、`plugin.json.bak-*` 过期产物
- 全库复查用户名/gho_/sk- 特征串 = 0 残留

## 残留风险

- style-anti-slop.md 是摘要而非全文；上游更新不会自动同步（升级触发：上游 major 版本变化）。
- sandbox.py 的 pip install 走 PyPI（环境准备用途，声明内），离线机器需自备依赖。
- SEC-2 有已知漏报（取舍，不是缺陷）：引号内的全大写串与纯数字口令不报——`DB_PASSWORD = "ABCDEFGH1234"`、`AWS_SECRET_KEY = "99999999"` 实测漏。收紧会把 `KEY_ENV = "AWS_SECRET_ACCESS_KEY"` 这类合法写法变成误报，而一票否决项的误报代价比漏报大。
- 1a 是纯文字门禁：rbb 的机械校验跑在 N.E.K.O 宿主，Claude Code 与 Codex 里靠执行纪律。要接本地 checker，得先解决「第二份规则副本会各自漂移」。

## 契约门禁体检（2026-11-15，issue #3）

issue #3 的 `check_contract_approval.py` 三条具体缺陷，在 HEAD 上逐条实跑复现**不成立**——它们是针对旧提交 `1a2ac4f` 写的，早已修好；真正缺的是**没人守着**。本轮把三条钉进 `--self-test`，每条再做一次反向对照（把修复撤掉，确认自检报错）：

| issue 条目 | HEAD 实测 | 钉住的测试 | 反向对照 |
|---|---|---|---|
| 目标按 cwd 解析、rel 按准奏目录算，子目录运行会误拒 | 不复现。在 `sub/` 里跑相对路径：`src/a.py` ALLOW，`sub/b.py` 因 scope 拒绝 | 子目录相对目标须解析成 `sub/nested.py` 并 ALLOW | 撤掉 `_git` 的 `cwd=root` → 报 `SELF-TEST FAIL(git)` |
| `--changed` 漏未跟踪新文件 | 不复现。`git ls-files --others` 已并入，实测新建文件进名单 | 空仓库与有提交仓库两种状态都验 | 撤掉 `ls-files --others` → 两条 FAIL（名单少了新文件） |
| 跨盘符 `relpath` 抛 ValueError 不 REFUSE | 不复现。异常被吞并转成「路径在项目根之外」，退出 1 | `Z:/` 根 + `C:/` 目标：Windows 走 ValueError 分支，Linux 走 `../` 分支，结论必须一致 | 撤掉 try/except → `ValueError: path is on mount 'C:', start on mount 'Z:'` 冒出来，自检抓到 |

issue 里标「未核实」的一条也核了：`plan_sha256` **确实**被检查。填对摘要放行，改过 `PLAN.md` 后同一份准奏变成 `REFUSE …（plan_sha256 记录 310c3b1f…，实际 97141b78…）`；填了摘要没填 `plan_file` 也拒绝。

同 issue 的其他条目，现状：`session_capability_refresh.py` 已改 `os.path.expanduser`（输出侧才脱敏，`replace('~/','~/')` 那种空操作已消失）；`generate_roster_tables.py` 的 `write()` 跟随目标文件原行尾；README 已称 profile 为**本地**权威并写明 ⓪ 陈旧门禁会降级；`neko-sources.md` 的工作坊条目已指向主仓 `fengdiehualian/neko-plugin-workshop`；profile §3/§7 于 2026-11-15 按 `acfbdbc50` 逐条重核。仍未动：`issued_by` 是自证字符串（要签名设施才能修），`.codebuddy-plugin/plugin.json` 清单缺项在工坊侧。

本轮另加两处小改：缺 `expires_at` 时打一行 WARN（不改判定，长期有效的旧准奏仍放行，只是让人看得见）；README 里「基线 0984249」一句改成两个基线的分工说明。反向对照脚本 `pf-report/gate_negative_controls.py` 留在仓库外：它靠锚定被测源码的字面文本工作，进了仓库就会变成一条天天误报的脆检查。

- **我自己的误判，记下来防复发**：写第一条测试时 `git diff` 退 129，我判成「空仓库（无提交）时 git diff 会失败」，并据此加了 `_has_head()` 分支走另一条名单。反向对照发现那个分支什么都测不到，回头实测：真·无提交仓库里 `git diff` 退 0、`ls-files --others` 正常列出文件，129 来自我的测试**忘了跑 `git init`**。分支已删除。教训：先复现故障再写修复；测试自己坏了也会长成产品缺陷的样子。

## 外部深审 bd9c9d8 的复核（2026-11-15，报告 A472）

8.6/10（上次 8.3）。报告列 8 组问题，逐条实跑核对**全部属实**，其中两条是 `bd9c9d8` 自己引进的。

| 条目 | 核对与处理 |
|---|---|
| 三.1 自检里写了两个完整的私钥头字面量 | 属实，是我上一轮加的端到端用例。实测：不带 `--allow` 扫本仓库 → SEC-2 3 处、总分 40、阻断。已拆写。教训与本文件既有的「夹具一律拆写」规则冲突，说明**加检查的同时要重跑那个检查对自身的扫描** |
| 三.2 自检临时目录不清理 | 属实，本机累积 6 个 `forge-audit-e2e-*`。已加 `finally` 里的 `rmtree`，并断言目录消失 |
| 三.4 一票否决名单三处不一致 | 属实。代码里有 `server.key`，注释却写「不含 .key」；`.npmrc` / `.jks` / `.keystore` 计否决与「误报代价比漏报大」相反。已收窄（见 `security-checklist.md` 新增的「文件名判据」），`.npmrc` / `.pypirc` 改成按内容判，`.jks` / `.keystore` 退回真盲区，`id_*` 改前缀匹配 |
| 二.1 小改动与 Workflow B 不经过 1a | 属实。`task-size-routing.md` 精简流与 Workflow B 都没有快速档这一步，SKILL 铁律 3 也没写执行者。已指名：lead 派 market-research 跑快速档；纯文档 / 文案不触发；升档到「中」以上时 1a 升级为 full lane |
| 三.5 宪法第 4 条没同步 | 属实。`constitution.md:18` 仍是「外部不可用就跳过」，而 1a 写「不豁免」。已补 1a 例外。我上一轮在 AUDIT 写的「不再对撞」是过头话，已改成事实 |
| 三.3 delivery-self-check 残留 | 属实，四处：SKILL 的那句「任何宿主都以读取该文件为加载」与「不要求执行」矛盾；AUDIT 指着一个已不存在的「§6 待决项」；`doc-writing-playbook.md` 五处仍把它当必经阶段。全部改为「可选参考，必经的是 SKILL §6 三条」 |
| 三.6 `plugin-rm` 删不掉悬空软链 | 属实。`is_dir()` 在前，悬空软链被判「不存在」，`is_symlink()` 分支走不到。已抽 `classify_plugin_path()`，先认软链 |
| 三.7 AUDIT 行号与计数过期 | 属实。本文件两处已换符号引用，豁免 1 的命中数改成实测口径 |
| 追加发现 A（反向对照抓出来的） | **CI 的「Sandbox self-test」这一步永远不会红**。入口写的是 `if __name__ == "__main__": main()`，`main()` 把 `--self-test` 的返回码丢掉，所以自检打印 FAIL 也退 0。已改成只把整数当退出码（命令路径的 `cmd_*` 返回值不算失败码）。反向对照：撤掉 `classify_plugin_path` 的软链优先判断 → 自检打印 FAIL 且退 1 |
| 追加发现 B | 自检的临时 git 仓库删不掉，本机攒了 15 个 `forge-gate-git-*`。原因：Windows 上 git 把对象文件写成只读，`unlink` 报 WinError 5，而 `shutil.rmtree(..., ignore_errors=True)` 把失败吞了；`onerror` 参数自 Python 3.12 起弃用（文档写 3.14 换成 `onexc`），但本机 3.15.2 实测它仍被接受、也不告警，所以参数名不是第一版失败的原因：真正的错在我那个处理函数只 chmod、没有重试失败的操作。已加 `_rm_tree()`：`onexc` 里 chmod 后重试，并兼容只有 `onerror` 的旧版本。清理失败只打 WARN，不判失败（防软可能临时锁住对象文件） |

### 追加：沙箱环境变量过滤的名字缺口（2026-11-15，由 sabotage 讨论引出）

反向对照那次 sabotage 用 `NOT_A_SECRET_XYZ` 想让自检失败，结果它反而被当成凭据——过滤器是**按字样**判的。
顺着这条实测出缺口：`COOKIE`、`AUTH`、`AUTHORIZATION`、`SESSION`、`SESSION_ID`、`BEARER`、`JWT`、
`DSN`、`SSHKEY`、`CONN_STR` 这 16 个名字当时会直接漏进沙箱（`DATABASE_URL`、`PASSWD` 其实已被值规则
和子串规则接住，那两个例子是误报的误报）。

处理：`SECRET_ENV_RE` 加 COOKIE/AUTH/AUTHORIZATION/SESSION/BEARER/JWT/DSN/SSHKEY/KEYCHAIN；
`SECRET_ENV_SUB` 加粘连写法 COOKIE/BEARER/JWT/SSHKEY/KEYCHAIN；新增 `CONN_SECRET_RE` 接
`Password=...` 这类非 URL 连接串。代价是 `SSH_AUTH_SOCK` 会被命中，所以写进 `KEEP_EXACT` 显式保留
（它不是口令，删了 git over SSH 就找不到 agent）。`SESSIONNAME`、`OAUTH_SCOPE`、`AUTHOR_NAME` 这类
按边界规则仍被保留。本机实测多删的是 `CLAUDE_CODE_SESSION_ID` / `WT_SESSION` 这一类会话号，
N.E.K.O 服务与 git/uv/pip 都不读它们。自检名单扩到 61 项（本机实测 `--self-test` 报 61 项）。反向对照：撤掉名字扩充 → 4 条断言报错、退 1。

边界规则不误伤 `LICENSES`、`LICENSING`、`OAUTH_SCOPE`、`AUTHOR_NAME`、`SESSIONNAME`；`LICENCE` 与
`LICENSE` 两种拼写都按名字剔掉（实测 `OPEN_LICENSE_DIR` 也剔）。

**SESSION 一类会被剔掉。** 插件若靠 `SESSION_ID`、`WT_SESSION` 这类变量做会话关联，在沙箱里读不到——
本机实测新剔的就是 4 个会话号。要关联就把值当参数显式传给插件，别依赖环境继承。这句同样写在
`sandbox.py` 的注释里，两处都有记录。

已知残留：粘连的 `LICEN[CS]E` 写法（`MYLICENCE`）不删；值里是短占位串（`<token>`、`$VAR`）时不判，避免把模板当凭据。

### 2026-11-15 二次补：粘连 KEY 与值里的 PEM 私钥

上一版把「粘连写法不删」记成已知残留，但 `KEY` 这一族漏得最狠：`PRIVATEKEY`、
`TLS_PRIVATEKEY`、`ENCRYPTIONKEY`、`SIGNINGKEY`、`MASTERKEY`、`SESSIONKEY` 六个名字
在值就是整段私钥时仍判「不是凭据」，本机实测复现。第三方插件在沙箱里能读到宿主私钥。

处理：`SECRET_ENV_SUB` 补 `KEY`；新增 `PEM_PRIV_RE`，值里出现 PEM 私钥头就算凭据。
代价是 `KEYBOARD`、`KEYMAP` 会被子串命中，所以写进 `KEEP_EXACT` 显式保留。
`LICEN[CS]E` 仍按边界判，不加子串：加了会误删 `LICENSES` 与 `LICENSING`，
那是上一版明确要保的。
自检加 2 条保留例与 7 条剔除例（夹具里的 PEM 头按 A472 口径拆写，不让本文件被自己否决）。
反向对照：在仓库外的副本里撤掉 `KEY` 与 `PEM_PRIV_RE` 两处 → 报
`ENCRYPTIONKEY`、`SIGNINGKEY`、`MASTERKEY`、`DEPLOY_BLOB` 四条断言失败。实跑 `--self-test` 的项数以命令输出为准。

## 外部深审 edc862d 的复核（2026-11-15，报告 A464）

报告给 8.3/10，列 14 条。逐条核完：13 条属实，1 条部分属实。这一轮暴露的不是代码问题，是**我把计划写成了结果**：提交 `69cde01` 的正文与 `AUDIT.md` 都写「新增两条规则形状：离线降级…与快速档」，实际手册里只有快速档。是外部审查看出来的，我自己的检查没看出来。已补条文（`references/workflows.md` 1a 节、SKILL 铁律 3、market-research 本职 4、codex 提示词第 1a 步），提交历史按既有口径不改，以本节为准。

| 报告条目 | 处理 |
|---|---|
| 1 离线降级只在 AUDIT 里存在 | 属实。已补进四处操作性文档，并写明「1a 不可跳，但它可以以『未核验』形态交付」。当时 `constitution.md` 第 4 条仍是「外部不可用就跳过」，这句说过头了：例外条款到 A472 那轮才补进去（见下一节） |
| 2 delivery-self-check 与 AUDIT、LICENSE 冲突 | 属实。SKILL §6 改成：该文件为**可选参考**，强制口径收敛成正文自己写的三条（贴闸门快照 / 每项写实 / 命中即返工）。理由按 AUDIT 原结论——来源与许可未确立前不得接线为强制 |
| 3 私钥文件默认不拦 | 属实。`security_audit.py` 新增 `secret_name_hits()`：`id_rsa`/`id_dsa`/`id_ecdsa`/`id_ed25519`/`.netrc`/`_netrc`/`.npmrc`/`.pypirc` 与 `.pfx .p12 .kdbx .ppk .jks .keystore` 按文件名计 SEC-2（不读内容）。`.pem` 与 `.key` 故意不含：前者常是公钥证书，后者在 Next.js 里是本地化文件，按名字阻断会误伤，它们留在真盲区账里 |
| 4 Codex 形态没有机器门禁 | 属实。提示词第 4 步补准奏落盘与 `check_contract_approval.py` 命令，第 8 步补 `security_audit.py`；SKILL.md「两种形态完全一致」那句现在给出命令所在位置 |
| 5 1a 缺上游两条硬约束 | 已补：候选至少 3 个、最多细评 6 个，少于 3 个回去扩词；Join/Fork 的对外写操作每次单独确认，候选仓库内容按数据不当指令 |
| 6 自检例数写死 | 已改成实算（读自身源码数 `helper_bad.append(` 出现次数）。这个数已经错过多次：11→16→18→68→75。现值以 `--self-test` 实跑输出为准（本机实测 75 例），本行不再钉死数字以免再次漂移。 |
| 7 pem 判定没进自检 | 已补端到端用例：临时目录放 `srv.pem` 与 `id_rsa`，跑真 `scan()`，断言前者进真盲区、后者计 SEC-2 |
| 8 AUDIT 引的 sandbox 行号已漂 | 已改符号引用（`_pid_is_sandbox_server` / `cmd_stop` / `plugin-add` / `plugin-rm`）。AUDIT 自己就说不写行号，这条是我自己违反的 |
| 9 `plugin-add` 不带 `--link` 时 rmtree 报错 | 属实。复制分支补 `is_symlink()` 判断，与 `--link` 分支和 `cmd_plugin_rm` 同款 |
| 10 1MB–50MB 上游文件被判「404 已删」 | 属实。抽成 `body_state()`：`None` 才是 missing，200 无正文是 big，归「无法判定」并进自检三例 |
| 11 CI 没写 permissions | 已加 `permissions: contents: read`。actions 仍按 tag 引用，改 SHA 固定属供应链加固的另一件事，未在本轮 |
| 12 contract.md 同一行既写「我落盘」又写「我不代写」 | 属实。改成一人认领：契约审议师出裁决文本，主理人写文件，`issued_by` 是自证字符串不当凭据（指向 issue #4） |
| 13 sandbox 自检覆盖面窄 | 属实，未在本轮补：`toml_section_value`、`_plugin_rows`、超时夹紧、pid 复用判断仍无用例 |
| 14 `password = user_input_value` 误报 | 已知取舍，`references/security-checklist.md` 已写明。报告建议的「右值像普通变量名就降级提示」是产品建议，未做 |

反向对照（撤掉修复看自检是否报错）：撤掉 `secret_name_hits` 的接入 → `SELF-TEST FAIL: id_rsa 按文件名没计进 SEC-2，入库私钥仍会被放行`。实跑口径：含 `id_rsa` 与 `server.pfx` 的目录 → SEC-2 2 处、85/100、阻断退出 2；只含 `cert.pem` 与 `app.key` 的目录 → 不阻断，但真盲区 2，`--fail-unclear` 退 3。

## 更正记录（2026-11-15）

- 提交 `d42b092` 正文有一句被 shell 打断：「探针确认 52 条锚点全部仍对得 afterwards 上」，读作「…全部仍对得上」。同一条命令还把 CI 探针步骤的 `run:` 改坏过，那处在 `f000526` 已修并有实测输出。正文不改写：改它要 force-push 两个已推送的提交，一句措辞不值这个代价，以本条为准。
- 提交 `0583635` 把上游 rbb 的规则形状转述错了两处，本版改正：三轮检索按**来源**分（GitHub 仓库与代码 / 包生态与清单 / 人已经提过吗），不是「功能原词→泛化词→场景词」那三层词，上游的关键词扩展是检索前的独立步骤；判决是 Join / Extend / Fork / Build 四档，先过可改性红黄绿硬闸（红不许 Join、黄只 Extend），不是三选一。依据：上游 `skills/reuse-before-build/SKILL.md` 第 45-49 行与第 65-74 行，读于 commit 4a14fbd（2026-11-15）。`SKILL.md` 铁律 3、`references/workflows.md` 1a 节、两个 agent 与 codex 提示词同步改正。
- 同一版还写了「本团不复读条文」，紧接着自己复读两条，自相矛盾。现在改成「执行要点摘要」，并给上游小节标题（Step 1 — Discover / Step 2 — Evaluate、zh-guide 第 1 步）与读到的 sha 作出处锚。
- 当时写「新增两条规则形状：离线降级…与小改动走上游快速档」。**只有快速档落地了**：离线降级在 `0583635`/`69cde01` 的任何操作性文档里都不存在，本行属于把计划写成结果。2026-11-15 由外部深审（报告 A464）指出，条文已补进 `references/workflows.md` 1a 节、SKILL 铁律 3、market-research 本职 4 与 codex 提示词。提交历史不改，以本节与下一节为准。
- 转述上游规则要连许可自述一起校：`LICENSE` 原写 `copies none of its text, rules or code`，而本版沿用上游的判决词与交付物标记 `不可复用原因 / Not reusable because:`，那句话已改成「不复制条文与代码，只复用判决词表与交付物标记」，不让它继续说过头。
- 探针与扫描器同时补了三个洞：`profile_drift.py` 把 404 与限流/断网分账（旧版全压成 None，一次限流会被读成「上游删了文件」）、当前 main 的 sha 缓存加 24 小时过期、行号形状加「带标签的 id 212、name 213」一类（覆盖由 52 条升到 53 条，实测无假漂移）；CI 给该步传 `GITHUB_TOKEN`，并把 `profile_drift.py` 加进 py_compile 与非网络自检。`security_audit.py` 把密钥材料文件（.pem .key .pfx .p12 .kdbx .ppk .jks .keystore 与 id_rsa .netrc .npmrc .pypirc 等）从「设计内排除」改判真盲区：旧版满是私钥的仓库也报「真盲区 0」。实测 fixture 一个只含 `srv.pem` 与 `cert.key` 的目录，现在报真盲区 2、加 `--fail-unclear` 退 3。
- 装机的 Codex 提示词曾经不在同步面里：`~/.codex/prompts/plugin-forge.md` 停在 2026-11-10，缺 Workflow G 风格段与整个 1a 步，而同一台机器上的 skill 树看着是新的。`pf-report/install_sync.py` 已加 `codex/prompts` 这一路（按文件名字面前缀取 plugin-forge*，整字节复制）。教训：说「三处副本已同步」之前要先确认同步脚本覆盖的面，覆盖不到的面不算同步过。

## 整合记录（2026-11-11，v2.0.0）

- 三团队并为一团：ops 12 角色与 court 朝议角色由 plugin-forge 14 人编制承接；`neko-plugin-ops/`、`neko-plugin-court/` 目录退役，其 avatars（14 张，无 EXIF）、intro.html（无脚本）、settings.json 一并移除——git 历史可找回。
- 平台资产保留：23 份 references → `skills/plugin-forge/references/neko/`；沙箱 skill → `skills/neko-plugin-sandbox/`；刷新脚本 → `scripts/`。
- 退役依据：court 的核心机制（门下省否决 + 审计留痕）已由 plugin-forge-contract 门禁 + 宪法承接，无功能损失。

## 例行安全审计（脚本化，2026-11-14 起）

- 规则来源：`skills/plugin-forge/references/security-checklist.md`——四项检查（SEC-1 路径范围 / SEC-2 明文密钥 / SEC-3 任意执行 / SEC-4 静默下载），每项 0–25 分；SEC-2 任一真实命中一票否决；总分 ≥90 放行、50–89 修完再放、其余阻断。
- 命令：`python skills/plugin-forge/scripts/security_audit.py <repo> [--allow 前缀,...] [--include-docs]`。`--allow` 只用于"已逐行复核且用途已声明"的文件，每条豁免在本节记依据。

本仓库首跑（2026-11-14，本机 Python 3.15；CI 用 3.11，被扫树 08e3c77。本节的分数是那次实跑的记录，换环境不保证复现，复核以重跑 `--json` 为准）：

| 跑法 | 范围 | 发现 | 得分 | 结论 |
|---|---|---|---|---|
| 分诊跑 | 无豁免，文件数看 `--json` 的 `scanned_files` | 分流见下 | 70（历史值） | 修完再放 |
| 复跑 | 同范围，豁免下表 3 项 | 0 处 | 95（2026-11-15 实测，见下） | 放行（exit 0） |
| 文档扫 | 加 `--include-docs`，同三条豁免 | SEC-3 6 处、SEC-4 22 处 | 60（历史值） | 见下方「文档扫扫的是缓存」一条 |

- 分诊跑 10 处发现全部落在两个文件：`skills/plugin-forge/scripts/security_audit.py`（正则定义与自述句——扫描器定义，非行为）；`skills/neko-plugin-sandbox/scripts/sandbox.py`（127.0.0.1 探活、pip 装依赖、git fetch——2026-11-11 已逐行复核，声明用途见上文与残留风险节）。即三条豁免的依据。SEC-1、SEC-2 零发现，全仓库无明文密钥与越界写入。
- 文档扫 28 处命中集中在审计与调研文档自身（security-checklist.md、neko 调研笔记、本文件、沙箱 SKILL.md），是规则描述与调研记录，不是可执行行为；SEC-4 的"已声明"判定以人工对照本文件为准，不靠脚本给满分。逐文件分布以重跑 `--json` 的输出为准，本节不再手抄。
- 盲区提醒：本节的 SEC-1 / SEC-2 数字出自放宽前的规则——旧 SEC-1 匹配不到反斜杠 `C:\Users\<名>` 路径，旧 SEC-2 匹配不到 JSON `"api_key": "..."` 与 `.env KEY=value`。放宽规则后复跑，本仓库结果不变（SEC-1 1 处、SEC-2 0 处、95/100、放行，实测）。
- 2026-11-14 二次复跑（SEC-2 覆盖面重做）：旧式 `` 在下划线处失配，`OPENAI_API_KEY=`、`DB_PASSWORD=`、`AWS_SECRET_ACCESS_KEY=`、`MY_SECRET=` 四种形状全部漏报。先改成只看字母边界并允许 `NAME_` 前缀与 `_WORD` 后缀段，复核又指出裸 token、驼峰、粘连名与 URL 内嵌凭据仍漏，且变量引用型右值会误报——一票否决项误报的代价比漏报更大。现最终形态是**按标识符拆词**判定：键名切 `_` `.` `-` 与驼峰后比对词表，右值是属性路径、全大写常量、类型标注、纯数字、URL、自引用或函数调用时排除。自检例数看 `--self-test` 输出（2026-11-15 实跑 82 例）（含误报反例与盲区分类），CI 除自检外还对本仓库真跑一次扫描。本仓库仍是 95/100、SEC-2 0 处（实测）。
- 复扫触发：仓库脚本变更 ≥5 个文件、或新增外部内容入库时重跑，结果追加进本节。

### 2026-11-15 复跑（P4/P6/P7 之后）

- 命令：`python skills/plugin-forge/scripts/security_audit.py . --allow ` + 三条豁免（逗号分隔，`--allow` 现在也可重复传）。
- 实跑结果：SEC-1 1 处、SEC-2 0 处、SEC-3 0 处、SEC-4 0 处，总分 95/100，放行。
- 自检计数一律不抄：`security_audit.py --self-test` 报 82 例，`sandbox.py --self-test` 报 76 项，
  `profile_drift.py --self-test` 报 20 例，`check_contract_approval.py --self-test` 报 PASS。
- 文档扫的新账：`--include-docs` 会把 `scripts/.drift-cache/` 里缓存的上游源码一起扫。
  2026-11-15 实测 194 处 SEC-4 命中里 163 处来自那堆缓存文本。
  所以「文档扫」那个分数现在量的是缓存，不是本仓文档。它是 CI 的 report-only 步骤，不阻塞。
  待办：给扫描器加一条默认排除 `.drift-cache/` 的口径，或把缓存挪到仓库外。

### 豁免复核（2026-11-14，对照已推送树 08e3c77 逐条核对）

- 复跑命令（三条豁免，exit 0；得分以实跑为准）：`python skills/plugin-forge/scripts/security_audit.py . --allow skills/plugin-forge/scripts/security_audit.py,skills/neko-plugin-sandbox/scripts/sandbox.py,scripts/profile_drift.py`
- 豁免 1 `skills/plugin-forge/scripts/security_audit.py`：**保留**。命中数随夹具变动，2026-11-15 实测以脚本为准；全部是文件头说明、检测规则自身的字面量与自检夹具。**夹具一律拆写**（`"-----BEGIN " + "RSA PRIVATE KEY-----"）：本文件会被自己扫，A472 抓到过我在新自检里写了两个完整的私钥头字面量，那会让不带 `--allow` 的自查直接把自己否决。
- 豁免 2 `skills/neko-plugin-sandbox/scripts/sandbox.py`：**保留**。命中均为已声明功能（新增一条 URL 内嵌凭据在 `cmd_start` 的本地回环示例里）。杀进程面的判断函数是 `_pid_is_sandbox_server`，由 `cmd_stop` 调用；它读命令行与 `/proc`。判定交给 `should_kill`：读不到（None）时拒杀并让调用方带 `--force` 再来一次，这是 2026-11-15 的改动；旧版在这里 fail-open，伪造 pid 照样被 taskkill。自检加了 6 条 kill 判定用例，撤掉 `should_kill` 会报 3 条失败。本行原来写的是行号，已按「不写行号」的口径换成符号引用（2026-11-15，A472 第 7 条）。
- 豁免 3 `scripts/profile_drift.py`：**新增**（2026-11-15）。3 处命中全在 `api()` 一个函数里：`import urllib.request`、`urllib.request.Request`、`urlopen`。用途＝只读拉取 `api.github.com/repos/Project-N-E-K-O/N.E.K.O` 的 commit 与 contents，用于锚点漂移探针；无写请求、无 exec、无落盘除 `scripts/.drift-cache/`（已 gitignore）之外的文件；带 GITHUB_TOKEN 时只作为 Authorization 头回给 api.github.com，不外发。边界：改成抓取非该仓库、或把响应内容当代码执行，本依据即刻失效。
- 口径：文件数不要手抄。取法是 `--json` 的 `scanned_files` 与 `skipped_files`，豁免条数看 `.github/workflows/sync-check.yml` 的 `AUDIT_ALLOW`（2026-11-15 实测：扫描 15 个、跳过 84 个、三条豁免）。本行以前写 5 .py / 池 13 / 文档 48 / 减 2 得 11，四个数全过期：实跑是 6 个 .py、池 15、49 个 .md、减 3 得 12。
- 本轮 8 项修复（2026-11-14）没有增删文件，但扫描器扩面后代码池为 13 个（加入无扩展名与 `.env*` 文件）。新增文字按 SEC-1 至 SEC-4 的模式表人工比对过，没有新触发词。扫描器本轮未重跑，上表的发现数沿用上次实测。
- CI 状态：sync-check #1 已在 GitHub Actions 真实 runner 通过（08e3c77，9s，四步全绿）。

## 例行复跑（2026-11-14，扫描器扩面后）

- 扫描器本轮三处变更：不再把行截断到 500 字符；无扩展名文件与 `.env*` 进扫描池；被跳过的条目写进 `skips` 清单并在结尾报数。前两条**扩大**发现面，所以旧记录的 100 分与本次不可直接对比。
- 复跑命令（沿用同三条豁免）：`python skills/plugin-forge/scripts/security_audit.py . --allow skills/plugin-forge/scripts/security_audit.py,skills/neko-plugin-sandbox/scripts/sandbox.py,scripts/profile_drift.py`
- 结果：SEC-1 1 处、SEC-2 / SEC-3 / SEC-4 各 0 处，总分 **95/100，放行**。SEC-5（不计分）本仓库 0 处。未扫描项数看 `--json` 的 `skipped_files`（2026-11-15 实测 84：49 个 .md 不在池内、29 个 .txt 缓存、4 个无扩展名、1 个 .llm、3 个豁免）——这些位置本次没有证据，不记为通过；完整清单看 `--json` 的 `skips` 字段。
- SEC-1 命中：`scripts/session_capability_refresh.py:43` `CODEBUDDY = os.path.expanduser("~/.codebuddy")`，规则「指向敏感家目录」。**依据**：该脚本按设计只读单机 CLI 配置做能力快照，不写、不删、不外传，输出侧另行脱敏。上一版没报这一条，是因为 `ROOT` 的 `~` 从未展开、脚本恒报「路径缺失」，而该规则要匹配 `expanduser(`；把路径修对之后规则才第一次真的看见它。**边界**：只读性质一旦改变（新增写入、上传或把内容拼进请求），本依据即刻失效，须重新逐行复核。
- 上一节的 100/100 保留，作为截断与扩展名过滤仍在时的历史值。
