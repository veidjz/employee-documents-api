import { Overview } from '../../../domain/overview'

export class RequirementTotalsView {
  total!: number
  submitted!: number
  pending!: number
  completionRate!: number | null
}

export class OverviewView implements Overview {
  generatedAt!: Date
  requirements!: RequirementTotalsView
}
