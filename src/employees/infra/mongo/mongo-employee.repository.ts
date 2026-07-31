import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, mongo } from 'mongoose'
import { ConflictError } from '../../../shared/domain/domain-error'
import { Page, Pagination } from '../../../shared/domain/page'
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

  async list({ page, limit }: Pagination): Promise<Page<Employee>> {
    const activeEmployees = { deletedAt: null }
    const [documents, total] = await Promise.all([
      this.employees
        .find(activeEmployees)
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.employees.countDocuments(activeEmployees).exec(),
    ])

    return { data: documents.map(toEmployee), total }
  }

  async findById(id: string): Promise<Employee | null> {
    const found = await this.employees
      .findOne({ _id: id, deletedAt: null })
      .exec()

    return found && toEmployee(found)
  }

  async softDelete(id: string): Promise<boolean> {
    const { modifiedCount } = await this.employees
      .updateOne(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
      )
      .exec()

    return modifiedCount === 1
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
