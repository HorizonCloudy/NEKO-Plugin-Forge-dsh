# 自审记录

本包用上游自带的 `security_audit.py` 扫自己。分诊跑与复跑的命令都在下面，结论按实跑填。

## 复跑命令

```bash
python skills/plugin-forge/scripts/security_audit.py . --allow skills/plugin-forge/scripts/security_audit.py,skills/neko-plugin-sandbox/scripts/sandbox.py
```

## 豁免（两条，逐条复核）

| 前缀 | 性质 | 依据 |
|---|---|---|
| `skills/plugin-forge/scripts/security_audit.py` | 扫描器自身 | 命中全是检测规则的字面量、文件头说明与自检夹具。逐字搬运上游，不改。 |
| `skills/neko-plugin-sandbox/scripts/sandbox.py` | 已声明功能的沙箱脚本 | 命中为 127.0.0.1 探活、pip 装依赖、git fetch 与本地回环示例里的 URL 凭据；用途见该 skill 与上游 AUDIT。 |

豁免只覆盖这两个文件；新增文件若命中，按发现问题处理，不扩豁免。

## 交付时的实测

以复跑命令为准，得分与退出码以实跑输出为准。改动这两个文件（重新同步上游）后必须重跑本节命令；
豁免依据随行号漂移失效，本文件只写文件级依据，不写行号。

2026-11-16 实测：SEC-1..4 各 25 分、**总分 100，放行**。SEC-5（不计分）报 1 条：`package.json`
缺 `repository` 字段——本地安装包不填对外仓库地址，留档不修。