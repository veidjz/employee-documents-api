import { INestApplication } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { Model } from 'mongoose'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { DocumentTypeModel } from '../src/document-types/infra/mongo/document-type.schema'
import { EmployeeModel } from '../src/employees/infra/mongo/employee.schema'
import { RequirementPageView } from '../src/requirements/infra/http/dto/requirement.view'
import { RequirementModel } from '../src/requirements/infra/mongo/requirement.schema'

describe('Requirements listing (e2e)', () => {
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

  async function createEmployee(name: string, cpf: string): Promise<string> {
    const created = await request(app.getHttpServer())
      .post('/employees')
      .send({
        name,
        email: `${cpf}@example.com`,
        cpf,
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

  async function link(
    employeeId: string,
    documentTypeIds: string[],
  ): Promise<void> {
    await request(app.getHttpServer())
      .post(`/employees/${employeeId}/requirements`)
      .send({ documentTypeIds })
      .expect(201)
  }

  it('hydrates the employee and the document type of every requirement', async () => {
    const employeeId = await createEmployee('Ana Souza', '52998224725')
    const asoId = await createDocumentType('ASO')

    await link(employeeId, [asoId])

    const response = await request(app.getHttpServer())
      .get('/requirements')
      .expect(200)

    const { data, meta } = response.body as RequirementPageView

    expect(meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 })
    expect(data[0]).toMatchObject({
      status: 'PENDING',
      employee: { id: employeeId, name: 'Ana Souza' },
      documentType: { id: asoId, name: 'ASO', slug: 'aso' },
    })
    expect(data[0].employee).toEqual({ id: employeeId, name: 'Ana Souza' })
  })
})
