export function completionRate(
  completed: number,
  total: number,
): number | null {
  return total === 0 ? null : Number((completed / total).toFixed(4))
}
