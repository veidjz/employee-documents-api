import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../shared/domain/domain-error'
import {
  TRANSACTION_RUNNER,
  type TransactionRunner,
} from '../../shared/domain/transaction-runner'
import {
  REQUIREMENT_REPOSITORY,
  type RequirementRepository,
} from '../domain/requirement.repository'
import { Submission } from '../domain/submission'
import {
  SUBMISSION_REPOSITORY,
  type SubmissionRepository,
} from '../domain/submission.repository'

export type SubmittedFile = {
  fileName: string
  contentType: string
  sizeBytes: number
}

@Injectable()
export class SubmitDocumentUseCase {
  constructor(
    @Inject(REQUIREMENT_REPOSITORY)
    private readonly requirements: RequirementRepository,
    @Inject(SUBMISSION_REPOSITORY)
    private readonly submissions: SubmissionRepository,
    @Inject(TRANSACTION_RUNNER)
    private readonly transaction: TransactionRunner,
  ) {}

  execute(requirementId: string, file: SubmittedFile): Promise<Submission> {
    const submittedAt = new Date()

    return this.transaction.run(async () => {
      const requirement = await this.requirements.reserveNextVersion(
        requirementId,
        submittedAt,
      )

      if (!requirement) {
        throw new NotFoundError(
          'REQUIREMENT_NOT_FOUND',
          'Requirement not found',
        )
      }

      await this.submissions.deactivateActive(requirement.id)

      return this.submissions.create({
        requirementId: requirement.id,
        employeeId: requirement.employeeId,
        documentTypeId: requirement.documentTypeId,
        version: requirement.currentVersion,
        submittedAt,
        ...file,
      })
    })
  }
}
