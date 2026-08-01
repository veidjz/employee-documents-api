import { mongo } from 'mongoose'

export function isDuplicateKey(
  error: unknown,
): error is mongo.MongoServerError & { keyPattern: Record<string, number> } {
  return error instanceof mongo.MongoServerError && error.code === 11000
}
