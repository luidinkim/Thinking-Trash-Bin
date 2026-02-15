# ThinkBin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web-based improvement backlog system (ThinkBin) where team members can quickly capture improvement ideas into personal bins and promote them to a shared team bin.

**Architecture:** React SPA communicates directly with GitHub REST API via Octokit.js. All data is stored as Markdown files with YAML frontmatter in a GitHub repository. AWS Amplify hosts the static SPA and provides a single Lambda for GitHub OAuth token exchange.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS 4, Octokit.js, gray-matter, react-markdown, Vitest, React Testing Library

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `src/main.tsx`, `src/App.tsx`, `index.html`
- Create: `vitest.config.ts`, `src/test/setup.ts`

**Step 1: Scaffold Vite + React + TypeScript project**

```bash
cd /c/Users/tjdql/Desktop/AIResearch/ThinkBin
npm create vite@latest . -- --template react-ts
```

Select: Overwrite existing files (yes), React, TypeScript

**Step 2: Install core dependencies**

```bash
npm install
npm install @octokit/rest gray-matter react-markdown remark-gfm
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom
```

**Step 3: Configure Tailwind CSS 4 with Vite plugin**

Update `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Replace contents of `src/index.css`:

```css
@import "tailwindcss";
```

**Step 4: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

**Step 5: Create minimal App component**

Update `src/App.tsx`:

```tsx
function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <h1 className="text-2xl p-8">ThinkBin</h1>
    </div>
  )
}

export default App
```

**Step 6: Verify setup**

```bash
npm run dev        # Should show ThinkBin heading with dark background
npx vitest run     # Should pass (no tests yet, but no errors)
npm run build      # Should build without errors
```

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TypeScript + Tailwind + Vitest"
```

---

## Task 2: Core Types & Markdown Utilities

**Files:**
- Create: `src/types/bin-item.ts`
- Create: `src/lib/markdown.ts`
- Create: `src/lib/__tests__/markdown.test.ts`

**Step 1: Define TypeScript types**

Create `src/types/bin-item.ts`:

```ts
export type Priority = 'S' | 'A' | 'B'
export type BinItemStatus = 'open' | 'promoted' | 'resolved' | 'dropped'
export type BinScope = 'personal' | 'team'

export interface BinItem {
  id: string
  title: string
  priority: Priority
  tags: string[]
  author: string
  created: string          // ISO 8601
  status: BinItemStatus
  promoted_at: string | null
  // Body sections
  problem: string          // 문제 상황
  currentStructure: string // 현재 구조
  idea: string             // 개선 아이디어
  impact: string           // 영향 범위
  // Metadata (not stored in frontmatter)
  filePath: string         // GitHub repo path
  sha: string              // Git blob SHA for updates
}

export interface TagDefinition {
  name: string
  color: string
}

export interface TagsConfig {
  tags: TagDefinition[]
}
```

**Step 2: Write failing tests for Markdown parsing**

Create `src/lib/__tests__/markdown.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseBinItem, serializeBinItem } from '../markdown'
import type { BinItem } from '../../types/bin-item'

const SAMPLE_MARKDOWN = `---
id: "abc123"
title: "상태머신 구조 개선"
priority: "A"
tags: ["전투시스템", "아키텍처"]
author: "dev-name"
created: "2026-02-15T10:30:00+09:00"
status: "open"
promoted_at: null
---

## 문제 상황
전투 상태머신에서 이벤트 누락 발생

## 현재 구조
switch-case 기반 상태 전환

## 개선 아이디어
State 패턴 적용

## 영향 범위
- BattleStateMachine.cs
- UI 컨트롤러 3개`

describe('parseBinItem', () => {
  it('parses frontmatter and body sections from markdown', () => {
    const item = parseBinItem(SAMPLE_MARKDOWN, 'bins/personal/dev-name/test.md', 'sha123')

    expect(item.id).toBe('abc123')
    expect(item.title).toBe('상태머신 구조 개선')
    expect(item.priority).toBe('A')
    expect(item.tags).toEqual(['전투시스템', '아키텍처'])
    expect(item.author).toBe('dev-name')
    expect(item.status).toBe('open')
    expect(item.promoted_at).toBeNull()
    expect(item.problem).toContain('이벤트 누락')
    expect(item.currentStructure).toContain('switch-case')
    expect(item.idea).toContain('State 패턴')
    expect(item.impact).toContain('BattleStateMachine')
    expect(item.filePath).toBe('bins/personal/dev-name/test.md')
    expect(item.sha).toBe('sha123')
  })

  it('handles missing body sections gracefully', () => {
    const minimal = `---
id: "min1"
title: "최소 항목"
priority: "B"
tags: []
author: "dev"
created: "2026-02-15T00:00:00+09:00"
status: "open"
promoted_at: null
---`

    const item = parseBinItem(minimal, 'path.md', 'sha')
    expect(item.problem).toBe('')
    expect(item.idea).toBe('')
  })
})

describe('serializeBinItem', () => {
  it('serializes a BinItem back to markdown with frontmatter', () => {
    const item: BinItem = {
      id: 'abc123',
      title: '테스트 항목',
      priority: 'S',
      tags: ['UI'],
      author: 'dev',
      created: '2026-02-15T10:00:00+09:00',
      status: 'open',
      promoted_at: null,
      problem: '문제 설명',
      currentStructure: '현재 구조 설명',
      idea: '개선 아이디어 설명',
      impact: '영향 범위 설명',
      filePath: '',
      sha: '',
    }

    const md = serializeBinItem(item)
    expect(md).toContain('title: "테스트 항목"')
    expect(md).toContain('priority: "S"')
    expect(md).toContain('## 문제 상황')
    expect(md).toContain('문제 설명')
    expect(md).toContain('## 개선 아이디어')
  })
})
```

**Step 3: Run tests to verify they fail**

```bash
npx vitest run src/lib/__tests__/markdown.test.ts
```

