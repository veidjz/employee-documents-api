import { DocumentType } from '../../../domain/document-type'

export class DocumentTypeView implements DocumentType {
  id!: string
  name!: string
  slug!: string
  description!: string | null
  createdAt!: Date
}
