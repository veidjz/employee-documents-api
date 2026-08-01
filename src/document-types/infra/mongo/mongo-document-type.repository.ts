import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ConflictError } from '../../../shared/domain/domain-error'
import { Page, Pagination } from '../../../shared/domain/page'
import { isDuplicateKey } from '../../../shared/mongo/duplicate-key'
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
      if (isDuplicateKey(error)) {
        throw new ConflictError(
          'DOCUMENT_TYPE_ALREADY_EXISTS',
          'Document type with this name already exists',
        )
      }

      throw error
    }
  }

  async list({ page, limit }: Pagination): Promise<Page<DocumentType>> {
    const activeDocumentTypes = { deletedAt: null }
    const [documents, total] = await Promise.all([
      this.documentTypes
        .find(activeDocumentTypes)
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.documentTypes.countDocuments(activeDocumentTypes).exec(),
    ])

    return { data: documents.map(toDocumentType), total }
  }

  async findByIds(ids: string[]): Promise<DocumentType[]> {
    const documents = await this.documentTypes
      .find({ _id: { $in: ids }, deletedAt: null })
      .exec()

    return documents.map(toDocumentType)
  }

  async softDelete(id: string, deletedAt: Date): Promise<boolean> {
    const { modifiedCount } = await this.documentTypes
      .updateOne({ _id: id, deletedAt: null }, { $set: { deletedAt } })
      .exec()

    return modifiedCount === 1
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
