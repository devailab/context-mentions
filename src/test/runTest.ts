import * as path from 'node:path'
import { runTests } from '@vscode/test-electron'

async function main() {
	try {
		const extensionDevelopmentPath = path.resolve(__dirname, '../../')
		const extensionTestsPath = path.resolve(__dirname, './index')
		const testWorkspace = path.resolve(__dirname, '../../src/testFixture')

		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [testWorkspace],
		})
	} catch (error) {
		console.error('Failed to run tests:', error)
		process.exit(1)
	}
}

main()
