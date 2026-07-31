import { PageMeta } from '../../../../shared/http/page.view'
import { Employee } from '../../../domain/employee'

export class EmployeeView implements Employee {
  id!: string
  name!: string
  email!: string
  cpf!: string
  createdAt!: Date
}

export class EmployeePageView {
  data!: EmployeeView[]
  meta!: PageMeta
}
