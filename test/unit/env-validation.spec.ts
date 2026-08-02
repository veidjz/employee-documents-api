import { validateEnvironment } from '@app/config/env.validation'

describe('environment validation', () => {
  it('rejects a mongo url that is not a connection string', () => {
    expect(() => validateEnvironment({ MONGO_URL: 'localhost:27017' })).toThrow(
      'MONGO_URL must be a mongodb connection string',
    )
  })
})
