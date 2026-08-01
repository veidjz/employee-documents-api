import { Module } from '@nestjs/common'
import { DocumentTypesModule } from '../document-types/document-types.module'
import { EmployeesModule } from '../employees/employees.module'
import { TransactionModule } from '../shared/mongo/transaction.module'
import { LinkDocumentTypesUseCase } from './application/link-document-types.usecase'
import { ListSubmissionsUseCase } from './application/list-submissions.usecase'
import { SubmitDocumentUseCase } from './application/submit-document.usecase'
import { UnlinkDocumentTypeUseCase } from './application/unlink-document-type.usecase'
import { EmployeeRequirementsController } from './infra/http/employee-requirements.controller'
import { RequirementSubmissionsController } from './infra/http/requirement-submissions.controller'
import { RequirementPersistenceModule } from './requirement-persistence.module'

@Module({
  imports: [
    RequirementPersistenceModule,
    EmployeesModule,
    DocumentTypesModule,
    TransactionModule,
  ],
  controllers: [
    EmployeeRequirementsController,
    RequirementSubmissionsController,
  ],
  providers: [
    LinkDocumentTypesUseCase,
    UnlinkDocumentTypeUseCase,
    SubmitDocumentUseCase,
    ListSubmissionsUseCase,
  ],
})
export class RequirementsModule {}
