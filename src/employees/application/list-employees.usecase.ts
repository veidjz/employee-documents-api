import { Inject, Injectable } from '@nestjs/common'
import { Page, Pagination } from '@shared/domain/page'
import { Employee } from '../domain/employee'
import {
  EMPLOYEE_REPOSITORY,
  type EmployeeRepository,
} from '../domain/employee.repository'

@Injectable()
export class ListEmployeesUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employees: EmployeeRepository,
  ) {}

  execute(pagination: Pagination): Promise<Page<Employee>> {
    return this.employees.list(pagination)
  }
}
