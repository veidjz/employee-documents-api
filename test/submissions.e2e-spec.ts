import { INestApplication } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { Model } from 'mongoose'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { DocumentTypeModel } from '../src/document-types/infra/mongo/document-type.schema'
import { EmployeeModel } from '../src/employees/infra/mongo/employee.schema'
import { RequirementListView } from '../src/requirements/infra/http/dto/requirement.view'
import { SubmissionView } from '../src/requirements/infra/http/dto/submission.view'
import { RequirementModel } from '../src/requirements/infra/mongo/requirement.schema'
import { SubmissionModel } from '../src/requirements/infra/mongo/submission.schema'

describe('Submissions (e2e)', () => {
  let app: INestApplication<App>
  let employees: Model<EmployeeModel>
  let documentTypes: Model<DocumentTypeModel>
  let requirements: Model<RequirementModel>
  let submissions: Model<SubmissionModel>

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

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

  beforeEach(async () => {
    await employees.deleteMany({})
    await documentTypes.deleteMany({})
    await requirements.deleteMany({})
    await submissions.deleteMany({})
  })

  afterAll(async () => {
    await app.close()
  })

  async function linkRequirement(): Promise<string> {
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

    return (linked.body as RequirementListView).data[0].id
  }

  function submit(requirementId: string, fileName: string) {
    return request(app.getHttpServer())
      .post(`/requirements/${requirementId}/submissions`)
      .send({
        fileName,
        contentType: 'application/pdf',
        sizeBytes: 184320,
      })
      .expect(201)
  }

  it('produces sequential versions and keeps only the last one active', async () => {
    const requirementId = await linkRequirement()

    const first = await submit(requirementId, 'aso-ana.pdf')
    const second = await submit(requirementId, 'aso-ana-corrigido.pdf')

    expect(first.body).toMatchObject<Partial<SubmissionView>>({
      requirementId,
      version: 1,
      isActive: true,
      fileName: 'aso-ana.pdf',
    })
    expect(second.body).toMatchObject<Partial<SubmissionView>>({
      version: 2,
      isActive: true,
    })

    const stored = await submissions.find().sort({ version: 1 }).exec()
    const requirement = await requirements
      .findById(requirementId)
      .orFail()
      .exec()

    expect(stored.map((submission) => submission.isActive)).toEqual([
      false,
      true,
    ])
    expect(requirement.status).toBe('SUBMITTED')
    expect(requirement.currentVersion).toBe(2)
    expect(requirement.lastSubmittedAt).toEqual(stored[1].submittedAt)
  })
})
