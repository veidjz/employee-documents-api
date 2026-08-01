export function rate(part: number, whole: number): number | null {
  return whole === 0 ? null : Number((part / whole).toFixed(4))
}
