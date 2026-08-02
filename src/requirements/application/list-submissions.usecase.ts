import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '@shared/domain/domain-error'
import { Page, Pagination } from '@shared/domain/page'
import {
  REQUIREMENT_REPOSITORY,
  type RequirementRepository,
} from '../domain/requirement.repository'
import { Submission } from '../domain/submission'
import {
  SUBMISSION_REPOSITORY,
  type SubmissionRepository,
} from '../domain/submission.repository'

@Injectable()
export class ListSubmissionsUseCase {
  constructor(
    @Inject(REQUIREMENT_REPOSITORY)
    private readonly requirements: RequirementRepository,
    @Inject(SUBMISSION_REPOSITORY)
    private readonly submissions: SubmissionRepository,
  ) {}

  async execute(
    requirementId: string,
    pagination: Pagination,
  ): Promise<Page<Submission>> {
    const requirement = await this.requirements.findById(requirementId)

    if (!requirement) {
      throw new NotFoundError('REQUIREMENT_NOT_FOUND', 'Requirement not found')
    }

    return this.submissions.listByRequirement(requirementId, pagination)
  }
}
