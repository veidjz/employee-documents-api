import { Inject, Injectable } from '@nestjs/common'
import { normalizeCpf } from '../domain/cpf'
import { Employee } from '../domain/employee'
import {
  EMPLOYEE_REPOSITORY,
  type EmployeeRepository,
  type NewEmployee,
} from '../domain/employee.repository'

@Injectable()
export class CreateEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employees: EmployeeRepository,
  ) {}

  execute(newEmployee: NewEmployee): Promise<Employee> {
    return this.employees.create({
      ...newEmployee,
      cpf: normalizeCpf(newEmployee.cpf),
    })
  }
}
