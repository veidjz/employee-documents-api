import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { CreateEmployeeUseCase } from './application/create-employee.usecase'
import { GetEmployeeUseCase } from './application/get-employee.usecase'
import { ListEmployeesUseCase } from './application/list-employees.usecase'
import { SoftDeleteEmployeeUseCase } from './application/soft-delete-employee.usecase'
import { RequirementPersistenceModule } from '../requirements/requirement-persistence.module'
import { TransactionModule } from '../shared/mongo/transaction.module'
import { EMPLOYEE_REPOSITORY } from './domain/employee.repository'
import { EmployeesController } from './infra/http/employees.controller'
import { EmployeeModel, EmployeeSchema } from './infra/mongo/employee.schema'
import { MongoEmployeeRepository } from './infra/mongo/mongo-employee.repository'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmployeeModel.name, schema: EmployeeSchema },
    ]),
    RequirementPersistenceModule,
    TransactionModule,
  ],
  controllers: [EmployeesController],
  providers: [
    CreateEmployeeUseCase,
    ListEmployeesUseCase,
    GetEmployeeUseCase,
    SoftDeleteEmployeeUseCase,
    { provide: EMPLOYEE_REPOSITORY, useClass: MongoEmployeeRepository },
  ],
  exports: [MongooseModule, EMPLOYEE_REPOSITORY],
})
export class EmployeesModule {}
