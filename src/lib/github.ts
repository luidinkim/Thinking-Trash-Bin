import { Octokit } from '@octokit/rest'
import { parseBinItem } from './markdown'
import type { BinItem } from '../types/bin-item'

function toBase64(str: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(str)))
}

function fromBase64(base64: string): string {
  return new TextDecoder().decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0)))
}

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

          const content = fromBase64(data.content.replace(/\n/g, ''))
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

    const content = fromBase64(data.content.replace(/\n/g, ''))
    return parseBinItem(content, filePath, data.sha)
  }

  async createItem(filePath: string, content: string, message: string): Promise<string> {
    const { data } = await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: filePath,
      message,
      content: toBase64(content),
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
      content: toBase64(content),
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
    const filename = personalPath.split('/').pop()!
    const teamPath = `bins/team/${filename}`

    await this.deleteItem(personalPath, sha, 'promote: move to team bin')
    return this.createItem(teamPath, updatedContent, 'promote: add to team bin')
  }
}
