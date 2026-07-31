import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, mongo } from 'mongoose'
import { ConflictError } from '../../../shared/domain/domain-error'
import { DocumentType } from '../../domain/document-type'
import {
  DocumentTypeRepository,
  NewDocumentType,
} from '../../domain/document-type.repository'
import { DocumentTypeDocument, DocumentTypeModel } from './document-type.schema'

@Injectable()
export class MongoDocumentTypeRepository implements DocumentTypeRepository {
  constructor(
    @InjectModel(DocumentTypeModel.name)
    private readonly documentTypes: Model<DocumentTypeModel>,
  ) {}

  async create(newDocumentType: NewDocumentType): Promise<DocumentType> {
    try {
      return toDocumentType(await this.documentTypes.create(newDocumentType))
    } catch (error) {
      if (error instanceof mongo.MongoServerError && error.code === 11000) {
        throw new ConflictError(
          'DOCUMENT_TYPE_ALREADY_EXISTS',
          'Document type with this name already exists',
        )
      }

      throw error
    }
  }
}

function toDocumentType(document: DocumentTypeDocument): DocumentType {
  return {
    id: document._id.toString(),
    name: document.name,
    slug: document.slug,
    description: document.description,
    createdAt: document.createdAt,
  }
}
