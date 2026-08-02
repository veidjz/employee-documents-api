import { Page, Pagination } from '@shared/domain/page'
import { Submission } from './submission'

export const SUBMISSION_REPOSITORY = Symbol('SUBMISSION_REPOSITORY')

export type NewSubmission = Omit<Submission, 'id' | 'isActive'>

export interface SubmissionRepository {
  create(newSubmission: NewSubmission): Promise<Submission>
  deactivateActive(requirementId: string): Promise<void>
  listByRequirement(
    requirementId: string,
    pagination: Pagination,
  ): Promise<Page<Submission>>
  listLatest(limit: number): Promise<Submission[]>
  softDeleteByRequirements(
    requirementIds: string[],
    deletedAt: Date,
  ): Promise<void>
  reviveByRequirements(requirementIds: string[]): Promise<void>
}
