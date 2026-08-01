import { randomUUID } from 'node:crypto'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_PIPE } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { LoggerModule } from 'nestjs-pino'
import { validateEnvironment } from './config/env.validation'
import { DocumentTypesModule } from './document-types/document-types.module'
import { EmployeesModule } from './employees/employees.module'
import { RequirementsModule } from './requirements/requirements.module'
import { AllExceptionsFilter } from './shared/http/all-exceptions.filter'
import { HealthController } from './shared/http/health.controller'
import { validationPipe } from './shared/http/validation.pipe'
import { StatsModule } from './stats/stats.module'

mongoose.set('transactionAsyncLocalStorage', true)

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
        genReqId: (request, response) => {
          const incomingRequestId = request.headers['x-request-id']
          const requestId =
            typeof incomingRequestId === 'string'
              ? incomingRequestId
              : randomUUID()
          response.setHeader('x-request-id', requestId)
          return requestId
        },
        serializers: {
          req: ({ id, method, url }: IncomingMessage & { id: string }) => ({
            id,
            method,
            url,
          }),
          res: ({ statusCode }: ServerResponse) => ({ statusCode }),
        },
      },
    }),
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGO_URL'),
        serverSelectionTimeoutMS: 5000,
        autoIndex: false,
      }),
    }),
    EmployeesModule,
    DocumentTypesModule,
    RequirementsModule,
    StatsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_PIPE, useValue: validationPipe },
  ],
})
export class AppModule {}
