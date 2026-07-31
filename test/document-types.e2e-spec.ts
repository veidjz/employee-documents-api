import { INestApplication } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { Model } from 'mongoose'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { DocumentTypeModel } from '../src/document-types/infra/mongo/document-type.schema'

describe('Document types (e2e)', () => {
  let app: INestApplication<App>
  let documentTypes: Model<DocumentTypeModel>

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    documentTypes = app.get<Model<DocumentTypeModel>>(
      getModelToken(DocumentTypeModel.name),
    )
    await documentTypes.syncIndexes()
  })

  beforeEach(async () => {
    await documentTypes.deleteMany({})
  })

  afterAll(async () => {
    await app.close()
  })

  it('rejects a name that collapses to the slug of an existing type', async () => {
    const created = await request(app.getHttpServer())
      .post('/document-types')
      .send({ name: 'Certidão Negativa' })
      .expect(201)

    expect(created.body).toMatchObject({
      slug: 'certidao-negativa',
      description: null,
    })

    const response = await request(app.getHttpServer())
      .post('/document-types')
      .send({ name: 'certidao  negativa' })
      .expect(409)

    expect(response.headers['content-type']).toContain(
      'application/problem+json',
    )
    expect(response.body).toMatchObject({
      status: 409,
      code: 'DOCUMENT_TYPE_ALREADY_EXISTS',
    })
  })
})
