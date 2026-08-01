import { Page, Pagination } from '../../shared/domain/page'
import { Employee } from './employee'

export const EMPLOYEE_REPOSITORY = Symbol('EMPLOYEE_REPOSITORY')

export type NewEmployee = Omit<Employee, 'id' | 'createdAt'>

export interface EmployeeRepository {
  create(newEmployee: NewEmployee): Promise<Employee>
  list(pagination: Pagination): Promise<Page<Employee>>
  findById(id: string): Promise<Employee | null>
  softDelete(id: string, deletedAt: Date): Promise<boolean>
}
