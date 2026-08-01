import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RequirementModel } from '../../../requirements/infra/mongo/requirement.schema'
import { RequirementTotals } from '../../domain/overview'
import { StatsRepository } from '../../domain/stats.repository'

@Injectable()
export class MongoStatsRepository implements StatsRepository {
  constructor(
    @InjectModel(RequirementModel.name)
    private readonly requirements: Model<RequirementModel>,
  ) {}

  async aggregateRequirementTotals(): Promise<RequirementTotals> {
    const [totals] = await this.requirements
      .aggregate<RequirementTotals>([
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            submitted: {
              $sum: { $cond: [{ $eq: ['$status', 'SUBMITTED'] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            submitted: 1,
            pending: { $subtract: ['$total', '$submitted'] },
          },
        },
      ])
      .exec()

    return totals ?? { total: 0, submitted: 0, pending: 0 }
  }
}
