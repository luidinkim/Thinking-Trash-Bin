import type { BinItem } from '../types/bin-item'

function parseFrontmatter(markdown: string): { data: Record<string, unknown>; content: string } {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: markdown }

  const data: Record<string, unknown> = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let val: unknown = line.slice(idx + 1).trim()

    // Parse value types
    const str = val as string
    if (str === 'null') val = null
    else if (str === 'true') val = true
    else if (str === 'false') val = false
    else if (str.startsWith('"') && str.endsWith('"')) val = str.slice(1, -1)
    else if (str.startsWith('[') && str.endsWith(']')) {
      try { val = JSON.parse(str) } catch { /* keep as string */ }
    }

    data[key] = val
  }

  return { data, content: match[2] }
}

function extractSection(body: string, heading: string): string {
  const regex = new RegExp(`## ${heading}\n([\\s\\S]*?)(?=\n## |$)`)
  const match = body.match(regex)
  return match ? match[1].trim() : ''
}

export function parseBinItem(markdown: string, filePath: string, sha: string): BinItem {
  const { data, content } = parseFrontmatter(markdown)

  return {
    id: (data.id as string) ?? '',
    title: (data.title as string) ?? '',
    priority: (data.priority as string as BinItem['priority']) ?? 'B',
    tags: (data.tags as string[]) ?? [],
    author: (data.author as string) ?? '',
    created: (data.created as string) ?? '',
    status: (data.status as string as BinItem['status']) ?? 'open',
    promoted_at: (data.promoted_at as string) ?? null,
    problem: extractSection(content, '문제 상황'),
    currentStructure: extractSection(content, '현재 구조'),
    idea: extractSection(content, '개선 아이디어'),
    impact: extractSection(content, '영향 범위'),
    thinkingNotes: extractSection(content, '생각 노트'),
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
  ]

  if (item.thinkingNotes) {
    sections.push(`## 생각 노트\n${item.thinkingNotes}`)
  }

  return `${frontmatter}\n\n${sections.join('\n\n')}\n`
}
