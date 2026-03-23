/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: This is a test fixture, so we can ignore unused parameters. */
export class AuthService {
	login(username: string, password: string): boolean {
		return true
	}

	logout(): void {
		console.log('Logged out')
	}
}
