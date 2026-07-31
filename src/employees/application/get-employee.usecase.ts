import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../shared/domain/domain-error'
import { Employee } from '../domain/employee'
import {
  EMPLOYEE_REPOSITORY,
  type EmployeeRepository,
} from '../domain/employee.repository'

@Injectable()
export class GetEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employees: EmployeeRepository,
  ) {}

  async execute(id: string): Promise<Employee> {
    const employee = await this.employees.findById(id)

    if (!employee) {
      throw new NotFoundError('EMPLOYEE_NOT_FOUND', 'Employee not found')
    }

    return employee
  }
}
