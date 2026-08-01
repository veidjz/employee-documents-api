import { NestFactory } from '@nestjs/core'
import { getConnectionToken } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import { AppModule } from '../src/app.module'

async function syncIndexes() {
  const application = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  })
  const connection = application.get<Connection>(getConnectionToken())

  console.log(await connection.syncIndexes())

  await application.close()
}
void syncIndexes()
