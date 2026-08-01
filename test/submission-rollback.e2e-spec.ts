import { INestApplication } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { Model } from 'mongoose'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { DocumentTypeModel } from '../src/document-types/infra/mongo/document-type.schema'
import { EmployeeModel } from '../src/employees/infra/mongo/employee.schema'
import { Submission } from '../src/requirements/domain/submission'
import {
  NewSubmission,
  SUBMISSION_REPOSITORY,
} from '../src/requirements/domain/submission.repository'
import { RequirementListView } from '../src/requirements/infra/http/dto/requirement.view'
import { MongoSubmissionRepository } from '../src/requirements/infra/mongo/mongo-submission.repository'
import { RequirementModel } from '../src/requirements/infra/mongo/requirement.schema'
import { SubmissionModel } from '../src/requirements/infra/mongo/submission.schema'

class FailingOnSecondInsert extends MongoSubmissionRepository {
  private inserts = 0

  create(newSubmission: NewSubmission): Promise<Submission> {
    this.inserts += 1

    return this.inserts === 2
      ? Promise.reject(new Error('Submission insert failed'))
      : super.create(newSubmission)
  }
}

describe('Submission rollback (e2e)', () => {
  let app: INestApplication<App>
  let employees: Model<EmployeeModel>
  let documentTypes: Model<DocumentTypeModel>
  let requirements: Model<RequirementModel>
  let submissions: Model<SubmissionModel>

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SUBMISSION_REPOSITORY)
      .useFactory({
        factory: (model: Model<SubmissionModel>) =>
          new FailingOnSecondInsert(model),
        inject: [getModelToken(SubmissionModel.name)],
      })
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    employees = app.get<Model<EmployeeModel>>(getModelToken(EmployeeModel.name))
    documentTypes = app.get<Model<DocumentTypeModel>>(
      getModelToken(DocumentTypeModel.name),
    )
    requirements = app.get<Model<RequirementModel>>(
      getModelToken(RequirementModel.name),
    )
    submissions = app.get<Model<SubmissionModel>>(
      getModelToken(SubmissionModel.name),
    )

    await employees.syncIndexes()
    await documentTypes.syncIndexes()
    await requirements.syncIndexes()
    await submissions.syncIndexes()
  })

  afterAll(async () => {
    await app.close()
  })

  it('rolls back the version reservation when the insert fails', async () => {
    const employee = await request(app.getHttpServer())
      .post('/employees')
      .send({
        name: 'Ana Souza',
        email: 'ana.souza@example.com',
        cpf: '52998224725',
      })
      .expect(201)

    const documentType = await request(app.getHttpServer())
      .post('/document-types')
      .send({ name: 'ASO' })
      .expect(201)

    const linked = await request(app.getHttpServer())
      .post(`/employees/${(employee.body as { id: string }).id}/requirements`)
      .send({ documentTypeIds: [(documentType.body as { id: string }).id] })
      .expect(201)

    const requirementId = (linked.body as RequirementListView).data[0].id
    const file = {
      fileName: 'aso-ana.pdf',
      contentType: 'application/pdf',
      sizeBytes: 184320,
    }

    await request(app.getHttpServer())
      .post(`/requirements/${requirementId}/submissions`)
      .send(file)
      .expect(201)

    await request(app.getHttpServer())
      .post(`/requirements/${requirementId}/submissions`)
      .send(file)
      .expect(500)

    const stored = await submissions.find().exec()
    const requirement = await requirements
      .findById(requirementId)
      .orFail()
      .exec()

    expect(stored).toHaveLength(1)
    expect(stored[0].version).toBe(1)
    expect(stored[0].isActive).toBe(true)
    expect(requirement.currentVersion).toBe(1)
    expect(requirement.lastSubmittedAt).toEqual(stored[0].submittedAt)
  })
})
