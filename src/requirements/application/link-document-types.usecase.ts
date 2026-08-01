import { Inject, Injectable } from '@nestjs/common'
import {
  DOCUMENT_TYPE_REPOSITORY,
  type DocumentTypeRepository,
} from '../../document-types/domain/document-type.repository'
import {
  EMPLOYEE_REPOSITORY,
  type EmployeeRepository,
} from '../../employees/domain/employee.repository'
import { NotFoundError } from '../../shared/domain/domain-error'
import {
  TRANSACTION_RUNNER,
  type TransactionRunner,
} from '../../shared/domain/transaction-runner'
import { RequirementDetails } from '../domain/requirement'
import {
  REQUIREMENT_REPOSITORY,
  type RequirementRepository,
} from '../domain/requirement.repository'

@Injectable()
export class LinkDocumentTypesUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employees: EmployeeRepository,
    @Inject(DOCUMENT_TYPE_REPOSITORY)
    private readonly documentTypes: DocumentTypeRepository,
    @Inject(REQUIREMENT_REPOSITORY)
    private readonly requirements: RequirementRepository,
    @Inject(TRANSACTION_RUNNER)
    private readonly transaction: TransactionRunner,
  ) {}

  execute(
    employeeId: string,
    documentTypeIds: string[],
  ): Promise<RequirementDetails[]> {
    return this.transaction.run(async () => {
      const employee = await this.employees.findById(employeeId)

      if (!employee) {
        throw new NotFoundError('EMPLOYEE_NOT_FOUND', 'Employee not found')
      }

      const documentTypes = await this.documentTypes.findByIds(documentTypeIds)

      if (documentTypes.length !== documentTypeIds.length) {
        throw new NotFoundError(
          'DOCUMENT_TYPE_NOT_FOUND',
          'One of the document types was not found',
        )
      }

      const linked: RequirementDetails[] = []

      for (const documentType of documentTypes) {
        const requirement = await this.requirements.link(
          employeeId,
          documentType.id,
        )

        linked.push({
          id: requirement.id,
          status: requirement.status,
          currentVersion: requirement.currentVersion,
          lastSubmittedAt: requirement.lastSubmittedAt,
          employee: { id: employee.id, name: employee.name },
          documentType: {
            id: documentType.id,
            name: documentType.name,
            slug: documentType.slug,
          },
          createdAt: requirement.createdAt,
        })
      }

      return linked
    })
  }
}
