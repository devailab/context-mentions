import * as vscode from 'vscode'
import { configService } from './config'
import { markdownMentionCompletionProvider } from './providers/markdownMentionCompletionProvider'
import { fileIndexService } from './services/fileIndexService'

export function activate(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			{ language: 'markdown' },
			markdownMentionCompletionProvider,
			'@',
		),
	)

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration('contextMentions')) {
				configService.reload()
				fileIndexService.clearCache()
				fileIndexService.warmCache()
			}
		}),
	)

	// Pre-calentar caché para que la primera sugerencia sea instantánea
	fileIndexService.warmCache()
}

export function deactivate(): void {}
