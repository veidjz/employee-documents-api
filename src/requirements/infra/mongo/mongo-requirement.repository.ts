import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { QueryFilter, Model } from 'mongoose'
import { ConflictError } from '../../../shared/domain/domain-error'
import { Page, Pagination } from '../../../shared/domain/page'
import { isDuplicateKey } from '../../../shared/mongo/duplicate-key'
import { Requirement } from '../../domain/requirement'
import {
  RequirementFilters,
  RequirementRepository,
} from '../../domain/requirement.repository'
import { RequirementDocument, RequirementModel } from './requirement.schema'

@Injectable()
export class MongoRequirementRepository implements RequirementRepository {
  constructor(
    @InjectModel(RequirementModel.name)
    private readonly requirements: Model<RequirementModel>,
  ) {}

  async link(employeeId: string, documentTypeId: string): Promise<Requirement> {
    try {
      return toRequirement(
        await this.requirements
          .findOneAndUpdate(
            { employeeId, documentTypeId, deletedAt: { $ne: null } },
            { $set: { deletedAt: null } },
            { upsert: true, returnDocument: 'after' },
          )
          .orFail()
          .exec(),
      )
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new ConflictError(
          'REQUIREMENT_ALREADY_LINKED',
          'Document type is already linked to this employee',
        )
      }

      throw error
    }
  }

  async unlink(
    employeeId: string,
    documentTypeId: string,
    deletedAt: Date,
  ): Promise<string | null> {
    const unlinked = await this.requirements
      .findOneAndUpdate(
        { employeeId, documentTypeId, deletedAt: null },
        { $set: { deletedAt } },
      )
      .exec()

    return unlinked && unlinked._id.toString()
  }

  async list(
    { status, employeeId, documentTypeId }: RequirementFilters,
    { page, limit }: Pagination,
  ): Promise<Page<Requirement>> {
    const matching = {
      deletedAt: null,
      ...(status && { status }),
      ...(employeeId && { employeeId }),
      ...(documentTypeId && { documentTypeId }),
    }
    const [documents, total] = await Promise.all([
      this.requirements
        .find(matching)
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.requirements.countDocuments(matching).exec(),
    ])

    return { data: documents.map(toRequirement), total }
  }

  async findById(id: string): Promise<Requirement | null> {
    const found = await this.requirements
      .findOne({ _id: id, deletedAt: null })
      .exec()

    return found && toRequirement(found)
  }

  async reserveNextVersion(
    id: string,
    submittedAt: Date,
  ): Promise<Requirement | null> {
    const reserved = await this.requirements
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        {
          $inc: { currentVersion: 1 },
          $set: { status: 'SUBMITTED', lastSubmittedAt: submittedAt },
        },
        { returnDocument: 'after' },
      )
      .exec()

    return reserved && toRequirement(reserved)
  }

  softDeleteByEmployee(employeeId: string, deletedAt: Date): Promise<string[]> {
    return this.softDeleteActive({ employeeId, deletedAt: null }, deletedAt)
  }

  softDeleteByDocumentType(
    documentTypeId: string,
    deletedAt: Date,
  ): Promise<string[]> {
    return this.softDeleteActive({ documentTypeId, deletedAt: null }, deletedAt)
  }

  private async softDeleteActive(
    active: QueryFilter<RequirementModel>,
    deletedAt: Date,
  ): Promise<string[]> {
    const affected = await this.requirements.find(active).select('_id').exec()
    const ids = affected.map((requirement) => requirement._id)

    await this.requirements
      .updateMany({ _id: { $in: ids } }, { $set: { deletedAt } })
      .exec()

    return ids.map((id) => id.toString())
  }
}

function toRequirement(document: RequirementDocument): Requirement {
  return {
    id: document._id.toString(),
    employeeId: document.employeeId.toString(),
    documentTypeId: document.documentTypeId.toString(),
    status: document.status,
    currentVersion: document.currentVersion,
    lastSubmittedAt: document.lastSubmittedAt,
    createdAt: document.createdAt,
  }
}
