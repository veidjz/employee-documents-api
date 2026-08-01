import { DocumentType } from '../../document-types/domain/document-type'
import { Employee } from '../../employees/domain/employee'
import { Submission } from '../../requirements/domain/submission'

export type RequirementTotals = {
  total: number
  submitted: number
  pending: number
}

export type EmployeeCompliance = {
  withRequirements: number
  fullyCompliant: number
}

export type PendingDocumentTypeCount = {
  documentTypeId: string
  pendingCount: number
}

export type RequirementAggregates = {
  totals: RequirementTotals
  compliance: EmployeeCompliance
  topPending: PendingDocumentTypeCount[]
}

export type TopPendingDocumentType = Pick<
  DocumentType,
  'id' | 'name' | 'slug'
> & { pendingCount: number }

export type LatestSubmission = Pick<
  Submission,
  'id' | 'requirementId' | 'version' | 'submittedAt'
> & {
  employee: Pick<Employee, 'id' | 'name'>
  documentType: Pick<DocumentType, 'id' | 'name'>
}

export type Overview = {
  generatedAt: Date
  requirements: RequirementTotals & { completionRate: number | null }
  employees: EmployeeCompliance & { complianceRate: number | null }
  topPendingDocumentTypes: TopPendingDocumentType[]
  latestSubmissions: LatestSubmission[]
}
