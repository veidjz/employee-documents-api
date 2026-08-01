import { INestApplication } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { Model } from 'mongoose'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { DocumentTypeModel } from '../src/document-types/infra/mongo/document-type.schema'
import { EmployeeModel } from '../src/employees/infra/mongo/employee.schema'
import {
  RequirementListView,
  RequirementPageView,
  RequirementView,
} from '../src/requirements/infra/http/dto/requirement.view'
import { RequirementModel } from '../src/requirements/infra/mongo/requirement.schema'
import { SubmissionModel } from '../src/requirements/infra/mongo/submission.schema'

describe('Requirements listing (e2e)', () => {
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
  ): Promise<RequirementView[]> {
    const linked = await request(app.getHttpServer())
      .post(`/employees/${employeeId}/requirements`)
      .send({ documentTypeIds })
      .expect(201)

    return (linked.body as RequirementListView).data
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

  it('combines the filters and leaves out soft deleted requirements', async () => {
    const anaId = await createEmployee('Ana Souza', '52998224725')
    const brunoId = await createEmployee('Bruno Lima', '11144477735')
    const asoId = await createDocumentType('ASO')
    const cnhId = await createDocumentType('CNH')
    const rgId = await createDocumentType('RG')

    const [anaAso] = await link(anaId, [asoId, cnhId, rgId])
    await link(brunoId, [cnhId])

    await request(app.getHttpServer())
      .post(`/requirements/${anaAso.id}/submissions`)
      .send({
        fileName: 'aso-ana.pdf',
        contentType: 'application/pdf',
        sizeBytes: 184320,
      })
      .expect(201)

    await request(app.getHttpServer())
      .delete(`/employees/${anaId}/requirements/${rgId}`)
      .expect(204)

    const pendingForAna = await request(app.getHttpServer())
      .get('/requirements')
      .query({ status: 'PENDING', employeeId: anaId })
      .expect(200)

    const { data, meta } = pendingForAna.body as RequirementPageView

    expect(meta.total).toBe(1)
    expect(data[0].documentType.slug).toBe('cnh')

    const byDocumentType = await request(app.getHttpServer())
      .get('/requirements')
      .query({ documentTypeId: cnhId })
      .expect(200)

    expect((byDocumentType.body as RequirementPageView).meta.total).toBe(2)
  })
})
