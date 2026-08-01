import { Inject, Injectable } from '@nestjs/common'
import {
  DOCUMENT_TYPE_REPOSITORY,
  type DocumentTypeRepository,
} from '../../document-types/domain/document-type.repository'
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
    @Inject(DOCUMENT_TYPE_REPOSITORY)
    private readonly documentTypes: DocumentTypeRepository,
  ) {}

  async execute(): Promise<Overview> {
    const { totals, compliance, topPending } =
      await this.stats.aggregateRequirements()

    const documentTypesById = new Map(
      (
        await this.documentTypes.findByIds(
          topPending.map(({ documentTypeId }) => documentTypeId),
        )
      ).map(({ id, name, slug }) => [id, { id, name, slug }]),
    )

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
      topPendingDocumentTypes: topPending.map(
        ({ documentTypeId, pendingCount }) => ({
          ...documentTypesById.get(documentTypeId)!,
          pendingCount,
        }),
      ),
    }
  }
}
