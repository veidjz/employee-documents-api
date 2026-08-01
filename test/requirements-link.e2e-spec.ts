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
import { RequirementModel } from '../src/requirements/infra/mongo/requirement.schema'

describe('Requirements link (e2e)', () => {
  let app: INestApplication<App>
  let employees: Model<EmployeeModel>
  let documentTypes: Model<DocumentTypeModel>
  let requirements: Model<RequirementModel>

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

    await employees.syncIndexes()
    await documentTypes.syncIndexes()
    await requirements.syncIndexes()
  })

  beforeEach(async () => {
    await employees.deleteMany({})
    await documentTypes.deleteMany({})
    await requirements.deleteMany({})
  })

  afterAll(async () => {
    await app.close()
  })

  async function createEmployee(): Promise<string> {
    const created = await request(app.getHttpServer())
      .post('/employees')
      .send({
        name: 'Ana Souza',
        email: 'ana.souza@example.com',
        cpf: '52998224725',
      })
      .expect(201)

    return (created.body as { id: string }).id
  }

  async function createDocumentType(name: string): Promise<string> {
    const created = await request(app.getHttpServer())
      .post('/document-types')
      .send({ name })
      .expect(201)

    return (created.body as { id: string }).id
  }

  it('links a batch of document types to an employee', async () => {
    const employeeId = await createEmployee()
    const asoId = await createDocumentType('ASO')
    const cnhId = await createDocumentType('CNH')

    const response = await request(app.getHttpServer())
      .post(`/employees/${employeeId}/requirements`)
      .send({ documentTypeIds: [asoId, cnhId] })
      .expect(201)

    const { data } = response.body as RequirementListView

    expect(data).toHaveLength(2)
    expect(
      data.map((requirement) => requirement.documentType.id).sort(),
    ).toEqual([asoId, cnhId].sort())
    expect(data[0]).toMatchObject({
      status: 'PENDING',
      currentVersion: 0,
      lastSubmittedAt: null,
      employee: { id: employeeId, name: 'Ana Souza' },
    })
  })
})
