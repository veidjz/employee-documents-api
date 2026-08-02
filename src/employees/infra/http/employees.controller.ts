import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import type { Response } from 'express'
import { ParseObjectIdPipe } from '@shared/http/object-id.pipe'
import { PaginationQuery } from '@shared/http/pagination.query'
import { toPageView } from '@shared/http/page.view'
import { CreateEmployeeUseCase } from '../../application/create-employee.usecase'
import { GetEmployeeUseCase } from '../../application/get-employee.usecase'
import { ListEmployeesUseCase } from '../../application/list-employees.usecase'
import { SoftDeleteEmployeeUseCase } from '../../application/soft-delete-employee.usecase'
import { CreateEmployeeBody } from './dto/create-employee.body'
import { EmployeePageView, EmployeeView } from './dto/employee.view'

@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly createEmployee: CreateEmployeeUseCase,
    private readonly listEmployees: ListEmployeesUseCase,
    private readonly getEmployee: GetEmployeeUseCase,
    private readonly softDeleteEmployee: SoftDeleteEmployeeUseCase,
  ) {}

  @Post()
  async create(
    @Body() body: CreateEmployeeBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<EmployeeView> {
    const employee = await this.createEmployee.execute(body)
    response.setHeader('Location', `/employees/${employee.id}`)

    return employee
  }

  @Get()
  async list(@Query() pagination: PaginationQuery): Promise<EmployeePageView> {
    return toPageView(await this.listEmployees.execute(pagination), pagination)
  }

  @Get(':id')
  get(@Param('id', ParseObjectIdPipe) id: string): Promise<EmployeeView> {
    return this.getEmployee.execute(id)
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseObjectIdPipe) id: string): Promise<void> {
    return this.softDeleteEmployee.execute(id)
  }
}
