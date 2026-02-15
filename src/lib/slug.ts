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
