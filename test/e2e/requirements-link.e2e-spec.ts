import { INestApplication } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { Model } from 'mongoose'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '@app/app.module'
import { DocumentTypeModel } from '@document-types/infra/mongo/document-type.schema'
import { EmployeeModel } from '@employees/infra/mongo/employee.schema'
import { RequirementListView } from '@requirements/infra/http/dto/requirement.view'
import { RequirementModel } from '@requirements/infra/mongo/requirement.schema'

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
      .send({ documentTypeIds: [cnhId, asoId] })
      .expect(201)

    const { data } = response.body as RequirementListView

    expect(data).toHaveLength(2)
    expect(data.map((requirement) => requirement.documentType.id)).toEqual([
      cnhId,
      asoId,
    ])
    expect(data[0]).toMatchObject({
      status: 'PENDING',
      currentVersion: 0,
      lastSubmittedAt: null,
      employee: { id: employeeId, name: 'Ana Souza' },
    })
  })

  it('aborts the whole batch when the last document type is already linked', async () => {
    const employeeId = await createEmployee()
    const asoId = await createDocumentType('ASO')
    const cnhId = await createDocumentType('CNH')

    await request(app.getHttpServer())
      .post(`/employees/${employeeId}/requirements`)
      .send({ documentTypeIds: [asoId] })
      .expect(201)

    const response = await request(app.getHttpServer())
      .post(`/employees/${employeeId}/requirements`)
      .send({ documentTypeIds: [cnhId, asoId] })
      .expect(409)

    expect(response.body).toMatchObject({
      code: 'REQUIREMENT_ALREADY_LINKED',
    })
    await expect(requirements.countDocuments()).resolves.toBe(1)
  })

  it('revives the same requirement when the pair is linked again', async () => {
    const employeeId = await createEmployee()
    const asoId = await createDocumentType('ASO')

    const linked = await request(app.getHttpServer())
      .post(`/employees/${employeeId}/requirements`)
      .send({ documentTypeIds: [asoId] })
      .expect(201)

    await request(app.getHttpServer())
      .delete(`/employees/${employeeId}/requirements/${asoId}`)
      .expect(204)

    const relinked = await request(app.getHttpServer())
      .post(`/employees/${employeeId}/requirements`)
      .send({ documentTypeIds: [asoId] })
      .expect(201)

    const { data } = relinked.body as RequirementListView

    expect(data[0].id).toBe((linked.body as RequirementListView).data[0].id)
    await expect(requirements.countDocuments()).resolves.toBe(1)
  })

  it('rejects a second unlink of the same document type', async () => {
    const employeeId = await createEmployee()
    const asoId = await createDocumentType('ASO')

    await request(app.getHttpServer())
      .post(`/employees/${employeeId}/requirements`)
      .send({ documentTypeIds: [asoId] })
      .expect(201)

    await request(app.getHttpServer())
      .delete(`/employees/${employeeId}/requirements/${asoId}`)
      .expect(204)

    const response = await request(app.getHttpServer())
      .delete(`/employees/${employeeId}/requirements/${asoId}`)
      .expect(404)

    expect(response.body).toMatchObject({ code: 'REQUIREMENT_NOT_FOUND' })
  })

  it('rejects a link to an employee that was soft deleted', async () => {
    const employeeId = await createEmployee()
    const asoId = await createDocumentType('ASO')

    await request(app.getHttpServer())
      .delete(`/employees/${employeeId}`)
      .expect(204)

    const response = await request(app.getHttpServer())
      .post(`/employees/${employeeId}/requirements`)
      .send({ documentTypeIds: [asoId] })
      .expect(404)

    expect(response.body).toMatchObject({ code: 'EMPLOYEE_NOT_FOUND' })
    await expect(requirements.countDocuments()).resolves.toBe(0)
  })

  it('rejects the whole batch when one document type was soft deleted', async () => {
    const employeeId = await createEmployee()
    const asoId = await createDocumentType('ASO')
    const cnhId = await createDocumentType('CNH')

    await request(app.getHttpServer())
      .delete(`/document-types/${cnhId}`)
      .expect(204)

    const response = await request(app.getHttpServer())
      .post(`/employees/${employeeId}/requirements`)
      .send({ documentTypeIds: [asoId, cnhId] })
      .expect(404)

    expect(response.body).toMatchObject({ code: 'DOCUMENT_TYPE_NOT_FOUND' })
    await expect(requirements.countDocuments()).resolves.toBe(0)
  })
})
