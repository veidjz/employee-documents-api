import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '@shared/domain/domain-error'
import {
  TRANSACTION_RUNNER,
  type TransactionRunner,
} from '@shared/domain/transaction-runner'
import {
  REQUIREMENT_REPOSITORY,
  type RequirementRepository,
} from '../domain/requirement.repository'
import {
  SUBMISSION_REPOSITORY,
  type SubmissionRepository,
} from '../domain/submission.repository'

@Injectable()
export class UnlinkDocumentTypeUseCase {
  constructor(
    @Inject(REQUIREMENT_REPOSITORY)
    private readonly requirements: RequirementRepository,
    @Inject(SUBMISSION_REPOSITORY)
    private readonly submissions: SubmissionRepository,
    @Inject(TRANSACTION_RUNNER)
    private readonly transaction: TransactionRunner,
  ) {}

  execute(employeeId: string, documentTypeId: string): Promise<void> {
    const deletedAt = new Date()

    return this.transaction.run(async () => {
      const requirementId = await this.requirements.unlink(
        employeeId,
        documentTypeId,
        deletedAt,
      )

      if (!requirementId) {
        throw new NotFoundError(
          'REQUIREMENT_NOT_FOUND',
          'Requirement not found',
        )
      }

      await this.submissions.softDeleteByRequirements(
        [requirementId],
        deletedAt,
      )
    })
  }
}
