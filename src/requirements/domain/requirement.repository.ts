import { Requirement } from './requirement'

export const REQUIREMENT_REPOSITORY = Symbol('REQUIREMENT_REPOSITORY')

export interface RequirementRepository {
  link(employeeId: string, documentTypeId: string): Promise<Requirement>
  unlink(employeeId: string, documentTypeId: string): Promise<boolean>
  reserveNextVersion(id: string, submittedAt: Date): Promise<Requirement | null>
  softDeleteByEmployee(employeeId: string, deletedAt: Date): Promise<void>
  softDeleteByDocumentType(
    documentTypeId: string,
    deletedAt: Date,
  ): Promise<void>
}
