export type RequirementTotals = {
  total: number
  submitted: number
  pending: number
}

export type EmployeeCompliance = {
  withRequirements: number
  fullyCompliant: number
}

export type RequirementAggregates = {
  totals: RequirementTotals
  compliance: EmployeeCompliance
}

export type Overview = {
  generatedAt: Date
  requirements: RequirementTotals & { completionRate: number | null }
  employees: EmployeeCompliance & { complianceRate: number | null }
}
