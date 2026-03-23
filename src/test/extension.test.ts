import * as assert from 'node:assert'
import * as vscode from 'vscode'

suite('Extension Integration Tests', () => {
	let document: vscode.TextDocument | undefined
	let _editor: vscode.TextEditor | undefined

	suiteSetup(async () => {
		const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		if (!workspacePath) {
			throw new Error('No workspace folder open')
		}
	})

	suiteTeardown(async () => {
		if (document) {
			await vscode.commands.executeCommand(
				'workbench.action.closeActiveEditor',
			)
		}
	})

	test('Extension should be activated', async () => {
		const ext = vscode.extensions.getExtension('context-mentions')
		assert.ok(ext, 'Extension should be available')
		assert.strictEqual(ext?.isActive, true, 'Extension should be active')
	})

	test('Completion provider should be registered for markdown', async () => {
		const provider = await vscode.commands.executeCommand(
			'vscode.executeCompletionItemProvider',
			vscode.Uri.parse('untitled:test.md'),
			new vscode.Position(0, 0),
			'@',
		)

		assert.ok(provider, 'Should return completion results')
	})

	test('Should not provide completions in non-markdown files', async () => {
		const ext = vscode.extensions.getExtension('context-mentions')
		assert.ok(ext, 'Extension should be available')

		const packageJsonUri = vscode.Uri.parse('untitled:package.json')
		const provider = await vscode.commands.executeCommand(
			'vscode.executeCompletionItemProvider',
			packageJsonUri,
			new vscode.Position(0, 0),
			'@',
		)

		assert.strictEqual(
			provider,
			null,
			'Should not provide completions for JSON',
		)
	})
})
