import { INestApplication } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { Model } from 'mongoose'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '@app/app.module'
import { DocumentTypeView } from '@document-types/infra/http/dto/document-type.view'
import { DocumentTypeModel } from '@document-types/infra/mongo/document-type.schema'

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

  it('allows a name to be reused once the document type is soft deleted', async () => {
    const created = await request(app.getHttpServer())
      .post('/document-types')
      .send({ name: 'ASO', description: 'Atestado de Saude Ocupacional' })
      .expect(201)

    await request(app.getHttpServer())
      .delete(`/document-types/${(created.body as DocumentTypeView).id}`)
      .expect(204)

    await request(app.getHttpServer())
      .post('/document-types')
      .send({ name: 'ASO' })
      .expect(201)

    const listed = await request(app.getHttpServer())
      .get('/document-types')
      .expect(200)

    expect(listed.body).toMatchObject({
      data: [{ slug: 'aso', description: null }],
      meta: { total: 1 },
    })
  })

  it('rejects removing a document type that was already removed', async () => {
    const created = await request(app.getHttpServer())
      .post('/document-types')
      .send({ name: 'Comprovante de Residencia' })
      .expect(201)

    const id = (created.body as DocumentTypeView).id

    await request(app.getHttpServer())
      .delete(`/document-types/${id}`)
      .expect(204)

    const repeated = await request(app.getHttpServer())
      .delete(`/document-types/${id}`)
      .expect(404)

    expect(repeated.body).toMatchObject({
      status: 404,
      code: 'DOCUMENT_TYPE_NOT_FOUND',
      instance: `/document-types/${id}`,
    })
  })
})