Expected: FAIL — `Cannot find module '../markdown'`

**Step 4: Implement markdown parsing**

Create `src/lib/markdown.ts`:

```ts
import matter from 'gray-matter'
import type { BinItem } from '../types/bin-item'

function extractSection(body: string, heading: string): string {
  const regex = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`)
  const match = body.match(regex)
  return match ? match[1].trim() : ''
}

export function parseBinItem(markdown: string, filePath: string, sha: string): BinItem {
  const { data, content } = matter(markdown)

  return {
    id: data.id ?? '',
    title: data.title ?? '',
    priority: data.priority ?? 'B',
    tags: data.tags ?? [],
    author: data.author ?? '',
    created: data.created ?? '',
    status: data.status ?? 'open',
    promoted_at: data.promoted_at ?? null,
    problem: extractSection(content, '문제 상황'),
    currentStructure: extractSection(content, '현재 구조'),
    idea: extractSection(content, '개선 아이디어'),
    impact: extractSection(content, '영향 범위'),
    filePath,
    sha,
  }
}

export function serializeBinItem(item: BinItem): string {
  const frontmatter = [
    '---',
    `id: "${item.id}"`,
    `title: "${item.title}"`,
    `priority: "${item.priority}"`,
    `tags: ${JSON.stringify(item.tags)}`,
    `author: "${item.author}"`,
    `created: "${item.created}"`,
    `status: "${item.status}"`,
    `promoted_at: ${item.promoted_at ? `"${item.promoted_at}"` : 'null'}`,
    '---',
  ].join('\n')

  const sections = [
    `## 문제 상황\n${item.problem}`,
    `## 현재 구조\n${item.currentStructure}`,
    `## 개선 아이디어\n${item.idea}`,
    `## 영향 범위\n${item.impact}`,
  ].join('\n\n')

  return `${frontmatter}\n\n${sections}\n`
}
```

**Step 5: Run tests to verify they pass**

```bash
npx vitest run src/lib/__tests__/markdown.test.ts
```

Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/types/bin-item.ts src/lib/markdown.ts src/lib/__tests__/markdown.test.ts
git commit -m "feat: add core types and markdown parsing utilities"
```

---

## Task 3: GitHub Service Layer

**Files:**
- Create: `src/lib/github.ts`
- Create: `src/lib/__tests__/github.test.ts`
- Create: `src/lib/slug.ts`
- Create: `src/lib/__tests__/slug.test.ts`

**Step 1: Write failing tests for slug utility**

Create `src/lib/__tests__/slug.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generateFilePath } from '../slug'

describe('generateFilePath', () => {
  it('creates personal bin path with date and title slug', () => {
    const path = generateFilePath('personal', 'dev-name', '상태머신 구조 개선', '2026-02-15')
    expect(path).toBe('bins/personal/dev-name/2026-02-15-상태머신-구조-개선.md')
  })

  it('creates team bin path', () => {
    const path = generateFilePath('team', 'dev-name', '전투 시스템 리팩토링', '2026-02-15')
    expect(path).toBe('bins/team/2026-02-15-전투-시스템-리팩토링.md')
  })

  it('removes special characters from slug', () => {
    const path = generateFilePath('personal', 'dev', 'UI (이벤트) 정리!', '2026-02-15')
    expect(path).toBe('bins/personal/dev/2026-02-15-UI-이벤트-정리.md')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/slug.test.ts
```

Expected: FAIL

**Step 3: Implement slug utility**

Create `src/lib/slug.ts`:

```ts
import type { BinScope } from '../types/bin-item'

export function toSlug(title: string): string {
  return title
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function generateFilePath(
  scope: BinScope,
  author: string,
  title: string,
  date: string,
): string {
  const slug = toSlug(title)
  if (scope === 'team') {
    return `bins/team/${date}-${slug}.md`
  }
  return `bins/personal/${author}/${date}-${slug}.md`
}
```

**Step 4: Run slug tests**

```bash
npx vitest run src/lib/__tests__/slug.test.ts
```

Expected: ALL PASS

**Step 5: Write failing tests for GitHub service**

