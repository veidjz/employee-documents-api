import { Inject, Injectable } from '@nestjs/common'
import { completionRate } from '../domain/completion-rate'
import { Overview } from '../domain/overview'
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
        completionRate: completionRate(
          requirements.submitted,
          requirements.total,
        ),
      },
    }
  }
}
