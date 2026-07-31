import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Employee } from '../../domain/employee'
import {
  EmployeeRepository,
  NewEmployee,
} from '../../domain/employee.repository'
import { EmployeeDocument, EmployeeModel } from './employee.schema'

@Injectable()
export class MongoEmployeeRepository implements EmployeeRepository {
  constructor(
    @InjectModel(EmployeeModel.name)
    private readonly employees: Model<EmployeeModel>,
  ) {}

  async create(newEmployee: NewEmployee): Promise<Employee> {
    const created = await this.employees.create(newEmployee)

    return toEmployee(created)
  }
}

function toEmployee(document: EmployeeDocument): Employee {
  return {
    id: document._id.toString(),
    name: document.name,
    email: document.email,
    cpf: document.cpf,
    createdAt: document.createdAt,
  }
}
