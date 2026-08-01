import { DocumentType } from '../../document-types/domain/document-type'
import { Employee } from '../../employees/domain/employee'

export type RequirementStatus = 'PENDING' | 'SUBMITTED'

export const REQUIREMENT_STATUSES: RequirementStatus[] = [
  'PENDING',
  'SUBMITTED',
]

export type Requirement = {
  id: string
  employeeId: string
  documentTypeId: string
  status: RequirementStatus
  currentVersion: number
  lastSubmittedAt: Date | null
  createdAt: Date
}

export type RequirementDetails = Omit<
  Requirement,
  'employeeId' | 'documentTypeId'
> & {
  employee: Pick<Employee, 'id' | 'name'>
  documentType: Pick<DocumentType, 'id' | 'name' | 'slug'>
}
