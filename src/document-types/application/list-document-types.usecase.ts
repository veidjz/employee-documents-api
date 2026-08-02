import { Inject, Injectable } from '@nestjs/common'
import { Page, Pagination } from '@shared/domain/page'
import { DocumentType } from '../domain/document-type'
import {
  DOCUMENT_TYPE_REPOSITORY,
  type DocumentTypeRepository,
} from '../domain/document-type.repository'

@Injectable()
export class ListDocumentTypesUseCase {
  constructor(
    @Inject(DOCUMENT_TYPE_REPOSITORY)
    private readonly documentTypes: DocumentTypeRepository,
  ) {}

  execute(pagination: Pagination): Promise<Page<DocumentType>> {
    return this.documentTypes.list(pagination)
  }
}
