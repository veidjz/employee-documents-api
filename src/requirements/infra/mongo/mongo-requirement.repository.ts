import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ConflictError } from '../../../shared/domain/domain-error'
import { isDuplicateKey } from '../../../shared/mongo/duplicate-key'
import { Requirement } from '../../domain/requirement'
import { RequirementRepository } from '../../domain/requirement.repository'
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
        await this.requirements.create({ employeeId, documentTypeId }),
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
