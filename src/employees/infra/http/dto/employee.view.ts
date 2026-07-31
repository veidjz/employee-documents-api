import { Employee } from '../../../domain/employee'

export class EmployeeView implements Employee {
  id!: string
  name!: string
  email!: string
  cpf!: string
  createdAt!: Date
}
