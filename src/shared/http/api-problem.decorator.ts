import { applyDecorators } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'
import { ProblemView } from './problem.view'

type ProblemStatus = 400 | 404 | 409

const problemDescriptions: Record<ProblemStatus, string> = {
  400: 'Validation failed, and the errors field names the offending inputs',
  404: 'A resource referenced by the request does not exist',
  409: 'The request conflicts with an existing resource, and the code field names the conflict',
}

export function ApiProblemResponses(...statuses: ProblemStatus[]) {
  return applyDecorators(
    ApiExtraModels(ProblemView),
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: problemDescriptions[status],
        content: {
          'application/problem+json': {
            schema: { $ref: getSchemaPath(ProblemView) },
          },
        },
      }),
    ),
  )
}
