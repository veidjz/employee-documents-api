import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { RequirementModel } from '../../../requirements/infra/mongo/requirement.schema'
import {
  EmployeeCompliance,
  RequirementAggregates,
  RequirementTotals,
} from '../../domain/overview'
import { StatsRepository } from '../../domain/stats.repository'

type FacetedRequirements = {
  totals: RequirementTotals[]
  compliance: EmployeeCompliance[]
  topPending: { documentTypeId: Types.ObjectId; pendingCount: number }[]
}

const TOP_PENDING_LIMIT = 5

@Injectable()
export class MongoStatsRepository implements StatsRepository {
  constructor(
    @InjectModel(RequirementModel.name)
    private readonly requirements: Model<RequirementModel>,
  ) {}

  async aggregateRequirements(): Promise<RequirementAggregates> {
    const [faceted] = await this.requirements
      .aggregate<FacetedRequirements>([
        { $match: { deletedAt: null } },
        {
          $facet: {
            totals: [
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
            ],
            compliance: [
              {
                $group: {
                  _id: '$employeeId',
                  pending: {
                    $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] },
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  withRequirements: { $sum: 1 },
                  fullyCompliant: {
                    $sum: { $cond: [{ $eq: ['$pending', 0] }, 1, 0] },
                  },
                },
              },
              { $project: { _id: 0, withRequirements: 1, fullyCompliant: 1 } },
            ],
            topPending: [
              { $match: { status: 'PENDING' } },
              { $group: { _id: '$documentTypeId', pendingCount: { $sum: 1 } } },
              { $sort: { pendingCount: -1, _id: 1 } },
              { $limit: TOP_PENDING_LIMIT },
              { $project: { _id: 0, documentTypeId: '$_id', pendingCount: 1 } },
            ],
          },
        },
      ])
      .exec()

    return {
      totals: faceted.totals[0] ?? { total: 0, submitted: 0, pending: 0 },
      compliance: faceted.compliance[0] ?? {
        withRequirements: 0,
        fullyCompliant: 0,
      },
      topPending: faceted.topPending.map(
        ({ documentTypeId, pendingCount }) => ({
          documentTypeId: documentTypeId.toString(),
          pendingCount,
        }),
      ),
    }
  }
}
