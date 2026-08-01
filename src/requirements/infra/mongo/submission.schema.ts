import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, SchemaTypes, Types } from 'mongoose'

@Schema({ collection: 'submissions', timestamps: false, versionKey: false })
export class SubmissionModel {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  requirementId!: Types.ObjectId

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  employeeId!: Types.ObjectId

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  documentTypeId!: Types.ObjectId

  @Prop({ type: Number, required: true })
  version!: number

  @Prop({ type: Boolean, default: true })
  isActive!: boolean

  @Prop({ required: true, trim: true, maxlength: 255 })
  fileName!: string

  @Prop({ required: true, trim: true, maxlength: 255 })
  contentType!: string

  @Prop({ type: Number, required: true })
  sizeBytes!: number

  @Prop({ type: Date, required: true })
  submittedAt!: Date

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null
}

export type SubmissionDocument = HydratedDocument<SubmissionModel>

export const SubmissionSchema = SchemaFactory.createForClass(SubmissionModel)

SubmissionSchema.index({ requirementId: 1, version: 1 }, { unique: true })

SubmissionSchema.index(
  { requirementId: 1 },
  { unique: true, partialFilterExpression: { isActive: true } },
)
