import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  async check() {
    try {
      await this.connection.getClient().db().admin().ping()
    } catch {
      throw new ServiceUnavailableException({ status: 'error', mongo: 'down' })
    }

    return { status: 'ok', mongo: 'up' }
  }
}
