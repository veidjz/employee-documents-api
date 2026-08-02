import { ServiceUnavailableException } from '@nestjs/common'
import { Connection } from 'mongoose'
import { HealthController } from '@shared/http/health.controller'

const unreachable = {
  getClient: () => ({
    db: () => ({
      admin: () => ({
        ping: () => Promise.reject(new Error('connection refused')),
      }),
    }),
  }),
} as unknown as Connection

describe('health controller', () => {
  it('reports the database as down when the ping fails', async () => {
    const controller = new HealthController(unreachable)

    const failure = await controller.check().catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(ServiceUnavailableException)
    expect((failure as ServiceUnavailableException).getResponse()).toEqual({
      status: 'error',
      mongo: 'down',
    })
  })
})
