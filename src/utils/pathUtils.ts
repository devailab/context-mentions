import * as os from 'node:os'
import * as path from 'node:path'
import * as vscode from 'vscode'

export function normalizePath(filePath: string): string {
	return filePath.replace(/\\/g, '/')
}

export function expandHomeDir(filePath: string): string {
	if (filePath.startsWith('~/') || filePath === '~') {
		return filePath.replace(/^~/, os.homedir())
	}
	return filePath
}

export function getFileName(filePath: string): string {
	return path.basename(filePath)
}

export function getRelativePath(
	absolutePath: string,
	basePath: string,
): string {
	const normalizedAbsolute = normalizePath(absolutePath)
	const normalizedBase = normalizePath(basePath)

	const fileUri = vscode.Uri.file(normalizedAbsolute)

	const relativePath = vscode.workspace.asRelativePath(fileUri, false)

	if (relativePath.startsWith('..')) {
		const relative = path.relative(normalizedBase, normalizedAbsolute)
		return normalizePath(relative)
	}

	return normalizePath(relativePath)
}

export function getDisplayPath(
	absolutePath: string,
	relativeDirectory: string,
	_workspacePath?: string,
): string {
	const normalizedAbsolute = normalizePath(absolutePath)

	if (!relativeDirectory) {
		const fileUri = vscode.Uri.file(normalizedAbsolute)
		return vscode.workspace.asRelativePath(fileUri, false)
	}

	const expandedRelDir = expandHomeDir(relativeDirectory)
	const normalizedRelDir = normalizePath(expandedRelDir)

	const lastIndex = normalizedAbsolute.lastIndexOf(normalizedRelDir)

	if (lastIndex !== -1) {
		const afterDir = lastIndex + normalizedRelDir.length
		if (normalizedAbsolute.charAt(afterDir) === '/') {
			return normalizedAbsolute.substring(afterDir + 1)
		}
	}

	const fileUri = vscode.Uri.file(normalizedAbsolute)
	const relativePath = vscode.workspace.asRelativePath(fileUri, false)
	return normalizePath(relativePath)
}

export function pathMatchesQuery(filePath: string, query: string): boolean {
	return normalizePath(filePath).toLowerCase().includes(query.toLowerCase())
}

export function getPathDepth(filePath: string): number {
	return normalizePath(filePath)
		.split('/')
		.filter((s) => s.length > 0).length
}
