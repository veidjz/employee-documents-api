import { Inject, Injectable } from '@nestjs/common'
import {
  DOCUMENT_TYPE_REPOSITORY,
  type DocumentTypeRepository,
} from '../../document-types/domain/document-type.repository'
import {
  EMPLOYEE_REPOSITORY,
  type EmployeeRepository,
} from '../../employees/domain/employee.repository'
import {
  SUBMISSION_REPOSITORY,
  type SubmissionRepository,
} from '../../requirements/domain/submission.repository'
import { Overview } from '../domain/overview'
import { rate } from '../domain/rate'
import {
  STATS_REPOSITORY,
  type StatsRepository,
} from '../domain/stats.repository'

const LATEST_SUBMISSIONS_LIMIT = 10

@Injectable()
export class GetOverviewUseCase {
  constructor(
    @Inject(STATS_REPOSITORY) private readonly stats: StatsRepository,
    @Inject(SUBMISSION_REPOSITORY)
    private readonly submissions: SubmissionRepository,
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employees: EmployeeRepository,
    @Inject(DOCUMENT_TYPE_REPOSITORY)
    private readonly documentTypes: DocumentTypeRepository,
  ) {}

  async execute(): Promise<Overview> {
    const [{ totals, compliance, topPending }, latestSubmissions] =
      await Promise.all([
        this.stats.aggregateRequirements(),
        this.submissions.listLatest(LATEST_SUBMISSIONS_LIMIT),
      ])

    const [employees, documentTypes] = await Promise.all([
      this.employees.findByIds([
        ...new Set(latestSubmissions.map(({ employeeId }) => employeeId)),
      ]),
      this.documentTypes.findByIds([
        ...new Set([
          ...topPending.map(({ documentTypeId }) => documentTypeId),
          ...latestSubmissions.map(({ documentTypeId }) => documentTypeId),
        ]),
      ]),
    ])

    const employeesById = new Map(
      employees.map(({ id, name }) => [id, { id, name }]),
    )
    const documentTypesById = new Map(
      documentTypes.map(({ id, name, slug }) => [id, { id, name, slug }]),
    )

    return {
      generatedAt: new Date(),
      requirements: {
        ...totals,
        completionRate: rate(totals.submitted, totals.total),
      },
      employees: {
        ...compliance,
        complianceRate: rate(
          compliance.fullyCompliant,
          compliance.withRequirements,
        ),
      },
      topPendingDocumentTypes: topPending.map(
        ({ documentTypeId, pendingCount }) => ({
          ...documentTypesById.get(documentTypeId)!,
          pendingCount,
        }),
      ),
      latestSubmissions: latestSubmissions.map((submission) => {
        const { id, name } = documentTypesById.get(submission.documentTypeId)!

        return {
          id: submission.id,
          requirementId: submission.requirementId,
          version: submission.version,
          submittedAt: submission.submittedAt,
          employee: employeesById.get(submission.employeeId)!,
          documentType: { id, name },
        }
      }),
    }
  }
}
