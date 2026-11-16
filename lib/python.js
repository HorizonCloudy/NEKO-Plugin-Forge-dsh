import { execFile } from 'node:child_process'

const PROBE = 'import sys; print(sys.version_info[0])'
const MAX_BUFFER = 16 * 1024 * 1024

let resolved

/**
 * Locate a Python 3 interpreter once per plugin lifetime.
 *
 * `DSH_FORGE_PYTHON` wins so a user with a version-managed install can point at it; otherwise the
 * usual shims are probed. A candidate only wins after printing major version 3, because a
 * Microsoft Store alias answers `python` and then exits, and `py` needs `-3` on a machine with
 * both major versions installed.
 *
 * @returns the winning command and its version-selector prefix, cached for later calls.
 */
export function resolvePython() {
  resolved ??= probe()
  return resolved
}

async function probe() {
  const candidates = []
  if (process.env.DSH_FORGE_PYTHON) {
    candidates.push({ command: process.env.DSH_FORGE_PYTHON, prefix: [] })
  }
  candidates.push({ command: 'python', prefix: [] })
  if (process.platform === 'win32') {
    candidates.push({ command: 'py', prefix: ['-3'] }, { command: 'python3', prefix: [] })
  } else {
    candidates.push({ command: 'python3', prefix: [] })
  }

  const failures = []
  for (const candidate of candidates) {
    try {
      const result = await runChild(candidate.command, [...candidate.prefix, '-c', PROBE], { timeout: 20_000 })
      if (result.code === 0 && result.stdout.trim() === '3') return candidate
      failures.push(`${candidate.command}: 退出码 ${result.code} ${result.stderr.trim().split(/\r?\n/)[0] ?? ''}`.trim())
    } catch (error) {
      failures.push(`${candidate.command}: ${error.code ?? error.message}`)
    }
  }
  throw new Error(
    '本机没有可用的 Python 3 解释器，无法运行 forge 门禁脚本。'
    + `试过：${failures.join('；')}。`
    + '设置环境变量 DSH_FORGE_PYTHON 指向 python 可执行文件后重试，'
    + '或按 skill 文档手工运行该脚本；在拿到脚本输出之前，不得声称门禁通过。',
  )
}

/**
 * Run one of the bundled gate scripts with the resolved interpreter.
 * @param args - script path followed by its own arguments.
 * @param options - working directory, timeout, and the caller's cancellation signal.
 * @returns the exit code and both captured streams.
 */
export async function runPython(args, options = {}) {
  const { command, prefix } = await resolvePython()
  return runChild(command, [...prefix, ...args], options)
}

/**
 * Run a child process and settle with its exit code instead of rejecting on a non-zero exit.
 * @param command - executable.
 * @param args - arguments.
 * @param options - working directory, timeout, environment, and cancellation signal.
 * @returns exit code plus captured stdout and stderr.
 */
export function runChild(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      {
        cwd: options.cwd,
        timeout: options.timeout ?? 300_000,
        maxBuffer: MAX_BUFFER,
        windowsHide: true,
        encoding: 'utf8',
        env: options.env ?? process.env,
        signal: options.signal,
      },
      (error, stdout, stderr) => {
        if (error && typeof error.code === 'string') {
          reject(error)
          return
        }
        if (error && error.killed) {
          reject(new Error(`forge 脚本被中断或超时：${command} ${args.join(' ')}`))
          return
        }
        resolve({
          command,
          args,
          code: error ? Number(error.code ?? 1) : 0,
          stdout: stdout ?? '',
          stderr: stderr ?? '',
        })
      },
    )
  })
}