import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

@Schema({ collection: 'document_types', timestamps: true, versionKey: false })
export class DocumentTypeModel {
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 120 })
  name!: string

  @Prop({ required: true })
  slug!: string

  @Prop({ type: String, default: null, trim: true })
  description!: string | null

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null

  createdAt!: Date
}

export type DocumentTypeDocument = HydratedDocument<DocumentTypeModel>

export const DocumentTypeSchema =
  SchemaFactory.createForClass(DocumentTypeModel)

DocumentTypeSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
)
