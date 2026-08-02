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
  EMPLOYEE_REPOSITORY,
  type EmployeeRepository,
} from '../domain/employee.repository'

@Injectable()
export class SoftDeleteEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employees: EmployeeRepository,
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
      const removed = await this.employees.softDelete(id, deletedAt)

      if (!removed) {
        throw new NotFoundError('EMPLOYEE_NOT_FOUND', 'Employee not found')
      }

      const requirementIds = await this.requirements.softDeleteByEmployee(
        id,
        deletedAt,
      )

      await this.submissions.softDeleteByRequirements(requirementIds, deletedAt)
    })
  }
}
