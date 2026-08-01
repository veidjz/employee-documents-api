export type RequirementTotals = {
  total: number
  submitted: number
  pending: number
}

export type Overview = {
  generatedAt: Date
  requirements: RequirementTotals & { completionRate: number | null }
}
