import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, mongo } from 'mongoose'
import { ConflictError } from '../../../shared/domain/domain-error'
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
    try {
      return toEmployee(await this.employees.create(newEmployee))
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new ConflictError(
          'EMPLOYEE_ALREADY_EXISTS',
          `Employee with this ${Object.keys(error.keyPattern)[0]} already exists`,
        )
      }

      throw error
    }
  }
}

function isDuplicateKey(
  error: unknown,
): error is mongo.MongoServerError & { keyPattern: Record<string, number> } {
  return error instanceof mongo.MongoServerError && error.code === 11000
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
