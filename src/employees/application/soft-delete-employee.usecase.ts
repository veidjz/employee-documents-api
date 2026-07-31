import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../shared/domain/domain-error'
import {
  EMPLOYEE_REPOSITORY,
  type EmployeeRepository,
} from '../domain/employee.repository'

@Injectable()
export class SoftDeleteEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employees: EmployeeRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const removed = await this.employees.softDelete(id)

    if (!removed) {
      throw new NotFoundError('EMPLOYEE_NOT_FOUND', 'Employee not found')
    }
  }
}
