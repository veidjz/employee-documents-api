import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { PaginationQuery } from '../../../shared/http/pagination.query'
import { toPageView } from '../../../shared/http/page.view'
import { CreateEmployeeUseCase } from '../../application/create-employee.usecase'
import { ListEmployeesUseCase } from '../../application/list-employees.usecase'
import { CreateEmployeeBody } from './dto/create-employee.body'
import { EmployeePageView, EmployeeView } from './dto/employee.view'

@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly createEmployee: CreateEmployeeUseCase,
    private readonly listEmployees: ListEmployeesUseCase,
  ) {}

  @Post()
  create(@Body() body: CreateEmployeeBody): Promise<EmployeeView> {
    return this.createEmployee.execute(body)
  }

  @Get()
  async list(@Query() pagination: PaginationQuery): Promise<EmployeePageView> {
    return toPageView(await this.listEmployees.execute(pagination), pagination)
  }
}
