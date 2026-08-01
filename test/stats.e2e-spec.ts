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
import { SubmissionModel } from '../src/requirements/infra/mongo/submission.schema'
import { OverviewView } from '../src/stats/infra/http/dto/overview.view'

describe('Stats overview (e2e)', () => {
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
      .send({ name, email: `${cpf}@example.com`, cpf })
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
  ): Promise<RequirementListView['data']> {
    const linked = await request(app.getHttpServer())
      .post(`/employees/${employeeId}/requirements`)
      .send({ documentTypeIds })
      .expect(201)

    return (linked.body as RequirementListView).data
  }

  async function submit(requirementId: string): Promise<void> {
    await request(app.getHttpServer())
      .post(`/requirements/${requirementId}/submissions`)
      .send({
        fileName: 'aso.pdf',
        contentType: 'application/pdf',
        sizeBytes: 184320,
      })
      .expect(201)
  }

  async function overview(): Promise<OverviewView> {
    const response = await request(app.getHttpServer())
      .get('/stats/overview')
      .expect(200)

    return response.body as OverviewView
  }

  it('reports the requirement totals and the completion rate', async () => {
    const anaId = await createEmployee('Ana Souza', '52998224725')
    const asoId = await createDocumentType('ASO')
    const cnhId = await createDocumentType('CNH')
    const rgId = await createDocumentType('RG')

    const [anaAso] = await link(anaId, [asoId, cnhId, rgId])
    await submit(anaAso.id)

    const { requirements: totals } = await overview()

    expect(totals).toEqual({
      total: 3,
      submitted: 1,
      pending: 2,
      completionRate: 0.3333,
    })
  })

  it('counts as compliant only the employees whose requirements are all submitted', async () => {
    const anaId = await createEmployee('Ana Souza', '52998224725')
    const brunoId = await createEmployee('Bruno Lima', '11144477735')
    const carlaId = await createEmployee('Carla Dias', '12345678909')
    await createEmployee('Diego Reis', '98765432100')
    const asoId = await createDocumentType('ASO')
    const cnhId = await createDocumentType('CNH')

    const [anaAso] = await link(anaId, [asoId, cnhId])
    const [brunoAso] = await link(brunoId, [asoId])
    await link(carlaId, [cnhId])

    await submit(anaAso.id)
    await submit(brunoAso.id)

    const { employees } = await overview()

    expect(employees).toEqual({
      withRequirements: 3,
      fullyCompliant: 1,
      complianceRate: 0.3333,
    })
  })

  it('ranks the top pending document types and hydrates their names', async () => {
    const anaId = await createEmployee('Ana Souza', '52998224725')
    const brunoId = await createEmployee('Bruno Lima', '11144477735')
    const carlaId = await createEmployee('Carla Dias', '12345678909')
    const asoId = await createDocumentType('ASO')
    const cnhId = await createDocumentType('CNH')
    const rgId = await createDocumentType('RG')

    const [, , anaRg] = await link(anaId, [asoId, cnhId, rgId])
    await link(brunoId, [asoId, cnhId])
    await link(carlaId, [asoId])

    await submit(anaRg.id)

    const { topPendingDocumentTypes } = await overview()

    expect(topPendingDocumentTypes).toEqual([
      { id: asoId, name: 'ASO', slug: 'aso', pendingCount: 3 },
      { id: cnhId, name: 'CNH', slug: 'cnh', pendingCount: 2 },
    ])
  })

  it('lists the newest submissions first with hydrated names', async () => {
    const anaId = await createEmployee('Ana Souza', '52998224725')
    const brunoId = await createEmployee('Bruno Lima', '11144477735')
    const asoId = await createDocumentType('ASO')

    const [anaAso] = await link(anaId, [asoId])
    const [brunoAso] = await link(brunoId, [asoId])

    await submit(anaAso.id)
    await submit(brunoAso.id)
    await submit(anaAso.id)

    const { latestSubmissions } = await overview()
    const [newest] = latestSubmissions

    expect(newest).toEqual({
      id: newest.id,
      submittedAt: newest.submittedAt,
      requirementId: anaAso.id,
      version: 2,
      employee: { id: anaId, name: 'Ana Souza' },
      documentType: { id: asoId, name: 'ASO' },
    })
    expect(
      latestSubmissions.map(({ requirementId, version }) => [
        requirementId,
        version,
      ]),
    ).toEqual([
      [anaAso.id, 2],
      [brunoAso.id, 1],
      [anaAso.id, 1],
    ])
  })

  it('reports a null completion rate when there is no requirement', async () => {
    const { requirements: totals, employees } = await overview()

    expect(totals).toEqual({
      total: 0,
      submitted: 0,
      pending: 0,
      completionRate: null,
    })
    expect(employees).toEqual({
      withRequirements: 0,
      fullyCompliant: 0,
      complianceRate: null,
    })
  })
})