Create `src/lib/__tests__/github.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GitHubService } from '../github'

// Mock Octokit
const mockGetContent = vi.fn()
const mockCreateOrUpdateFile = vi.fn()
const mockDeleteFile = vi.fn()

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    repos: {
      getContent: mockGetContent,
      createOrUpdateFileContents: mockCreateOrUpdateFile,
      deleteFile: mockDeleteFile,
    },
  })),
}))

describe('GitHubService', () => {
  let service: GitHubService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new GitHubService('fake-token', 'owner', 'thinkbin-data')
  })

  describe('listItems', () => {
    it('lists files in a directory and parses them', async () => {
      mockGetContent.mockResolvedValueOnce({
        data: [
          { name: 'item1.md', path: 'bins/personal/dev/item1.md', sha: 'sha1', type: 'file' },
          { name: 'item2.md', path: 'bins/personal/dev/item2.md', sha: 'sha2', type: 'file' },
        ],
      })

      // Mock individual file reads
      const sampleContent = btoa(unescape(encodeURIComponent(
        '---\nid: "1"\ntitle: "Test"\npriority: "A"\ntags: []\nauthor: "dev"\ncreated: "2026-02-15"\nstatus: "open"\npromoted_at: null\n---\n\n## 문제 상황\ntest'
      )))

      mockGetContent
        .mockResolvedValueOnce({ data: { content: sampleContent, sha: 'sha1' } })
        .mockResolvedValueOnce({ data: { content: sampleContent, sha: 'sha2' } })

      const items = await service.listItems('bins/personal/dev')
      expect(items).toHaveLength(2)
      expect(mockGetContent).toHaveBeenCalledTimes(3) // 1 directory + 2 files
    })

    it('returns empty array when directory does not exist', async () => {
      mockGetContent.mockRejectedValueOnce({ status: 404 })
      const items = await service.listItems('bins/personal/newuser')
      expect(items).toEqual([])
    })
  })

  describe('createItem', () => {
    it('creates a new file via GitHub API', async () => {
      mockCreateOrUpdateFile.mockResolvedValueOnce({
        data: { content: { sha: 'newsha' } },
      })

      await service.createItem('bins/personal/dev/test.md', 'file content', 'Add item')

      expect(mockCreateOrUpdateFile).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'thinkbin-data',
        path: 'bins/personal/dev/test.md',
        message: 'Add item',
        content: expect.any(String),
      })
    })
  })

  describe('updateItem', () => {
    it('updates an existing file with sha', async () => {
      mockCreateOrUpdateFile.mockResolvedValueOnce({
        data: { content: { sha: 'updatedsha' } },
      })

      await service.updateItem('bins/personal/dev/test.md', 'updated', 'sha123', 'Update item')

      expect(mockCreateOrUpdateFile).toHaveBeenCalledWith(
        expect.objectContaining({ sha: 'sha123' }),
      )
    })
  })

  describe('promoteItem', () => {
    it('deletes from personal and creates in team directory', async () => {
      mockDeleteFile.mockResolvedValueOnce({})
      mockCreateOrUpdateFile.mockResolvedValueOnce({
        data: { content: { sha: 'newsha' } },
      })

      await service.promoteItem(
        'bins/personal/dev/2026-02-15-test.md',
        'sha123',
        'promoted content',
      )

      expect(mockDeleteFile).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'bins/personal/dev/2026-02-15-test.md',
          sha: 'sha123',
        }),
      )
      expect(mockCreateOrUpdateFile).toHaveBeenCalledWith(
        expect.objectContaining({
          path: expect.stringContaining('bins/team/'),
        }),
      )
    })
  })
})
```

**Step 6: Run tests to verify they fail**

```bash
npx vitest run src/lib/__tests__/github.test.ts
```

Expected: FAIL — `Cannot find module '../github'`

**Step 7: Implement GitHub service**

Create `src/lib/github.ts`:

```ts
import { Octokit } from '@octokit/rest'
import { parseBinItem } from './markdown'
import type { BinItem } from '../types/bin-item'

export class GitHubService {
  private octokit: Octokit
  private owner: string
  private repo: string

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token })
    this.owner = owner
    this.repo = repo
  }

  async listItems(dirPath: string): Promise<BinItem[]> {
    try {
      const { data: files } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: dirPath,
      })

      if (!Array.isArray(files)) return []

      const mdFiles = files.filter(
        (f: { name: string; type: string }) => f.type === 'file' && f.name.endsWith('.md'),
      )

      const items = await Promise.all(
        mdFiles.map(async (f: { path: string }) => {
          const { data } = await this.octokit.repos.getContent({
            owner: this.owner,
            repo: this.repo,
            path: f.path,
          }) as { data: { content: string; sha: string } }

          const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))))
          return parseBinItem(content, f.path, data.sha)
        }),
      )

      return items
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
        return []
      }
      throw err
    }
  }

  async getItem(filePath: string): Promise<BinItem> {
    const { data } = await this.octokit.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path: filePath,
    }) as { data: { content: string; sha: string } }

    const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))))
    return parseBinItem(content, filePath, data.sha)
  }

  async createItem(filePath: string, content: string, message: string): Promise<string> {
    const { data } = await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: filePath,
      message,
      content: btoa(unescape(encodeURIComponent(content))),
    })

    return data.content?.sha ?? ''
  }

  async updateItem(
    filePath: string,
    content: string,
    sha: string,
    message: string,
  ): Promise<string> {
    const { data } = await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: filePath,
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      sha,
    })

    return data.content?.sha ?? ''
  }

  async deleteItem(filePath: string, sha: string, message: string): Promise<void> {
    await this.octokit.repos.deleteFile({
      owner: this.owner,
      repo: this.repo,
      path: filePath,
      message,
      sha,
    })
  }

  async promoteItem(
    personalPath: string,
    sha: string,
    updatedContent: string,
  ): Promise<string> {
    // Extract filename from personal path
    const filename = personalPath.split('/').pop()!
    const teamPath = `bins/team/${filename}`

    // Delete from personal
    await this.deleteItem(personalPath, sha, `promote: move to team bin`)

    // Create in team
    return this.createItem(teamPath, updatedContent, `promote: add to team bin`)
  }
}
```

**Step 8: Run tests**

```bash
npx vitest run src/lib/__tests__/github.test.ts
```

Expected: ALL PASS

**Step 9: Commit**

```bash
git add src/lib/slug.ts src/lib/__tests__/slug.test.ts src/lib/github.ts src/lib/__tests__/github.test.ts
git commit -m "feat: add GitHub service layer and slug utilities"
```

---

## Task 4: Auth Context & OAuth Flow

**Files:**
- Create: `src/contexts/auth-context.tsx`
- Create: `src/components/login-page.tsx`
- Create: `src/lib/auth.ts`

**Step 1: Create auth configuration**

Create `src/lib/auth.ts`:

```ts
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
```

**Step 2: Create auth context**

Create `src/contexts/auth-context.tsx`:

```tsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { Octokit } from '@octokit/rest'
import { getStoredToken, storeToken, clearToken, exchangeCodeForToken } from '../lib/auth'

interface User {
  login: string
  avatar_url: string
  name: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  login: () => void
  logout: () => void
  handleCallback: (code: string) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async (accessToken: string) => {
    const octokit = new Octokit({ auth: accessToken })
    const { data } = await octokit.users.getAuthenticated()
    setUser({ login: data.login, avatar_url: data.avatar_url, name: data.name })
    setToken(accessToken)
  }, [])

  useEffect(() => {
    const stored = getStoredToken()
    if (stored) {
      fetchUser(stored)
        .catch(() => clearToken())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [fetchUser])

  const login = () => {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GITHUB_CLIENT_ID ?? '',
      scope: 'repo',
      redirect_uri: window.location.origin + '/callback',
    })
    window.location.href = `https://github.com/login/oauth/authorize?${params}`
  }

  const logout = () => {
    clearToken()
    setUser(null)
    setToken(null)
  }

  const handleCallback = async (code: string) => {
    setLoading(true)
    setError(null)
    try {
      const accessToken = await exchangeCodeForToken(code)
      storeToken(accessToken)
      await fetchUser(accessToken)
    } catch (err) {
      setError('로그인에 실패했습니다. 다시 시도해주세요.')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, handleCallback }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

**Step 3: Create login page**

Create `src/components/login-page.tsx`:

```tsx
import { useAuth } from '../contexts/auth-context'

export function LoginPage() {
  const { login, loading, error } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-100">🗑️ ThinkBin</h1>
          <p className="text-gray-400 mt-2">생각의 쓰레기통 — 개선 아이디어를 안전하게</p>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          onClick={login}
          disabled={loading}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg
                     border border-gray-700 transition-colors flex items-center gap-2 mx-auto
                     disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          {loading ? '로그인 중...' : 'GitHub로 로그인'}
        </button>
      </div>
    </div>
  )
}
```

**Step 4: Create `.env.example`**

Create `.env.example`:

```
VITE_GITHUB_CLIENT_ID=your_github_oauth_app_client_id
VITE_TOKEN_EXCHANGE_URL=https://your-amplify-api.amazonaws.com/token
VITE_REPO_OWNER=your_github_username
VITE_REPO_NAME=thinkbin-data
```

**Step 5: Commit**

```bash
git add src/lib/auth.ts src/contexts/auth-context.tsx src/components/login-page.tsx .env.example
git commit -m "feat: add GitHub OAuth auth flow and login page"
```

---

## Task 5: App Shell & 3-Panel Layout

**Files:**
- Create: `src/components/layout/app-shell.tsx`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/list-panel.tsx`
- Create: `src/components/layout/detail-panel.tsx`
- Create: `src/contexts/bin-context.tsx`
- Modify: `src/App.tsx`

**Step 1: Create bin state context**

Create `src/contexts/bin-context.tsx`:

```tsx
import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { BinItem, BinScope } from '../types/bin-item'

interface BinState {
  scope: BinScope
  setScope: (scope: BinScope) => void
  items: BinItem[]
  setItems: (items: BinItem[]) => void
  selectedItem: BinItem | null
  setSelectedItem: (item: BinItem | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  priorityFilter: Set<string>
  togglePriorityFilter: (priority: string) => void
  tagFilter: Set<string>
  toggleTagFilter: (tag: string) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

const BinContext = createContext<BinState | null>(null)

export function BinProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<BinScope>('personal')
  const [items, setItems] = useState<BinItem[]>([])
  const [selectedItem, setSelectedItem] = useState<BinItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(new Set())
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const togglePriorityFilter = useCallback((p: string) => {
    setPriorityFilter(prev => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  }, [])

  const toggleTagFilter = useCallback((t: string) => {
    setTagFilter(prev => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })
  }, [])

  return (
    <BinContext.Provider
      value={{
        scope, setScope,
        items, setItems,
        selectedItem, setSelectedItem,
        searchQuery, setSearchQuery,
        priorityFilter, togglePriorityFilter,
        tagFilter, toggleTagFilter,
        loading, setLoading,
      }}
    >
      {children}
    </BinContext.Provider>
  )
}

export function useBin(): BinState {
  const ctx = useContext(BinContext)
  if (!ctx) throw new Error('useBin must be used within BinProvider')
  return ctx
}
```

**Step 2: Create sidebar**

Create `src/components/layout/sidebar.tsx`:

```tsx
import { useBin } from '../../contexts/bin-context'
import { useAuth } from '../../contexts/auth-context'
import type { Priority } from '../../types/bin-item'

const PRIORITY_COLORS: Record<Priority, string> = {
  S: 'bg-red-500',
  A: 'bg-yellow-500',
  B: 'bg-blue-500',
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { scope, setScope, items } = useBin()
  const { user, logout } = useAuth()

  const countByPriority = (p: Priority) => items.filter(i => i.priority === p).length

  const allTags = [...new Set(items.flatMap(i => i.tags))]

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold text-gray-100">🗑️ ThinkBin</h1>
      </div>

      {/* Bin navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <button
          onClick={() => { setScope('personal'); onClose?.() }}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            scope === 'personal'
              ? 'bg-gray-800 text-gray-100'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
        >
          📁 내 Bin
        </button>
        <button
          onClick={() => { setScope('team'); onClose?.() }}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            scope === 'team'
              ? 'bg-gray-800 text-gray-100'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
        >
          👥 팀 Bin
        </button>

        {/* Priority counts */}
        <div className="pt-4 space-y-1">
          <p className="text-xs text-gray-500 uppercase px-3">우선순위</p>
          {(['S', 'A', 'B'] as Priority[]).map(p => (
            <div key={p} className="flex items-center gap-2 px-3 py-1 text-sm text-gray-400">
              <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[p]}`} />
              <span>{p}</span>
              <span className="ml-auto text-xs text-gray-600">{countByPriority(p)}</span>
            </div>
          ))}
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="pt-4 space-y-1">
            <p className="text-xs text-gray-500 uppercase px-3">태그</p>
            {allTags.map(tag => (
              <div key={tag} className="px-3 py-1 text-sm text-gray-400">
                #{tag}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-800 flex items-center gap-2">
        {user && (
          <>
            <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full" />
            <span className="text-sm text-gray-300 flex-1 truncate">{user.login}</span>
            <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-300">
              로그아웃
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
```

**Step 3: Create list panel**

Create `src/components/layout/list-panel.tsx`:

```tsx
import { useBin } from '../../contexts/bin-context'
import type { BinItem, Priority } from '../../types/bin-item'

const PRIORITY_DOTS: Record<Priority, string> = {
  S: 'text-red-500',
  A: 'text-yellow-500',
  B: 'text-blue-500',
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString('ko-KR')
}

function ItemCard({ item, selected, onClick }: {
  item: BinItem
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border-b border-gray-800/50 transition-colors ${
        selected ? 'bg-gray-800' : 'hover:bg-gray-800/30'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`text-xs font-mono font-bold mt-0.5 ${PRIORITY_DOTS[item.priority]}`}>
          {item.priority}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-200 truncate">{item.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex gap-1 flex-wrap">
              {item.tags.map(tag => (
                <span key={tag} className="text-xs text-gray-500">#{tag}</span>
              ))}
            </div>
            <span className="text-xs text-gray-600 ml-auto shrink-0">
              {relativeTime(item.created)}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

export function ListPanel() {
  const {
    items, selectedItem, setSelectedItem,
    searchQuery, setSearchQuery,
    priorityFilter, togglePriorityFilter,
  } = useBin()

  const filtered = items.filter(item => {
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (priorityFilter.size > 0 && !priorityFilter.has(item.priority)) return false
    return true
  })

  return (
    <div className="w-80 border-r border-gray-800 flex flex-col bg-gray-950">
      {/* Search */}
      <div className="p-3 border-b border-gray-800">
        <input
          type="text"
          placeholder="검색..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-800 rounded-md
                     text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600"
        />
      </div>

      {/* Priority filter chips */}
      <div className="px-3 py-2 flex gap-1 border-b border-gray-800/50">
        {(['S', 'A', 'B'] as Priority[]).map(p => (
          <button
            key={p}
            onClick={() => togglePriorityFilter(p)}
            className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
              priorityFilter.has(p)
                ? 'border-gray-500 text-gray-200 bg-gray-800'
                : 'border-gray-800 text-gray-600 hover:text-gray-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-600 p-4 text-center">항목이 없습니다</p>
        ) : (
          filtered.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              selected={selectedItem?.id === item.id}
              onClick={() => setSelectedItem(item)}
            />
          ))
        )}
      </div>
    </div>
  )
}
```

**Step 4: Create detail panel**

Create `src/components/layout/detail-panel.tsx`:

```tsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useBin } from '../../contexts/bin-context'
import type { Priority } from '../../types/bin-item'

const PRIORITY_LABELS: Record<Priority, { label: string; color: string }> = {
  S: { label: 'S — 즉시 수정', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  A: { label: 'A — 다음 사이클', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  B: { label: 'B — 미래 개선', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
}

export function DetailPanel({ onPromote, onResolve, onDrop }: {
  onPromote?: (item: typeof import('../../types/bin-item').BinItem.prototype) => void
  onResolve?: (item: typeof import('../../types/bin-item').BinItem.prototype) => void
  onDrop?: (item: typeof import('../../types/bin-item').BinItem.prototype) => void
}) {
  const { selectedItem, scope } = useBin()

  if (!selectedItem) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-950">
        <p className="text-gray-600">항목을 선택하세요</p>
      </div>
    )
  }

  const priority = PRIORITY_LABELS[selectedItem.priority]

  const bodyMarkdown = [
    selectedItem.problem && `## 문제 상황\n${selectedItem.problem}`,
    selectedItem.currentStructure && `## 현재 구조\n${selectedItem.currentStructure}`,
    selectedItem.idea && `## 개선 아이디어\n${selectedItem.idea}`,
    selectedItem.impact && `## 영향 범위\n${selectedItem.impact}`,
  ].filter(Boolean).join('\n\n')

  return (
    <div className="flex-1 overflow-y-auto bg-gray-950">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-100">{selectedItem.title}</h2>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-2 py-0.5 text-xs rounded-full border ${priority.color}`}>
            {priority.label}
          </span>
          {selectedItem.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-400 border border-gray-700">
              #{tag}
            </span>
          ))}
          <span className="text-xs text-gray-600">
            by {selectedItem.author} · {new Date(selectedItem.created).toLocaleDateString('ko-KR')}
          </span>
        </div>

        {/* Body */}
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{bodyMarkdown}</ReactMarkdown>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-800">
          {scope === 'personal' && selectedItem.status === 'open' && (
            <button
              onClick={() => onPromote?.(selectedItem)}
              className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors"
            >
              ↑ 팀 승격
            </button>
          )}
          <button
            onClick={() => onResolve?.(selectedItem)}
            className="px-3 py-1.5 text-sm bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-md border border-green-600/30 transition-colors"
          >
            ✓ 해결됨
          </button>
          <button
            onClick={() => onDrop?.(selectedItem)}
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-md transition-colors"
          >
            ✕ 폐기
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 5: Create app shell layout**

Create `src/components/layout/app-shell.tsx`:

```tsx
import { useState } from 'react'
import { Sidebar } from './sidebar'
import { ListPanel } from './list-panel'
import { DetailPanel } from './detail-panel'

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen flex bg-gray-950 text-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:static lg:z-auto
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center">
        <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-gray-200">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="ml-3 font-bold">ThinkBin</span>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex lg:pt-0 pt-14">
        <ListPanel />
        <DetailPanel />
      </div>
    </div>
  )
}
```

**Step 6: Wire up App.tsx**

Update `src/App.tsx`:

```tsx
import { AuthProvider, useAuth } from './contexts/auth-context'
import { BinProvider } from './contexts/bin-context'
import { LoginPage } from './components/login-page'
import { AppShell } from './components/layout/app-shell'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <BinProvider>
      <AppShell />
    </BinProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
```

**Step 7: Verify layout renders**

```bash
npm run dev   # Check 3-panel layout renders in browser
npm run build # Should build without errors
```

**Step 8: Commit**

```bash
git add src/
git commit -m "feat: add 3-panel app shell with sidebar, list, and detail panels"
```

---

## Task 6: Quick Capture Component

**Files:**
- Create: `src/components/quick-capture.tsx`
- Modify: `src/components/layout/app-shell.tsx` — add FAB + Quick Capture sheet

**Step 1: Create Quick Capture component**

Create `src/components/quick-capture.tsx`:

```tsx
import { useState } from 'react'
import type { Priority } from '../types/bin-item'

interface QuickCaptureProps {
  open: boolean
  onClose: () => void
  onSave: (data: {
    title: string
    priority: Priority
    tags: string[]
    problem: string
    currentStructure: string
    idea: string
    impact: string
  }) => void
  availableTags: string[]
}

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'S', label: 'S', color: 'border-red-500 bg-red-500/20 text-red-400' },
  { value: 'A', label: 'A', color: 'border-yellow-500 bg-yellow-500/20 text-yellow-400' },
  { value: 'B', label: 'B', color: 'border-blue-500 bg-blue-500/20 text-blue-400' },
]

export function QuickCapture({ open, onClose, onSave, availableTags }: QuickCaptureProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('B')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [expanded, setExpanded] = useState(false)
  const [problem, setProblem] = useState('')
  const [currentStructure, setCurrentStructure] = useState('')
  const [idea, setIdea] = useState('')
  const [impact, setImpact] = useState('')

  const reset = () => {
    setTitle('')
    setPriority('B')
    setSelectedTags([])
    setExpanded(false)
    setProblem('')
    setCurrentStructure('')
    setIdea('')
    setImpact('')
  }

  const handleSave = () => {
    if (!title.trim()) return
    onSave({ title: title.trim(), priority, tags: selectedTags, problem, currentStructure, idea, impact })
    reset()
    onClose()
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    )
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up">
        <div className="max-w-lg mx-auto p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300">Quick Capture</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300">✕</button>
          </div>

          {/* Title */}
          <input
            type="text"
            placeholder="제목을 입력하세요..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-md
                       text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />

          {/* Priority */}
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPriority(opt.value)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  priority === opt.value ? opt.color : 'border-gray-700 text-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Tags */}
          <div className="flex gap-1 flex-wrap">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                  selectedTags.includes(tag)
                    ? 'border-gray-500 bg-gray-800 text-gray-300'
                    : 'border-gray-700 text-gray-600 hover:text-gray-400'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Expandable detail fields */}
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="text-xs text-gray-500 hover:text-gray-400"
            >
              ▾ 상세 필드 펼치기
            </button>
          ) : (
            <div className="space-y-3">
              {[
                { label: '문제 상황', value: problem, set: setProblem },
                { label: '현재 구조', value: currentStructure, set: setCurrentStructure },
                { label: '개선 아이디어', value: idea, set: setIdea },
                { label: '영향 범위', value: impact, set: setImpact },
              ].map(field => (
                <div key={field.label}>
                  <label className="text-xs text-gray-500">{field.label}</label>
                  <textarea
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    rows={2}
                    className="w-full mt-1 px-3 py-1.5 text-sm bg-gray-800 border border-gray-700
                               rounded-md text-gray-200 placeholder-gray-600 focus:outline-none
                               focus:border-gray-500 resize-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-md
                       transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            💾 저장하고 계속 작업
          </button>
        </div>
      </div>
    </>
  )
}
```

**Step 2: Add FAB to app-shell**

In `src/components/layout/app-shell.tsx`, add the FAB button and QuickCapture import. Add a `[+]` floating button that opens the Quick Capture sheet.

**Step 3: Add slide-up animation to `src/index.css`**

```css
@import "tailwindcss";

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.animate-slide-up {
  animation: slide-up 0.2s ease-out;
}
```

**Step 4: Verify Quick Capture works**

```bash
npm run dev   # Click [+] FAB, verify sheet slides up
```

**Step 5: Commit**

```bash
git add src/
git commit -m "feat: add Quick Capture floating button and slide-up form"
```

---

## Task 7: Wire GitHub Data Flow

**Files:**
- Create: `src/hooks/use-bin-items.ts`
- Modify: `src/components/layout/app-shell.tsx` — connect to GitHub service
- Modify: `src/components/layout/detail-panel.tsx` — connect action handlers

**Step 1: Create data-fetching hook**

Create `src/hooks/use-bin-items.ts`:

```ts
import { useCallback, useEffect, useMemo } from 'react'
import { GitHubService } from '../lib/github'
import { serializeBinItem } from '../lib/markdown'
import { generateFilePath } from '../lib/slug'
import { useAuth } from '../contexts/auth-context'
import { useBin } from '../contexts/bin-context'
import { AUTH_CONFIG } from '../lib/auth'
import type { BinItem, Priority, BinItemStatus } from '../types/bin-item'

export function useBinItems() {
  const { token, user } = useAuth()
  const { scope, items, setItems, setSelectedItem, setLoading } = useBin()

  const github = useMemo(() => {
    if (!token) return null
    return new GitHubService(token, AUTH_CONFIG.repoOwner, AUTH_CONFIG.repoName)
  }, [token])

  const fetchItems = useCallback(async () => {
    if (!github || !user) return
    setLoading(true)
    try {
      const dirPath = scope === 'personal'
        ? `bins/personal/${user.login}`
        : 'bins/team'
      const fetched = await github.listItems(dirPath)
      setItems(fetched.sort((a, b) => b.created.localeCompare(a.created)))
    } catch (err) {
      console.error('Failed to fetch items:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [github, user, scope, setItems, setLoading])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const createItem = useCallback(async (data: {
    title: string
    priority: Priority
    tags: string[]
    problem: string
    currentStructure: string
    idea: string
    impact: string
  }) => {
    if (!github || !user) return

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const id = crypto.randomUUID().slice(0, 8)

    const item: BinItem = {
      id,
      title: data.title,
      priority: data.priority,
      tags: data.tags,
      author: user.login,
      created: now.toISOString(),
      status: 'open',
      promoted_at: null,
      problem: data.problem,
      currentStructure: data.currentStructure,
      idea: data.idea,
      impact: data.impact,
      filePath: '',
      sha: '',
    }

    const filePath = generateFilePath('personal', user.login, data.title, dateStr)
    const content = serializeBinItem(item)

    await github.createItem(filePath, content, `add: ${data.title}`)
    await fetchItems()
  }, [github, user, fetchItems])

  const promoteItem = useCallback(async (item: BinItem) => {
    if (!github) return
    const updated: BinItem = {
      ...item,
      status: 'promoted' as BinItemStatus,
      promoted_at: new Date().toISOString(),
    }
    const content = serializeBinItem(updated)
    await github.promoteItem(item.filePath, item.sha, content)
    setSelectedItem(null)
    await fetchItems()
  }, [github, fetchItems, setSelectedItem])

  const updateItemStatus = useCallback(async (item: BinItem, status: BinItemStatus) => {
    if (!github) return
    const updated: BinItem = { ...item, status }
    const content = serializeBinItem(updated)
    await github.updateItem(item.filePath, content, item.sha, `${status}: ${item.title}`)
    setSelectedItem(null)
    await fetchItems()
  }, [github, fetchItems, setSelectedItem])

  return { items, createItem, promoteItem, updateItemStatus, refreshItems: fetchItems }
}
```

**Step 2: Wire up AppShell with the hook**

Update `src/components/layout/app-shell.tsx` to use `useBinItems()` and pass `createItem` to `QuickCapture`, pass `promoteItem`/`updateItemStatus` to `DetailPanel`.

**Step 3: Test the full flow manually**

```bash
npm run dev
```

1. Set up `.env` with real GitHub OAuth credentials
2. Login → verify redirect to GitHub and back
3. Create an item via Quick Capture
4. Verify it appears in the list
5. Click to view detail
6. Promote to team bin

**Step 4: Commit**

```bash
git add src/
git commit -m "feat: wire GitHub data flow with create, promote, and status update"
```

---

## Task 8: OAuth Callback Handler

**Files:**
- Create: `src/components/oauth-callback.tsx`
- Modify: `src/App.tsx` — add callback route handling

**Step 1: Create callback component**

Create `src/components/oauth-callback.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/auth-context'

export function OAuthCallback({ onComplete }: { onComplete: () => void }) {
  const { handleCallback } = useAuth()
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      handleCallback(code)
        .then(() => {
          window.history.replaceState({}, '', '/')
          onComplete()
        })
        .catch(() => {
          window.history.replaceState({}, '', '/')
          onComplete()
        })
    } else {
      window.history.replaceState({}, '', '/')
      onComplete()
    }
  }, [handleCallback, onComplete])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">로그인 처리 중...</p>
    </div>
  )
}
```

**Step 2: Add callback routing to App.tsx**

Update `src/App.tsx` to detect `/callback` path and render `OAuthCallback`.

```tsx
import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './contexts/auth-context'
import { BinProvider } from './contexts/bin-context'
import { LoginPage } from './components/login-page'
import { OAuthCallback } from './components/oauth-callback'
import { AppShell } from './components/layout/app-shell'

function AppContent() {
  const { user, loading } = useAuth()
  const [isCallback, setIsCallback] = useState(
    window.location.pathname === '/callback'
  )

  const handleCallbackComplete = useCallback(() => setIsCallback(false), [])

  if (isCallback) return <OAuthCallback onComplete={handleCallbackComplete} />

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <BinProvider>
      <AppShell />
    </BinProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
```

**Step 3: Commit**

```bash
git add src/
git commit -m "feat: add OAuth callback handler for GitHub login flow"
```

---

## Task 9: Kanban View

**Files:**
- Create: `src/components/kanban-view.tsx`
- Modify: `src/components/layout/app-shell.tsx` — add view toggle

**Step 1: Create Kanban component**

Create `src/components/kanban-view.tsx`:

```tsx
import { useBin } from '../contexts/bin-context'
import type { BinItem, Priority } from '../types/bin-item'

const COLUMNS: { priority: Priority; label: string; color: string; bg: string }[] = [
  { priority: 'S', label: 'S — 즉시 수정', color: 'border-red-500', bg: 'bg-red-500/5' },
  { priority: 'A', label: 'A — 다음 사이클', color: 'border-yellow-500', bg: 'bg-yellow-500/5' },
  { priority: 'B', label: 'B — 미래 개선', color: 'border-blue-500', bg: 'bg-blue-500/5' },
]

function KanbanCard({ item, onClick }: { item: BinItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
    >
      <p className="text-sm text-gray-200">{item.title}</p>
      <div className="flex gap-1 mt-2 flex-wrap">
        {item.tags.map(tag => (
          <span key={tag} className="text-xs text-gray-500">#{tag}</span>
        ))}
      </div>
    </button>
  )
}

export function KanbanView() {
  const { items, setSelectedItem } = useBin()

  return (
    <div className="flex-1 p-4 overflow-x-auto">
      <div className="flex gap-4 min-w-max h-full">
        {COLUMNS.map(col => {
          const colItems = items.filter(i => i.priority === col.priority)
          return (
            <div key={col.priority} className={`w-72 rounded-lg ${col.bg} border-t-2 ${col.color}`}>
              <div className="p-3 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-300">{col.label}</h3>
                <span className="text-xs text-gray-600">{colItems.length}</span>
              </div>
              <div className="p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-12rem)]">
                {colItems.map(item => (
                  <KanbanCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 2: Add view toggle to AppShell**

Add a toggle in the top bar of `app-shell.tsx` to switch between 'list' and 'kanban' views. When kanban is selected, replace `<ListPanel /> + <DetailPanel />` with `<KanbanView />`.

**Step 3: Verify kanban view**

```bash
npm run dev   # Toggle between list and kanban views
```

**Step 4: Commit**

```bash
git add src/
git commit -m "feat: add kanban board view with S/A/B columns"
```

---

## Task 10: Toast Notifications

**Files:**
- Create: `src/components/toast.tsx`
- Create: `src/contexts/toast-context.tsx`

**Step 1: Create toast context**

Create `src/contexts/toast-context.tsx`:

```tsx
import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastState {
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastState | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastState {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
```

**Step 2: Create toast component**

Create `src/components/toast.tsx`:

```tsx
import { useToast } from '../contexts/toast-context'

const TYPE_STYLES = {
  success: 'bg-green-900/80 border-green-700 text-green-200',
  error: 'bg-red-900/80 border-red-700 text-red-200',
  info: 'bg-gray-800/80 border-gray-700 text-gray-200',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-2 rounded-lg border text-sm backdrop-blur ${TYPE_STYLES[toast.type]}`}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
```

**Step 3: Wire toasts into App**

Add `ToastProvider` wrapping `AppContent` and `ToastContainer` at root level.

**Step 4: Use toast in data operations**

Add `addToast('항목이 생성되었습니다', 'success')` calls to the create, promote, and status-update operations.

**Step 5: Commit**

```bash
git add src/
git commit -m "feat: add toast notification system for user feedback"
```

---

## Task 11: Dark Mode & Styling Polish

**Files:**
- Modify: `src/index.css` — add Tailwind typography plugin, custom colors
- Modify: `index.html` — add dark class to html element, meta tags

**Step 1: Install typography plugin**

```bash
npm install -D @tailwindcss/typography
```

**Step 2: Update index.css**

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.animate-slide-up {
  animation: slide-up 0.2s ease-out;
}

/* Scrollbar styling */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #4b5563; }
```

**Step 3: Update index.html meta tags**

```html
<html lang="ko" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#030712" />
  <title>ThinkBin — 생각의 쓰레기통</title>
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
</head>
```

**Step 4: Verify visual quality**

```bash
npm run dev   # Check dark mode, scrollbars, typography, mobile
```

**Step 5: Commit**

```bash
git add src/index.css index.html
git commit -m "style: add dark mode polish, typography, and scrollbar styling"
```

---

## Task 12: AWS Amplify Deployment Setup

**Files:**
- Create: `amplify.yml`
- Create: `amplify/functions/token-exchange/handler.ts`
- Create: `amplify/functions/token-exchange/package.json`

**Step 1: Create Amplify build spec**

Create `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
  customHeaders:
    - pattern: '**/*'
      headers:
        - key: 'X-Frame-Options'
          value: 'DENY'
```

**Step 2: Create Lambda function for token exchange**

Create `amplify/functions/token-exchange/handler.ts`:

```ts
export async function handler(event: { body: string }) {
  const { code } = JSON.parse(event.body)

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const data = await response.json()

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN ?? '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ access_token: data.access_token }),
  }
}
```

**Step 3: Add SPA redirect for client-side routing**

Create `public/_redirects`:

```
/*  /index.html  200
```

Or add to `amplify.yml` custom rules section:

```yaml
  customRules:
    - source: '</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>'
      target: '/index.html'
      status: '200'
```

**Step 4: Create `.env.production.example`**

```
VITE_GITHUB_CLIENT_ID=your_production_client_id
VITE_TOKEN_EXCHANGE_URL=https://your-amplify-api.amazonaws.com/token
VITE_REPO_OWNER=your_github_org_or_user
VITE_REPO_NAME=thinkbin-data
```

**Step 5: Commit**

```bash
git add amplify.yml amplify/ public/_redirects .env.production.example
git commit -m "chore: add AWS Amplify deployment config and OAuth Lambda"
```

---

## Task 13: Final Integration Test & Cleanup

**Files:**
- Modify: various — fix any TypeScript errors, remove unused imports
- Create: `.gitignore` updates

**Step 1: Run full type check**

```bash
npx tsc --noEmit
```

Fix any TypeScript errors.

**Step 2: Run all tests**

```bash
npx vitest run
```

All tests should pass.

**Step 3: Run build**

```bash
npm run build
```

Build should succeed with no errors.

**Step 4: Test complete flow manually**

1. `npm run dev`
2. Login with GitHub
3. Create item via Quick Capture (title only)
4. Create item with full details
5. View item in detail panel
6. Switch between list and kanban views
7. Promote item to team bin
8. Mark item as resolved
9. Test on mobile viewport (Chrome DevTools)

**Step 5: Update .gitignore**

Ensure `.gitignore` includes:

```
node_modules
dist
.env
.env.local
.env.production
```

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup and integration verification"
```

---

## Summary

| Task | Description | Estimated Steps |
|------|-------------|-----------------|
| 1 | Project Scaffolding | 7 |
| 2 | Core Types & Markdown Utilities | 6 |
| 3 | GitHub Service Layer | 9 |
| 4 | Auth Context & OAuth Flow | 5 |
| 5 | App Shell & 3-Panel Layout | 8 |
| 6 | Quick Capture Component | 5 |
| 7 | Wire GitHub Data Flow | 4 |
| 8 | OAuth Callback Handler | 3 |
| 9 | Kanban View | 4 |
| 10 | Toast Notifications | 5 |
| 11 | Dark Mode & Styling Polish | 5 |
| 12 | AWS Amplify Deployment Setup | 5 |
| 13 | Final Integration Test & Cleanup | 6 |
| **Total** | | **72 steps** |

**Dependencies:** Tasks 1→2→3 must be sequential. Task 4 can start after 1. Tasks 5-6 can start after 2. Task 7 needs 3+4+5+6. Tasks 8-11 need 7. Task 12 is independent. Task 13 is last.
