export abstract class DomainError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export class NotFoundError extends DomainError {
  constructor(code: string, message: string) {
    super(code, 404, message)
  }
}

export class ConflictError extends DomainError {
  constructor(code: string, message: string) {
    super(code, 409, message)
  }
}
