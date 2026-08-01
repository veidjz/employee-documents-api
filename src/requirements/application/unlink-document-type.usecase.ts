import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../shared/domain/domain-error'
import {
  REQUIREMENT_REPOSITORY,
  type RequirementRepository,
} from '../domain/requirement.repository'

@Injectable()
export class UnlinkDocumentTypeUseCase {
  constructor(
    @Inject(REQUIREMENT_REPOSITORY)
    private readonly requirements: RequirementRepository,
  ) {}

  async execute(employeeId: string, documentTypeId: string): Promise<void> {
    const unlinked = await this.requirements.unlink(employeeId, documentTypeId)

    if (!unlinked) {
      throw new NotFoundError('REQUIREMENT_NOT_FOUND', 'Requirement not found')
    }
  }
}
