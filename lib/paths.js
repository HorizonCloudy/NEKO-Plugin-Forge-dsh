import { fileURLToPath } from 'node:url'
import path from 'node:path'

/** Absolute package root, derived from this module's own location. */
export const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url))

/**
 * Resolve a package-relative path.
 * @param segments - path segments relative to the package root.
 * @returns the absolute path.
 */
export function packagePath(...segments) {
  return path.join(PACKAGE_ROOT, ...segments)
}

/**
 * Render a path the way skill documents and shell examples expect it: forward slashes, so a
 * pasted command stays valid on Windows and POSIX alike.
 * @param target - absolute path.
 * @returns the slash-separated form.
 */
export function toDocumentPath(target) {
  return target.replaceAll('\\', '/')
}