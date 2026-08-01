import { Overview } from '../../../domain/overview'

export class RequirementTotalsView {
  total!: number
  submitted!: number
  pending!: number
  completionRate!: number | null
}

export class EmployeeComplianceView {
  withRequirements!: number
  fullyCompliant!: number
  complianceRate!: number | null
}

export class TopPendingDocumentTypeView {
  id!: string
  name!: string
  slug!: string
  pendingCount!: number
}

export class LatestSubmissionEmployeeView {
  id!: string
  name!: string
}

export class LatestSubmissionDocumentTypeView {
  id!: string
  name!: string
}

export class LatestSubmissionView {
  id!: string
  requirementId!: string
  version!: number
  submittedAt!: Date
  employee!: LatestSubmissionEmployeeView
  documentType!: LatestSubmissionDocumentTypeView
}

export class OverviewView implements Overview {
  generatedAt!: Date
  requirements!: RequirementTotalsView
  employees!: EmployeeComplianceView
  topPendingDocumentTypes!: TopPendingDocumentTypeView[]
  latestSubmissions!: LatestSubmissionView[]
}
