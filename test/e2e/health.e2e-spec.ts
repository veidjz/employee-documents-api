import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '@app/app.module'

describe('Health (e2e)', () => {
  let app: INestApplication<App>

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('reports the database as up when it answers the ping', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200)

    expect(response.body).toEqual({ status: 'ok', mongo: 'up' })
  })
})
