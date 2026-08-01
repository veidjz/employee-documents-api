export type Submission = {
  id: string
  requirementId: string
  employeeId: string
  documentTypeId: string
  version: number
  isActive: boolean
  fileName: string
  contentType: string
  sizeBytes: number
  submittedAt: Date
}
