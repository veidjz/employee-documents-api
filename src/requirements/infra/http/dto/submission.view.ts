import { PageMeta } from '@shared/http/page.view'
import { Submission } from '@requirements/domain/submission'

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

export class SubmissionPageView {
  data!: SubmissionView[]
  meta!: PageMeta
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
