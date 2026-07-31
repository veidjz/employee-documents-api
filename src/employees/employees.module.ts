import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { EMPLOYEE_REPOSITORY } from './domain/employee.repository'
import { EmployeeModel, EmployeeSchema } from './infra/mongo/employee.schema'
import { MongoEmployeeRepository } from './infra/mongo/mongo-employee.repository'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmployeeModel.name, schema: EmployeeSchema },
    ]),
  ],
  providers: [
    { provide: EMPLOYEE_REPOSITORY, useClass: MongoEmployeeRepository },
  ],
  exports: [MongooseModule, EMPLOYEE_REPOSITORY],
})
export class EmployeesModule {}
