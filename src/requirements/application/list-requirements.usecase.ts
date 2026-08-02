import { Inject, Injectable } from '@nestjs/common'
import {
  DOCUMENT_TYPE_REPOSITORY,
  type DocumentTypeRepository,
} from '@document-types/domain/document-type.repository'
import {
  EMPLOYEE_REPOSITORY,
  type EmployeeRepository,
} from '@employees/domain/employee.repository'
import { Page, Pagination } from '@shared/domain/page'
import { RequirementDetails } from '../domain/requirement'
import {
  REQUIREMENT_REPOSITORY,
  RequirementFilters,
  type RequirementRepository,
} from '../domain/requirement.repository'

@Injectable()
export class ListRequirementsUseCase {
  constructor(
    @Inject(REQUIREMENT_REPOSITORY)
    private readonly requirements: RequirementRepository,
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employees: EmployeeRepository,
    @Inject(DOCUMENT_TYPE_REPOSITORY)
    private readonly documentTypes: DocumentTypeRepository,
  ) {}

  async execute(
    filters: RequirementFilters,
    pagination: Pagination,
  ): Promise<Page<RequirementDetails>> {
    const page = await this.requirements.list(filters, pagination)

    const [employees, documentTypes] = await Promise.all([
      this.employees.findByIds([
        ...new Set(page.data.map((requirement) => requirement.employeeId)),
      ]),
      this.documentTypes.findByIds([
        ...new Set(page.data.map((requirement) => requirement.documentTypeId)),
      ]),
    ])

    const employeesById = new Map(
      employees.map(({ id, name }) => [id, { id, name }]),
    )
    const documentTypesById = new Map(
      documentTypes.map(({ id, name, slug }) => [id, { id, name, slug }]),
    )

    return {
      ...page,
      data: page.data.map((requirement) => ({
        id: requirement.id,
        status: requirement.status,
        currentVersion: requirement.currentVersion,
        lastSubmittedAt: requirement.lastSubmittedAt,
        employee: employeesById.get(requirement.employeeId)!,
        documentType: documentTypesById.get(requirement.documentTypeId)!,
        createdAt: requirement.createdAt,
      })),
    }
  }
}
