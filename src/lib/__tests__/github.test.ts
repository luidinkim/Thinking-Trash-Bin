import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GitHubService } from '../github'

// Mock Octokit
const mockGetContent = vi.fn()
const mockCreateOrUpdateFile = vi.fn()
const mockDeleteFile = vi.fn()

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(function () {
    return {
      repos: {
        getContent: mockGetContent,
        createOrUpdateFileContents: mockCreateOrUpdateFile,
        deleteFile: mockDeleteFile,
      },
    }
  }),
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

      const rawContent =
        '---\nid: "1"\ntitle: "Test"\npriority: "A"\ntags: []\nauthor: "dev"\ncreated: "2026-02-15"\nstatus: "open"\npromoted_at: null\n---\n\n## 문제 상황\ntest'
      const sampleContent = Buffer.from(rawContent, 'utf-8').toString('base64')

      mockGetContent
        .mockResolvedValueOnce({ data: { content: sampleContent, sha: 'sha1' } })
        .mockResolvedValueOnce({ data: { content: sampleContent, sha: 'sha2' } })

      const items = await service.listItems('bins/personal/dev')
      expect(items).toHaveLength(2)
      expect(mockGetContent).toHaveBeenCalledTimes(3)
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
