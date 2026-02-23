import type { BinItem } from '@/types/bin-item'

export function buildMarkdownBody(item: BinItem): string {
  const sections: string[] = []

  if (item.problem) {
    sections.push(`## 문제 상황\n\n${item.problem}`)
  }
  if (item.currentStructure) {
    sections.push(`## 현재 구조\n\n${item.currentStructure}`)
  }
  if (item.idea) {
    sections.push(`## 개선 아이디어\n\n${item.idea}`)
  }
  if (item.impact) {
    sections.push(`## 영향 범위\n\n${item.impact}`)
  }

  return sections.join('\n\n')
}
