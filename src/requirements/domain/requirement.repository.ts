import { Requirement } from './requirement'

export const REQUIREMENT_REPOSITORY = Symbol('REQUIREMENT_REPOSITORY')

export interface RequirementRepository {
  link(employeeId: string, documentTypeId: string): Promise<Requirement>
  unlink(employeeId: string, documentTypeId: string): Promise<boolean>
  softDeleteByEmployee(employeeId: string, deletedAt: Date): Promise<void>
}
