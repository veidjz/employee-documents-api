import { Module } from '@nestjs/common'
import { APP_FILTER, APP_PIPE } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { validateEnvironment } from './config/env.validation'
import { EmployeesModule } from './employees/employees.module'
import { AllExceptionsFilter } from './shared/http/all-exceptions.filter'
import { HealthController } from './shared/http/health.controller'
import { validationPipe } from './shared/http/validation.pipe'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGO_URL'),
        serverSelectionTimeoutMS: 5000,
      }),
    }),
    EmployeesModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_PIPE, useValue: validationPipe },
  ],
})
export class AppModule {}
