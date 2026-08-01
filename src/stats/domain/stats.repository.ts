import { RequirementTotals } from './overview'

export const STATS_REPOSITORY = Symbol('STATS_REPOSITORY')

export interface StatsRepository {
  aggregateRequirementTotals(): Promise<RequirementTotals>
}
