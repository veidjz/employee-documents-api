import { INestApplication } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { Model } from 'mongoose'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { DocumentTypeModel } from '../src/document-types/infra/mongo/document-type.schema'
import { EmployeeModel } from '../src/employees/infra/mongo/employee.schema'
import { RequirementModel } from '../src/requirements/infra/mongo/requirement.schema'

describe('Soft delete consistency (e2e)', () => {
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

  async function linkTwoDocumentTypes(): Promise<string> {
    const employee = await request(app.getHttpServer())
      .post('/employees')
      .send({
        name: 'Ana Souza',
        email: 'ana.souza@example.com',
        cpf: '52998224725',
      })
      .expect(201)

    const documentTypeIds: string[] = []

    for (const name of ['ASO', 'CNH']) {
      const documentType = await request(app.getHttpServer())
        .post('/document-types')
        .send({ name })
        .expect(201)

      documentTypeIds.push((documentType.body as { id: string }).id)
    }

    const employeeId = (employee.body as { id: string }).id

    await request(app.getHttpServer())
      .post(`/employees/${employeeId}/requirements`)
      .send({ documentTypeIds })
      .expect(201)

    return employeeId
  }

  it('removes the requirements of an employee at the same instant', async () => {
    const employeeId = await linkTwoDocumentTypes()

    await request(app.getHttpServer())
      .delete(`/employees/${employeeId}`)
      .expect(204)

    const removedEmployee = await employees.findById(employeeId).orFail().exec()
    const removedRequirements = await requirements.find().exec()

    expect(removedRequirements).toHaveLength(2)
    for (const requirement of removedRequirements) {
      expect(requirement.deletedAt).toEqual(removedEmployee.deletedAt)
    }
  })
})
