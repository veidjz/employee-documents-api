import { STATUS_CODES } from 'node:http'
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { DomainError } from '../domain/domain-error'
import { FieldErrorView, ProblemView } from './problem.view'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp()
    const { status, detail, code, errors } = this.describe(exception)

    context
      .getResponse<Response>()
      .status(status)
      .type('application/problem+json')
      .json({
        type: 'about:blank',
        title: reasonPhrase(status),
        status,
        detail,
        instance: context.getRequest<Request>().url,
        code,
        ...(errors && { errors }),
      } satisfies ProblemView)
  }

  private describe(exception: unknown): ProblemPayload & {
    status: number
    detail: string
  } {
    if (exception instanceof DomainError) {
      return {
        status: exception.status,
        detail: exception.message,
        code: exception.code,
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const payload = exception.getResponse()
      return {
        status,
        detail: exception.message,
        ...(isProblemPayload(payload)
          ? { code: payload.code, errors: payload.errors }
          : { code: statusCode(status) }),
      }
    }

    this.logger.error(exception)
    return {
      status: 500,
      detail: 'Unexpected error',
      code: statusCode(500),
    }
  }
}

type ProblemPayload = {
  code: string
  errors?: FieldErrorView[]
}

function isProblemPayload(payload: string | object): payload is ProblemPayload {
  return typeof payload === 'object' && 'code' in payload
}

function reasonPhrase(status: number): string {
  return STATUS_CODES[status] ?? 'Error'
}

function statusCode(status: number): string {
  return reasonPhrase(status).toUpperCase().replace(/\s/g, '_')
}
