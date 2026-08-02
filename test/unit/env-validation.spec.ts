import { validateEnvironment } from '@app/config/env.validation'

describe('environment validation', () => {
  it('rejects a mongo url that is not a connection string', () => {
    expect(() => validateEnvironment({ MONGO_URL: 'localhost:27017' })).toThrow(
      'MONGO_URL must be a mongodb connection string',
    )
  })

  it('rejects an absent mongo url', () => {
    expect(() => validateEnvironment({})).toThrow(
      'MONGO_URL must be a mongodb connection string',
    )
  })

  it('rejects a port outside the valid range', () => {
    expect(() =>
      validateEnvironment({
        MONGO_URL: 'mongodb://localhost:27017/app',
        PORT: '70000',
      }),
    ).toThrow('PORT must be an integer between 1 and 65535')
  })

  it('falls back to the default port when it is absent', () => {
    expect(
      validateEnvironment({ MONGO_URL: 'mongodb+srv://cluster/app' }),
    ).toEqual({ PORT: 3000, MONGO_URL: 'mongodb+srv://cluster/app' })
  })
})
