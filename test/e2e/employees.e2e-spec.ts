import { INestApplication } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { Model } from 'mongoose'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '@app/app.module'
import { EmployeeView } from '@employees/infra/http/dto/employee.view'
import { EmployeeModel } from '@employees/infra/mongo/employee.schema'

const anaSouza = {
  name: 'Ana Souza',
  email: 'ana.souza@example.com',
  cpf: '529.982.247-25',
}

describe('Employees (e2e)', () => {
  let app: INestApplication<App>
  let employees: Model<EmployeeModel>

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    employees = app.get<Model<EmployeeModel>>(getModelToken(EmployeeModel.name))
    await employees.syncIndexes()
  })

  beforeEach(async () => {
    await employees.deleteMany({})
  })

  afterAll(async () => {
    await app.close()
  })

  async function createAnaSouza(): Promise<EmployeeView> {
    const response = await request(app.getHttpServer())
      .post('/employees')
      .send(anaSouza)
      .expect(201)

    return response.body as EmployeeView
  }

  it('serves the created employee on the url from the location header', async () => {
    const created = await request(app.getHttpServer())
      .post('/employees')
      .send(anaSouza)
      .expect(201)

    const location = created.headers.location

    expect(location).toBe(`/employees/${(created.body as EmployeeView).id}`)

    const found = await request(app.getHttpServer()).get(location).expect(200)

    expect(found.body).toEqual(created.body)
  })

  it('lists employees in a pagination envelope', async () => {
    await request(app.getHttpServer()).post('/employees').send(anaSouza)

    const response = await request(app.getHttpServer())
      .get('/employees')
      .query({ limit: 5 })
      .expect(200)

    expect(response.body).toEqual({
      data: [expect.objectContaining({ name: 'Ana Souza' })],
      meta: { page: 1, limit: 5, total: 1, totalPages: 1 },
    })
  })

  it('rejects a limit above the hard cap', async () => {
    await request(app.getHttpServer())
      .get('/employees')
      .query({ limit: 101 })
      .expect(400)
  })

  it('allows a cpf to be reused once the employee is soft deleted', async () => {
    const { id } = await createAnaSouza()

    await request(app.getHttpServer()).delete(`/employees/${id}`).expect(204)

    await request(app.getHttpServer())
      .post('/employees')
      .send(anaSouza)
      .expect(201)

    const listed = await request(app.getHttpServer())
      .get('/employees')
      .expect(200)

    expect(listed.body).toMatchObject({ meta: { total: 1 } })
  })

  it('answers a second delete of the same employee with not found', async () => {
    const { id } = await createAnaSouza()

    await request(app.getHttpServer()).delete(`/employees/${id}`).expect(204)
    await request(app.getHttpServer()).delete(`/employees/${id}`).expect(404)
  })

  it('answers a missing employee with a not found problem', async () => {
    const response = await request(app.getHttpServer())
      .get('/employees/000000000000000000000000')
      .expect(404)

    expect(response.body).toMatchObject({ code: 'EMPLOYEE_NOT_FOUND' })
  })

  it('answers a malformed identifier with a bad request problem', async () => {
    const response = await request(app.getHttpServer())
      .get('/employees/not-an-id')
      .expect(400)

    expect(response.body).toMatchObject({ code: 'INVALID_OBJECT_ID' })
  })

  it('rejects a cpf already taken by an active employee', async () => {
    await request(app.getHttpServer())
      .post('/employees')
      .send(anaSouza)
      .expect(201)

    const response = await request(app.getHttpServer())
      .post('/employees')
      .send({
        name: 'Ana S. Souza',
        email: 'outro.email@example.com',
        cpf: '52998224725',
      })
      .expect(409)

    expect(response.headers['content-type']).toContain(
      'application/problem+json',
    )
    expect(response.body).toMatchObject({
      status: 409,
      code: 'EMPLOYEE_ALREADY_EXISTS',
      detail: 'Employee with this cpf already exists',
    })
  })

  it('rejects a cpf whose check digits do not add up', async () => {
    const response = await request(app.getHttpServer())
      .post('/employees')
      .send({ ...anaSouza, cpf: '529.982.247-24' })
      .expect(400)

    expect(response.body).toMatchObject({
      status: 400,
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'cpf', message: 'cpf must be a valid CPF number' }],
    })
  })
})
