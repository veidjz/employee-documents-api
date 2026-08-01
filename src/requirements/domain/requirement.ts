export type RequirementStatus = 'PENDING' | 'SUBMITTED'

export type Requirement = {
  id: string
  employeeId: string
  documentTypeId: string
  status: RequirementStatus
  currentVersion: number
  lastSubmittedAt: Date | null
  createdAt: Date
}
