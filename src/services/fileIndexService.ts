import * as path from 'node:path'
import * as vscode from 'vscode'
import { configService } from '../config'
import type { FileMatch, MentionQuery } from '../types'
import {
	expandHomeDir,
	getDisplayPath,
	getFileName,
	getPathDepth,
	getRelativePath,
	normalizePath,
	pathMatchesQuery,
} from '../utils/pathUtils'

const EXCLUDE =
	'{**/node_modules/**,**/dist/**,**/build/**,**/.git/**,**/out/**}'
const MAX_RESULTS = 50
const CACHE_TTL = 30_000

function parseGitignore(content: string): string[] {
	return content
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => l && !l.startsWith('#') && !l.startsWith('!'))
}

function isGitignored(relativePath: string, patterns: string[]): boolean {
	for (const pattern of patterns) {
		const p = pattern.replace(/\/$/, '')
		if (!p) continue

		const anchored = p.startsWith('/')
		const pat = anchored ? p.slice(1) : p

		let regexStr = ''
		for (let i = 0; i < pat.length; i++) {
			// biome-ignore lint/style/noNonNullAssertion: i < pat.length guarantees defined
			const c = pat[i]!
			if (c === '*' && pat[i + 1] === '*') {
				regexStr += '.*'
				i++
				if (pat[i + 1] === '/') i++
			} else if (c === '*') {
				regexStr += '[^/]*'
			} else if (c === '?') {
				regexStr += '[^/]'
			} else {
				regexStr += c.replace(/[.+^${}()|[\]\\]/g, '\\$&')
			}
		}

		try {
			const regex = anchored
				? new RegExp(`^${regexStr}(/|$)`)
				: new RegExp(`(^|/)${regexStr}(/|$)`)
			if (regex.test(relativePath)) return true
		} catch {
			// invalid regex pattern, skip
		}
	}
	return false
}

class FileIndexService {
	private cache = new Map<string, FileMatch[]>()
	private cacheTimestamps = new Map<string, number>()

	async searchFiles(query: MentionQuery): Promise<FileMatch[]> {
		const { basePaths, relativeDirectory, allowedExtensions } =
			configService.get()

		if (!basePaths.length || !allowedExtensions.length) return []

		const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		if (!workspacePath) return []

		const allMatches: FileMatch[] = []
		const seen = new Set<string>()

		for (const basePath of basePaths) {
			const resolved = this.resolveBasePath(workspacePath, basePath)
			if (!resolved) continue

			const key = `${resolved}:${allowedExtensions.join(',')}`
			let files = this.cache.get(key)

			if (!files || this.isExpired(key)) {
				files = await this.findFiles(
					resolved,
					allowedExtensions,
					relativeDirectory,
				)
				this.cache.set(key, files)
				this.cacheTimestamps.set(key, Date.now())
			}

			for (const file of files) {
				if (seen.has(file.relativePath)) continue
				seen.add(file.relativePath)
				if (pathMatchesQuery(file.relativePath, query.query)) {
					allMatches.push(file)
				}
				if (allMatches.length >= MAX_RESULTS * 2) break
			}

			if (allMatches.length >= MAX_RESULTS * 2) break
		}

		return this.rank(allMatches, query.query).slice(0, MAX_RESULTS)
	}

	async warmCache(): Promise<void> {
		const { basePaths, allowedExtensions, relativeDirectory } =
			configService.get()
		const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		if (!workspacePath || !basePaths.length) return

		for (const basePath of basePaths) {
			const resolved = this.resolveBasePath(workspacePath, basePath)
			if (!resolved) continue
			const key = `${resolved}:${allowedExtensions.join(',')}`
			if (!this.cache.has(key)) {
				const files = await this.findFiles(
					resolved,
					allowedExtensions,
					relativeDirectory,
				)
				this.cache.set(key, files)
				this.cacheTimestamps.set(key, Date.now())
			}
		}
	}

	clearCache(): void {
		this.cache.clear()
		this.cacheTimestamps.clear()
	}

	private resolveBasePath(
		workspacePath: string,
		basePath: string,
	): string | null {
		const expanded = normalizePath(expandHomeDir(basePath))
		return path.isAbsolute(expanded)
			? expanded
			: path.join(workspacePath, expanded)
	}

	private async findFiles(
		basePath: string,
		extensions: string[],
		relativeDirectory: string,
	): Promise<FileMatch[]> {
		try {
			const gitignorePatterns = await this.readGitignorePatterns(basePath)

			const uris = await vscode.workspace.findFiles(
				new vscode.RelativePattern(basePath, '**/*'),
				EXCLUDE,
				500,
			)

			return uris
				.filter((uri) =>
					extensions.includes(path.extname(uri.fsPath).toLowerCase()),
				)
				.filter((uri) => {
					const rel = normalizePath(
						path.relative(basePath, uri.fsPath),
					)
					return !isGitignored(rel, gitignorePatterns)
				})
				.map((uri) => ({
					absolutePath: uri.fsPath,
					relativePath: getRelativePath(uri.fsPath, basePath),
					displayPath: getDisplayPath(uri.fsPath, relativeDirectory),
					fileName: getFileName(uri.fsPath),
				}))
		} catch {
			return []
		}
	}

	private async readGitignorePatterns(basePath: string): Promise<string[]> {
		try {
			const uri = vscode.Uri.file(path.join(basePath, '.gitignore'))
			const content = Buffer.from(
				await vscode.workspace.fs.readFile(uri),
			).toString('utf8')
			return parseGitignore(content)
		} catch {
			return []
		}
	}

	private isExpired(key: string): boolean {
		const ts = this.cacheTimestamps.get(key)
		return !ts || Date.now() - ts > CACHE_TTL
	}

	private rank(matches: FileMatch[], query: string): FileMatch[] {
		const q = query.toLowerCase()

		return matches
			.map((match) => {
				const fileName = match.fileName.toLowerCase()
				const relPath = match.relativePath.toLowerCase()
				let score = 0
				let exactMatch = false
				let prefixMatch = false

				if (fileName === q) {
					score = 1000
					exactMatch = true
				} else if (fileName.startsWith(q)) {
					score = 800
					prefixMatch = true
				} else if (fileName.includes(q)) {
					score = 400
				}

				if (relPath.startsWith(q)) {
					score += 200
					prefixMatch = true
				} else if (relPath.includes(q)) {
					score += 100
				}

				score -= getPathDepth(relPath) * 5

				return { match, score, exactMatch, prefixMatch }
			})
			.sort((a, b) => {
				if (a.exactMatch !== b.exactMatch) return a.exactMatch ? -1 : 1
				if (a.prefixMatch !== b.prefixMatch)
					return a.prefixMatch ? -1 : 1
				return b.score - a.score
			})
			.map((r) => r.match)
	}
}

export const fileIndexService = new FileIndexService()
