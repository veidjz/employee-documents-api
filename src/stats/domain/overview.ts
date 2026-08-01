import { DocumentType } from '../../document-types/domain/document-type'

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

export type Overview = {
  generatedAt: Date
  requirements: RequirementTotals & { completionRate: number | null }
  employees: EmployeeCompliance & { complianceRate: number | null }
  topPendingDocumentTypes: TopPendingDocumentType[]
}
