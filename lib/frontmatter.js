const FENCE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/
const FIELD = /^([A-Za-z][A-Za-z0-9_-]*):[ \t]*(.*)$/

/**
 * Split a Markdown document into its YAML frontmatter fields and its body.
 *
 * Only the scalar fields the plugin needs are read (`name`, `description`, `maxTurns`, ...).
 * Nested mappings such as `metadata:` and `displayName:` are skipped whole, and a folded block
 * (`|` or `>`) is joined the way those documents write it. A full YAML parser would be a
 * dependency and a much larger surface for two files we control.
 *
 * @param text - the complete Markdown file.
 * @returns the parsed scalar fields plus the body after the closing fence.
 */
export function splitFrontmatter(text) {
  const match = FENCE.exec(text)
  if (!match) return { fields: {}, body: text }
  return { fields: parseFields(match[1]), body: text.slice(match[0].length) }
}

function parseFields(block) {
  const fields = {}
  const lines = block.split(/\r?\n/)
  for (let index = 0; index < lines.length; index++) {
    const match = FIELD.exec(lines[index])
    if (!match) continue
    const [, key, raw] = match
    if (/^[|>][+-]?$/.test(raw.trim())) {
      const blockLines = []
      while (index + 1 < lines.length && /^[ \t]+\S/.test(lines[index + 1])) {
        blockLines.push(lines[++index])
      }
      const indent = Math.min(...blockLines.map((line) => line.length - line.trimStart().length))
      const separator = raw.trim().startsWith('>') ? ' ' : '\n'
      fields[key] = blockLines
        .map((line) => line.slice(indent).trimEnd())
        .join(separator)
        .trim()
    } else if (raw.trim() === '') {
      while (index + 1 < lines.length && /^[ \t]+\S/.test(lines[index + 1])) index++
      fields[key] = ''
    } else {
      fields[key] = raw.trim().replace(/^(['"])(.*)\1$/, '$2')
    }
  }
  return fields
}