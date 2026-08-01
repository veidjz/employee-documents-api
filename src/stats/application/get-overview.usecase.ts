import { Inject, Injectable } from '@nestjs/common'
import { Overview } from '../domain/overview'
import { rate } from '../domain/rate'
import {
  STATS_REPOSITORY,
  type StatsRepository,
} from '../domain/stats.repository'

@Injectable()
export class GetOverviewUseCase {
  constructor(
    @Inject(STATS_REPOSITORY) private readonly stats: StatsRepository,
  ) {}

  async execute(): Promise<Overview> {
    const requirements = await this.stats.aggregateRequirementTotals()

    return {
      generatedAt: new Date(),
      requirements: {
        ...requirements,
        completionRate: rate(requirements.submitted, requirements.total),
      },
    }
  }
}
