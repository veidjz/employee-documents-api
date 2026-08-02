import { INestApplication } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { Model } from 'mongoose'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '@app/app.module'
import { DocumentTypeModel } from '@document-types/infra/mongo/document-type.schema'
import { EmployeeModel } from '@employees/infra/mongo/employee.schema'
import { RequirementModel } from '@requirements/infra/mongo/requirement.schema'
import { SubmissionModel } from '@requirements/infra/mongo/submission.schema'

describe('Soft delete consistency (e2e)', () => {
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

  async function linkTwoDocumentTypes(): Promise<{
    employeeId: string
    documentTypeIds: string[]
  }> {
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

    return { employeeId, documentTypeIds }
  }

  it('removes the requirements of an employee at the same instant', async () => {
    const { employeeId } = await linkTwoDocumentTypes()

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

  it('removes only the requirements of the removed document type', async () => {
    const { documentTypeIds } = await linkTwoDocumentTypes()
    const [asoId, cnhId] = documentTypeIds

    await request(app.getHttpServer())
      .delete(`/document-types/${cnhId}`)
      .expect(204)

    const removedDocumentType = await documentTypes
      .findById(cnhId)
      .orFail()
      .exec()
    const activeRequirements = await requirements
      .find({ deletedAt: null })
      .exec()
    const removedRequirement = await requirements
      .findOne({ documentTypeId: cnhId })
      .orFail()
      .exec()

    expect(activeRequirements).toHaveLength(1)
    expect(activeRequirements[0].documentTypeId.toString()).toBe(asoId)
    expect(removedRequirement.deletedAt).toEqual(removedDocumentType.deletedAt)
  })

  it('removes the submissions of an employee at the same instant', async () => {
    const { employeeId } = await linkTwoDocumentTypes()
    const linkedRequirements = await requirements.find().exec()

    for (const requirement of linkedRequirements) {
      await request(app.getHttpServer())
        .post(`/requirements/${requirement._id.toString()}/submissions`)
        .send({
          fileName: 'aso-ana.pdf',
          contentType: 'application/pdf',
          sizeBytes: 184320,
        })
        .expect(201)
    }

    await request(app.getHttpServer())
      .delete(`/employees/${employeeId}`)
      .expect(204)

    const removedEmployee = await employees.findById(employeeId).orFail().exec()
    const removedSubmissions = await submissions.find().exec()

    expect(removedSubmissions).toHaveLength(2)
    for (const submission of removedSubmissions) {
      expect(submission.deletedAt).toEqual(removedEmployee.deletedAt)
    }
  })

  it('removes only the submissions of the removed document type', async () => {
    const { documentTypeIds } = await linkTwoDocumentTypes()
    const [asoId, cnhId] = documentTypeIds
    const linkedRequirements = await requirements.find().exec()

    for (const requirement of linkedRequirements) {
      await request(app.getHttpServer())
        .post(`/requirements/${requirement._id.toString()}/submissions`)
        .send({
          fileName: 'documento.pdf',
          contentType: 'application/pdf',
          sizeBytes: 184320,
        })
        .expect(201)
    }

    await request(app.getHttpServer())
      .delete(`/document-types/${cnhId}`)
      .expect(204)

    const activeSubmissions = await submissions.find({ deletedAt: null }).exec()

    expect(activeSubmissions).toHaveLength(1)
    expect(activeSubmissions[0].documentTypeId.toString()).toBe(asoId)
  })
})
