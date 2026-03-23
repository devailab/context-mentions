import * as vscode from 'vscode'
import { fileIndexService } from '../services/fileIndexService'
import type { FileMatch, MentionQuery } from '../types'

const MENTION_PATTERN = /@([a-zA-Z0-9_/.-]*)$/

class MarkdownMentionCompletionProvider
	implements vscode.CompletionItemProvider
{
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
	): vscode.ProviderResult<vscode.CompletionList> {
		const textBefore = document
			.lineAt(position.line)
			.text.substring(0, position.character)
		const match = textBefore.match(MENTION_PATTERN)
		if (!match) return null

		const query = match[1] ?? ''
		const startChar = position.character - query.length - 1
		const range = new vscode.Range(
			position.line,
			startChar + 1,
			position.line,
			position.character,
		)

		return this.getCompletions({ query, range }, token)
	}

	private async getCompletions(
		query: MentionQuery,
		token: vscode.CancellationToken,
	): Promise<vscode.CompletionList> {
		const files = await fileIndexService.searchFiles(query)
		if (token.isCancellationRequested)
			return new vscode.CompletionList([], false)
		return new vscode.CompletionList(
			files.map((f) => this.makeItem(f)),
			true,
		)
	}

	private makeItem(file: FileMatch): vscode.CompletionItem {
		const item = new vscode.CompletionItem(
			file.displayPath,
			vscode.CompletionItemKind.File,
		)
		item.insertText = file.displayPath
		return item
	}
}

export const markdownMentionCompletionProvider =
	new MarkdownMentionCompletionProvider()
