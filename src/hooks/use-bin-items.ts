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
      thinkingNotes: '',
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

  const updateItemContent = useCallback(async (item: BinItem, patch: Partial<BinItem>) => {
    if (!github) return
    const updated: BinItem = { ...item, ...patch }
    const content = serializeBinItem(updated)
    await github.updateItem(item.filePath, content, item.sha, `update: ${item.title}`)
    await fetchItems()
  }, [github, fetchItems])

  return { items, createItem, promoteItem, updateItemStatus, updateItemContent, refreshItems: fetchItems }
}
