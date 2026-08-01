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
import {
  SubmissionPageView,
  SubmissionView,
} from '../src/requirements/infra/http/dto/submission.view'
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

  it('paginates the history from the newest version', async () => {
    const requirementId = await linkRequirement()

    for (const fileName of ['first.pdf', 'second.pdf', 'third.pdf']) {
      await submit(requirementId, fileName)
    }

    const response = await request(app.getHttpServer())
      .get(`/requirements/${requirementId}/submissions`)
      .query({ limit: 2 })
      .expect(200)

    const { data, meta } = response.body as SubmissionPageView

    expect(data.map((submission) => submission.version)).toEqual([3, 2])
    expect(data[0].fileName).toBe('third.pdf')
    expect(meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 })
  })

  it('rejects both endpoints when the requirement was unlinked', async () => {
    const requirementId = await linkRequirement()

    await submit(requirementId, 'aso-ana.pdf')

    const { employeeId, documentTypeId } = await requirements
      .findById(requirementId)
      .orFail()
      .exec()

    await request(app.getHttpServer())
      .delete(
        `/employees/${employeeId.toString()}/requirements/${documentTypeId.toString()}`,
      )
      .expect(204)

    const submitted = await request(app.getHttpServer())
      .post(`/requirements/${requirementId}/submissions`)
      .send({
        fileName: 'aso-ana.pdf',
        contentType: 'application/pdf',
        sizeBytes: 184320,
      })
      .expect(404)

    const listed = await request(app.getHttpServer())
      .get(`/requirements/${requirementId}/submissions`)
      .expect(404)

    expect(submitted.body).toMatchObject({ code: 'REQUIREMENT_NOT_FOUND' })
    expect(listed.body).toMatchObject({ code: 'REQUIREMENT_NOT_FOUND' })
  })

  it('preserves the version and the history when the pair is linked again', async () => {
    const requirementId = await linkRequirement()

    await submit(requirementId, 'first.pdf')
    await submit(requirementId, 'second.pdf')

    const { employeeId, documentTypeId } = await requirements
      .findById(requirementId)
      .orFail()
      .exec()

    await request(app.getHttpServer())
      .delete(
        `/employees/${employeeId.toString()}/requirements/${documentTypeId.toString()}`,
      )
      .expect(204)

    const relinked = await request(app.getHttpServer())
      .post(`/employees/${employeeId.toString()}/requirements`)
      .send({ documentTypeIds: [documentTypeId.toString()] })
      .expect(201)

    expect((relinked.body as RequirementListView).data[0]).toMatchObject({
      id: requirementId,
      status: 'SUBMITTED',
      currentVersion: 2,
    })

    const history = await request(app.getHttpServer())
      .get(`/requirements/${requirementId}/submissions`)
      .expect(200)

    const { data } = history.body as SubmissionPageView

    expect(data.map((submission) => submission.version)).toEqual([2, 1])
    expect(data[0].isActive).toBe(true)

    const resubmitted = await submit(requirementId, 'third.pdf')

    expect(resubmitted.body).toMatchObject<Partial<SubmissionView>>({
      version: 3,
    })
  })
})
