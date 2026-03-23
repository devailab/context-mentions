import type * as vscode from 'vscode'

export interface ContextMentionsConfig {
	basePaths: string[]
	relativeDirectory: string
	allowedExtensions: string[]
}

export interface FileMatch {
	absolutePath: string
	relativePath: string
	displayPath: string
	fileName: string
}

export interface MentionQuery {
	query: string
	range: vscode.Range
}

export interface CompletionRanking {
	item: FileMatch
	score: number
	exactMatch: boolean
	prefixMatch: boolean
}

export const CONFIG_KEY = 'contextMentions'
