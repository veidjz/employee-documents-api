import { INestApplication } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { Model } from 'mongoose'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { EmployeeModel } from '../src/employees/infra/mongo/employee.schema'

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
})
