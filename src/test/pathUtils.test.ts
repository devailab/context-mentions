import * as assert from 'node:assert'
import {
	getFileName,
	getPathDepth,
	normalizePath,
	pathMatchesQuery,
} from '../utils/pathUtils'

suite('Path Utils Tests', () => {
	suite('normalizePath', () => {
		test('should normalize Windows backslashes to forward slashes', () => {
			assert.strictEqual(
				normalizePath('src\\features\\auth\\login.ts'),
				'src/features/auth/login.ts',
			)
		})

		test('should keep forward slashes unchanged', () => {
			assert.strictEqual(
				normalizePath('src/features/auth/login.ts'),
				'src/features/auth/login.ts',
			)
		})

		test('should handle mixed slashes', () => {
			assert.strictEqual(
				normalizePath('src/features\\auth/login.ts'),
				'src/features/auth/login.ts',
			)
		})
	})

	suite('getFileName', () => {
		test('should extract file name from path', () => {
			assert.strictEqual(
				getFileName('src/features/auth/login.ts'),
				'login.ts',
			)
		})

		test('should handle path with trailing slash', () => {
			assert.strictEqual(getFileName('src/features/auth/'), '')
		})
	})

	suite('pathMatchesQuery', () => {
		test('should match file name case-insensitively', () => {
			assert.strictEqual(
				pathMatchesQuery('src/features/auth/login.ts', 'login'),
				true,
			)
		})

		test('should match partial path case-insensitively', () => {
			assert.strictEqual(
				pathMatchesQuery('src/features/auth/login.ts', 'auth'),
				true,
			)
		})

		test('should not match non-existent query', () => {
			assert.strictEqual(
				pathMatchesQuery('src/features/auth/login.ts', 'nonexistent'),
				false,
			)
		})

		test('should match query across path segments', () => {
			assert.strictEqual(
				pathMatchesQuery('src/features/auth/login.ts', 'fea'),
				true,
			)
		})

		test('should match empty query (shows all files)', () => {
			assert.strictEqual(
				pathMatchesQuery('src/features/auth/login.ts', ''),
				true,
			)
		})
	})

	suite('getPathDepth', () => {
		test('should return correct depth for simple path', () => {
			assert.strictEqual(getPathDepth('src/file.ts'), 2)
		})

		test('should return correct depth for nested path', () => {
			assert.strictEqual(getPathDepth('src/features/auth/login.ts'), 4)
		})

		test('should return 1 for root file', () => {
			assert.strictEqual(getPathDepth('file.ts'), 1)
		})
	})
})

suite('Mention Query Extraction Tests', () => {
	const MENTION_PATTERN = /@([a-zA-Z0-9_/.-]*)$/

	test('should extract query after @ symbol', () => {
		assert.strictEqual(
			'Please review @auth'.match(MENTION_PATTERN)?.[1],
			'auth',
		)
	})

	test('should extract query with path separators', () => {
		assert.strictEqual(
			'Related: @src/fea'.match(MENTION_PATTERN)?.[1],
			'src/fea',
		)
	})

	test('should extract empty query when just @ is typed', () => {
		assert.strictEqual('See @'.match(MENTION_PATTERN)?.[1], '')
	})

	test('should match last mention when multiple @ exist', () => {
		assert.strictEqual(
			'See @auth and @login'.match(MENTION_PATTERN)?.[1],
			'login',
		)
	})
})

suite('Completion Ranking Tests', () => {
	test('should rank exact filename match higher', () => {
		const files = [
			{ fileName: 'auth.ts', relativePath: 'src/auth.ts' },
			{ fileName: 'auth.ts', relativePath: 'src/features/auth.ts' },
		]

		const query = 'auth'
		const scores = files.map((f) => {
			const name = f.fileName.toLowerCase()
			const q = query.toLowerCase()
			if (name === q) return 1000
			if (name.startsWith(q)) return 800
			if (name.includes(q)) return 400
			return 0
		})

		assert.strictEqual(scores[0], 1000)
		// biome-ignore lint/style/noNonNullAssertion: array indices are safe here
		assert.strictEqual(scores[1]! < scores[0]!, true)
	})

	test('should rank prefix matches higher than partial matches', () => {
		const fileName = 'authentication.ts'
		const query = 'auth'

		const prefixScore = fileName.startsWith(query) ? 800 : 0
		const partialScore =
			fileName.includes(query) && !fileName.startsWith(query) ? 400 : 0

		assert.strictEqual(prefixScore > partialScore, true)
	})
})
