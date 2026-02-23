import type { Priority } from '@/types/bin-item'

export const priorityVariant: Record<Priority, 'priority_s' | 'priority_a' | 'priority_b'> = {
  S: 'priority_s',
  A: 'priority_a',
  B: 'priority_b',
}

export const priorityLabels: Record<Priority, string> = {
  S: 'S -- 즉시 수정',
  A: 'A -- 다음 사이클',
  B: 'B -- 미래 개선',
}
