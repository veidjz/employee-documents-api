import { Page, Pagination } from '../../shared/domain/page'
import { DocumentType } from './document-type'

export const DOCUMENT_TYPE_REPOSITORY = Symbol('DOCUMENT_TYPE_REPOSITORY')

export type NewDocumentType = Omit<DocumentType, 'id' | 'createdAt'>

export interface DocumentTypeRepository {
  create(newDocumentType: NewDocumentType): Promise<DocumentType>
  list(pagination: Pagination): Promise<Page<DocumentType>>
}
