import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
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
    return toRequirement(
      await this.requirements.create({ employeeId, documentTypeId }),
    )
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
