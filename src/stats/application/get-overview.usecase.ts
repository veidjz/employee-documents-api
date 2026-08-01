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
    const { totals, compliance } = await this.stats.aggregateRequirements()

    return {
      generatedAt: new Date(),
      requirements: {
        ...totals,
        completionRate: rate(totals.submitted, totals.total),
      },
      employees: {
        ...compliance,
        complianceRate: rate(
          compliance.fullyCompliant,
          compliance.withRequirements,
        ),
      },
    }
  }
}
