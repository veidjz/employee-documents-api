import { Inject, Injectable } from '@nestjs/common'
import { DocumentType } from '../domain/document-type'
import {
  DOCUMENT_TYPE_REPOSITORY,
  type DocumentTypeRepository,
  type NewDocumentType,
} from '../domain/document-type.repository'
import { slugify } from '../domain/slugify'

@Injectable()
export class CreateDocumentTypeUseCase {
  constructor(
    @Inject(DOCUMENT_TYPE_REPOSITORY)
    private readonly documentTypes: DocumentTypeRepository,
  ) {}

  execute(
    newDocumentType: Omit<NewDocumentType, 'slug'>,
  ): Promise<DocumentType> {
    return this.documentTypes.create({
      ...newDocumentType,
      slug: slugify(newDocumentType.name),
    })
  }
}
