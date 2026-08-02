import { Inject, Injectable } from '@nestjs/common'
import {
  REQUIREMENT_REPOSITORY,
  type RequirementRepository,
} from '../../requirements/domain/requirement.repository'
import {
  SUBMISSION_REPOSITORY,
  type SubmissionRepository,
} from '../../requirements/domain/submission.repository'
import { NotFoundError } from '@shared/domain/domain-error'
import {
  TRANSACTION_RUNNER,
  type TransactionRunner,
} from '@shared/domain/transaction-runner'
import {
  DOCUMENT_TYPE_REPOSITORY,
  type DocumentTypeRepository,
} from '../domain/document-type.repository'

@Injectable()
export class SoftDeleteDocumentTypeUseCase {
  constructor(
    @Inject(DOCUMENT_TYPE_REPOSITORY)
    private readonly documentTypes: DocumentTypeRepository,
    @Inject(REQUIREMENT_REPOSITORY)
    private readonly requirements: RequirementRepository,
    @Inject(SUBMISSION_REPOSITORY)
    private readonly submissions: SubmissionRepository,
    @Inject(TRANSACTION_RUNNER)
    private readonly transaction: TransactionRunner,
  ) {}

  execute(id: string): Promise<void> {
    const deletedAt = new Date()

    return this.transaction.run(async () => {
      const removed = await this.documentTypes.softDelete(id, deletedAt)

      if (!removed) {
        throw new NotFoundError(
          'DOCUMENT_TYPE_NOT_FOUND',
          'Document type not found',
        )
      }

      const requirementIds = await this.requirements.softDeleteByDocumentType(
        id,
        deletedAt,
      )

      await this.submissions.softDeleteByRequirements(requirementIds, deletedAt)
    })
  }
}
