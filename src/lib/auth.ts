const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID ?? ''
const TOKEN_EXCHANGE_URL = import.meta.env.VITE_TOKEN_EXCHANGE_URL ?? ''
const REPO_OWNER = import.meta.env.VITE_REPO_OWNER ?? ''
const REPO_NAME = import.meta.env.VITE_REPO_NAME ?? 'thinkbin-data'

export const AUTH_CONFIG = {
  clientId: GITHUB_CLIENT_ID,
  tokenExchangeUrl: TOKEN_EXCHANGE_URL,
  repoOwner: REPO_OWNER,
  repoName: REPO_NAME,
  scope: 'repo',
} as const

export function getLoginUrl(): string {
  const params = new URLSearchParams({
    client_id: AUTH_CONFIG.clientId,
    scope: AUTH_CONFIG.scope,
    redirect_uri: window.location.origin + '/callback',
  })
  return `https://github.com/login/oauth/authorize?${params}`
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch(AUTH_CONFIG.tokenExchangeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!response.ok) throw new Error('Token exchange failed')
  const data = await response.json()
  return data.access_token
}

export function storeToken(token: string): void {
  sessionStorage.setItem('thinkbin_token', token)
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem('thinkbin_token')
}

export function clearToken(): void {
  sessionStorage.removeItem('thinkbin_token')
}
