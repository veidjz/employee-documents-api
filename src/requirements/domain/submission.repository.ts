import { Submission } from './submission'

export const SUBMISSION_REPOSITORY = Symbol('SUBMISSION_REPOSITORY')

export type NewSubmission = Omit<Submission, 'id' | 'isActive'>

export interface SubmissionRepository {
  create(newSubmission: NewSubmission): Promise<Submission>
  deactivateActive(requirementId: string): Promise<void>
}
