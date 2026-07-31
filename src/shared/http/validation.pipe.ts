import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { ValidationError } from 'class-validator'

export const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (validationErrors: ValidationError[]) =>
    new BadRequestException({
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      errors: validationErrors.flatMap(toFieldErrors),
    }),
})

function toFieldErrors(validationError: ValidationError) {
  return Object.values(validationError.constraints ?? {}).map((message) => ({
    field: validationError.property,
    message,
  }))
}
