import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from '@app/app.module'

type DocumentedOperation = {
  responses: Record<string, { content?: unknown }>
}

describe('OpenAPI (e2e)', () => {
  let app: INestApplication
  let openApiDocument: OpenAPIObject

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
    openApiDocument = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    )
  })

  afterAll(async () => {
    await app.close()
  })

  it('describes every documented failure as a problem details payload', () => {
    const failures = failureResponses(openApiDocument)

    expect(failures).not.toHaveLength(0)
    for (const failure of failures) {
      expect(failure.content).toEqual({
        'application/problem+json': {
          schema: { $ref: '#/components/schemas/ProblemView' },
        },
      })
    }
  })
})

function failureResponses(document: OpenAPIObject) {
  return Object.values(document.paths)
    .flatMap((pathItem) => Object.values(pathItem).filter(isOperation))
    .flatMap((operation) => Object.entries(operation.responses))
    .filter(([status]) => Number(status) >= 400)
    .map(([, response]) => response)
}

function isOperation(value: unknown): value is DocumentedOperation {
  return typeof value === 'object' && value !== null && 'responses' in value
}
