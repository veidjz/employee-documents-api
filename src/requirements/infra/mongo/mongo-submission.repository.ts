import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Submission } from '../../domain/submission'
import {
  NewSubmission,
  SubmissionRepository,
} from '../../domain/submission.repository'
import { SubmissionDocument, SubmissionModel } from './submission.schema'

@Injectable()
export class MongoSubmissionRepository implements SubmissionRepository {
  constructor(
    @InjectModel(SubmissionModel.name)
    private readonly submissions: Model<SubmissionModel>,
  ) {}

  async create(newSubmission: NewSubmission): Promise<Submission> {
    const [created] = await this.submissions.create([newSubmission])

    return toSubmission(created)
  }

  async deactivateActive(requirementId: string): Promise<void> {
    await this.submissions
      .updateOne(
        { requirementId, isActive: true },
        { $set: { isActive: false } },
      )
      .exec()
  }
}

function toSubmission(document: SubmissionDocument): Submission {
  return {
    id: document._id.toString(),
    requirementId: document.requirementId.toString(),
    employeeId: document.employeeId.toString(),
    documentTypeId: document.documentTypeId.toString(),
    version: document.version,
    isActive: document.isActive,
    fileName: document.fileName,
    contentType: document.contentType,
    sizeBytes: document.sizeBytes,
    submittedAt: document.submittedAt,
  }
}
