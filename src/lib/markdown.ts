import matter from 'gray-matter'
import type { BinItem } from '../types/bin-item'

function extractSection(body: string, heading: string): string {
  const regex = new RegExp(`## ${heading}\n([\\s\\S]*?)(?=\n## |$)`)
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
