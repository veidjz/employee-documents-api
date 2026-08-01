import { RequirementAggregates } from './overview'

export const STATS_REPOSITORY = Symbol('STATS_REPOSITORY')

export interface StatsRepository {
  aggregateRequirements(): Promise<RequirementAggregates>
}
