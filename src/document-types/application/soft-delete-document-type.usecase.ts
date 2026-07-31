import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../shared/domain/domain-error'
import {
  DOCUMENT_TYPE_REPOSITORY,
  type DocumentTypeRepository,
} from '../domain/document-type.repository'

@Injectable()
export class SoftDeleteDocumentTypeUseCase {
  constructor(
    @Inject(DOCUMENT_TYPE_REPOSITORY)
    private readonly documentTypes: DocumentTypeRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const removed = await this.documentTypes.softDelete(id)

    if (!removed) {
      throw new NotFoundError(
        'DOCUMENT_TYPE_NOT_FOUND',
        'Document type not found',
      )
    }
  }
}
