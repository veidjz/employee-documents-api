import { Submission } from '../../../domain/submission'

export class SubmissionView implements Omit<
  Submission,
  'employeeId' | 'documentTypeId'
> {
  id!: string
  requirementId!: string
  version!: number
  isActive!: boolean
  fileName!: string
  contentType!: string
  sizeBytes!: number
  submittedAt!: Date
}

export function toSubmissionView(submission: Submission): SubmissionView {
  return {
    id: submission.id,
    requirementId: submission.requirementId,
    version: submission.version,
    isActive: submission.isActive,
    fileName: submission.fileName,
    contentType: submission.contentType,
    sizeBytes: submission.sizeBytes,
    submittedAt: submission.submittedAt,
  }
}
