import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { REQUIREMENT_REPOSITORY } from './domain/requirement.repository'
import { SUBMISSION_REPOSITORY } from './domain/submission.repository'
import { MongoRequirementRepository } from './infra/mongo/mongo-requirement.repository'
import { MongoSubmissionRepository } from './infra/mongo/mongo-submission.repository'
import {
  RequirementModel,
  RequirementSchema,
} from './infra/mongo/requirement.schema'
import {
  SubmissionModel,
  SubmissionSchema,
} from './infra/mongo/submission.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RequirementModel.name, schema: RequirementSchema },
      { name: SubmissionModel.name, schema: SubmissionSchema },
    ]),
  ],
  providers: [
    { provide: REQUIREMENT_REPOSITORY, useClass: MongoRequirementRepository },
    { provide: SUBMISSION_REPOSITORY, useClass: MongoSubmissionRepository },
  ],
  exports: [MongooseModule, REQUIREMENT_REPOSITORY, SUBMISSION_REPOSITORY],
})
export class RequirementPersistenceModule {}
