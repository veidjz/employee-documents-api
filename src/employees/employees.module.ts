import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { CreateEmployeeUseCase } from './application/create-employee.usecase'
import { ListEmployeesUseCase } from './application/list-employees.usecase'
import { EMPLOYEE_REPOSITORY } from './domain/employee.repository'
import { EmployeesController } from './infra/http/employees.controller'
import { EmployeeModel, EmployeeSchema } from './infra/mongo/employee.schema'
import { MongoEmployeeRepository } from './infra/mongo/mongo-employee.repository'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmployeeModel.name, schema: EmployeeSchema },
    ]),
  ],
  controllers: [EmployeesController],
  providers: [
    CreateEmployeeUseCase,
    ListEmployeesUseCase,
    { provide: EMPLOYEE_REPOSITORY, useClass: MongoEmployeeRepository },
  ],
  exports: [MongooseModule, EMPLOYEE_REPOSITORY],
})
export class EmployeesModule {}
