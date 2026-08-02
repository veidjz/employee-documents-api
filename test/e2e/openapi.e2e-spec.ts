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
    const failures = operationsOf(openApiDocument).flatMap(({ operation }) =>
      failuresOf(operation).map(([, response]) => response),
    )

    expect(failures).not.toHaveLength(0)
    for (const failure of failures) {
      expect(failure.content).toEqual({
        'application/problem+json': {
          schema: { $ref: '#/components/schemas/ProblemView' },
        },
      })
    }
  })

  it('lists the failures each endpoint can answer with', () => {
    const statuses = operationsOf(openApiDocument).map(
      ({ name, operation }) => [
        name,
        failuresOf(operation).map(([status]) => status),
      ],
    )

    expect(Object.fromEntries(statuses)).toEqual({
      'GET /health': [],
      'POST /employees': ['400', '409'],
      'GET /employees': ['400'],
      'GET /employees/{id}': ['400', '404'],
      'DELETE /employees/{id}': ['400', '404'],
      'POST /document-types': ['400', '409'],
      'GET /document-types': ['400'],
      'DELETE /document-types/{id}': ['400', '404'],
      'POST /employees/{employeeId}/requirements': ['400', '404', '409'],
      'DELETE /employees/{employeeId}/requirements/{documentTypeId}': [
        '400',
        '404',
      ],
      'POST /requirements/{requirementId}/submissions': ['400', '404'],
      'GET /requirements/{requirementId}/submissions': ['400', '404'],
      'GET /requirements': ['400'],
      'GET /stats/overview': [],
    })
  })
})

function operationsOf(document: OpenAPIObject) {
  return Object.entries(document.paths).flatMap(([path, pathItem]) =>
    Object.entries(pathItem).flatMap(
      ([method, operation]: [string, unknown]) =>
        isOperation(operation)
          ? [{ name: `${method.toUpperCase()} ${path}`, operation }]
          : [],
    ),
  )
}

function failuresOf(operation: DocumentedOperation) {
  return Object.entries(operation.responses).filter(
    ([status]) => Number(status) >= 400,
  )
}

function isOperation(value: unknown): value is DocumentedOperation {
  return typeof value === 'object' && value !== null && 'responses' in value
}
