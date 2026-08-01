import {
  RequirementDetails,
  RequirementStatus,
} from '../../../domain/requirement'

export class RequirementEmployeeView {
  id!: string
  name!: string
}

export class RequirementDocumentTypeView {
  id!: string
  name!: string
  slug!: string
}

export class RequirementView implements RequirementDetails {
  id!: string
  status!: RequirementStatus
  currentVersion!: number
  lastSubmittedAt!: Date | null
  employee!: RequirementEmployeeView
  documentType!: RequirementDocumentTypeView
  createdAt!: Date
}

export class RequirementListView {
  data!: RequirementView[]
}
