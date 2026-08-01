import { Module } from '@nestjs/common'
import { DocumentTypesModule } from '../document-types/document-types.module'
import { EmployeesModule } from '../employees/employees.module'
import { TransactionModule } from '../shared/mongo/transaction.module'
import { LinkDocumentTypesUseCase } from './application/link-document-types.usecase'
import { EmployeeRequirementsController } from './infra/http/employee-requirements.controller'
import { RequirementPersistenceModule } from './requirement-persistence.module'

@Module({
  imports: [
    RequirementPersistenceModule,
    EmployeesModule,
    DocumentTypesModule,
    TransactionModule,
  ],
  controllers: [EmployeeRequirementsController],
  providers: [LinkDocumentTypesUseCase],
})
export class RequirementsModule {}
