import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { CreateDocumentTypeUseCase } from './application/create-document-type.usecase'
import { DOCUMENT_TYPE_REPOSITORY } from './domain/document-type.repository'
import { DocumentTypesController } from './infra/http/document-types.controller'
import {
  DocumentTypeModel,
  DocumentTypeSchema,
} from './infra/mongo/document-type.schema'
import { MongoDocumentTypeRepository } from './infra/mongo/mongo-document-type.repository'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentTypeModel.name, schema: DocumentTypeSchema },
    ]),
  ],
  controllers: [DocumentTypesController],
  providers: [
    CreateDocumentTypeUseCase,
    {
      provide: DOCUMENT_TYPE_REPOSITORY,
      useClass: MongoDocumentTypeRepository,
    },
  ],
  exports: [MongooseModule, DOCUMENT_TYPE_REPOSITORY],
})
export class DocumentTypesModule {}
