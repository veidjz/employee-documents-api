import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { REQUIREMENT_REPOSITORY } from './domain/requirement.repository'
import { MongoRequirementRepository } from './infra/mongo/mongo-requirement.repository'
import {
  RequirementModel,
  RequirementSchema,
} from './infra/mongo/requirement.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RequirementModel.name, schema: RequirementSchema },
    ]),
  ],
  providers: [
    { provide: REQUIREMENT_REPOSITORY, useClass: MongoRequirementRepository },
  ],
  exports: [MongooseModule, REQUIREMENT_REPOSITORY],
})
export class RequirementPersistenceModule {}
