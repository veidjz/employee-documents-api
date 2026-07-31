import { Employee } from './employee'

export const EMPLOYEE_REPOSITORY = Symbol('EMPLOYEE_REPOSITORY')

export type NewEmployee = Omit<Employee, 'id' | 'createdAt'>

export interface EmployeeRepository {
  create(newEmployee: NewEmployee): Promise<Employee>
}
