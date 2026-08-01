import { Page, Pagination } from '../../shared/domain/page'
import { Requirement, RequirementStatus } from './requirement'

export const REQUIREMENT_REPOSITORY = Symbol('REQUIREMENT_REPOSITORY')

export type RequirementFilters = {
  status?: RequirementStatus
  employeeId?: string
  documentTypeId?: string
}

export interface RequirementRepository {
  link(employeeId: string, documentTypeId: string): Promise<Requirement>
  list(
    filters: RequirementFilters,
    pagination: Pagination,
  ): Promise<Page<Requirement>>
  unlink(
    employeeId: string,
    documentTypeId: string,
    deletedAt: Date,
  ): Promise<string | null>
  findById(id: string): Promise<Requirement | null>
  reserveNextVersion(id: string, submittedAt: Date): Promise<Requirement | null>
  softDeleteByEmployee(employeeId: string, deletedAt: Date): Promise<string[]>
  softDeleteByDocumentType(
    documentTypeId: string,
    deletedAt: Date,
  ): Promise<string[]>
}
