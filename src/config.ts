import * as vscode from 'vscode'
import { CONFIG_KEY, type ContextMentionsConfig } from './types'

class ConfigService {
	private config: ContextMentionsConfig = {
		basePaths: [],
		relativeDirectory: '',
		allowedExtensions: [],
	}

	constructor() {
		this.load()
	}

	private load(): void {
		const c = vscode.workspace.getConfiguration(CONFIG_KEY)
		this.config = {
			basePaths: c.get<string[]>('basePaths') ?? [],
			relativeDirectory: c.get<string>('relativeDirectory') ?? '',
			allowedExtensions: c.get<string[]>('allowedExtensions') ?? [],
		}
	}

	public get(): ContextMentionsConfig {
		return this.config
	}

	public reload(): void {
		this.load()
	}
}

export const configService = new ConfigService()
