import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'

describe('Problem details (e2e)', () => {
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

  it('answers an unknown route with problem json', async () => {
    const response = await request(app.getHttpServer())
      .get('/unknown-route')
      .expect(404)

    expect(response.headers['content-type']).toContain(
      'application/problem+json',
    )
    expect(response.body).toEqual({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Cannot GET /unknown-route',
      instance: '/unknown-route',
      code: 'NOT_FOUND',
    })
  })
})
