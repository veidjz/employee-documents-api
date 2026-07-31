import { Body, Controller, Post } from '@nestjs/common'
import { CreateEmployeeUseCase } from '../../application/create-employee.usecase'
import { CreateEmployeeBody } from './dto/create-employee.body'
import { EmployeeView } from './dto/employee.view'

@Controller('employees')
export class EmployeesController {
  constructor(private readonly createEmployee: CreateEmployeeUseCase) {}

  @Post()
  create(@Body() body: CreateEmployeeBody): Promise<EmployeeView> {
    return this.createEmployee.execute(body)
  }
}
