import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))

  const openApiDocument = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Employee Documents API')
      .setDescription(
        'Employee document requirements, submissions and compliance statistics',
      )
      .build(),
  )
  app.use('/docs', apiReference({ content: openApiDocument }))

  await app.listen(app.get(ConfigService).getOrThrow<number>('PORT'))
}
void bootstrap()
