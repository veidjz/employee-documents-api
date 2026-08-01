import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, SchemaTypes, Types } from 'mongoose'
import {
  REQUIREMENT_STATUSES,
  type RequirementStatus,
} from '../../domain/requirement'

@Schema({ collection: 'requirements', timestamps: true, versionKey: false })
export class RequirementModel {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  employeeId!: Types.ObjectId

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  documentTypeId!: Types.ObjectId

  @Prop({ type: String, enum: REQUIREMENT_STATUSES, default: 'PENDING' })
  status!: RequirementStatus

  @Prop({ type: Number, default: 0 })
  currentVersion!: number

  @Prop({ type: Date, default: null })
  lastSubmittedAt!: Date | null

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null

  createdAt!: Date
}

export type RequirementDocument = HydratedDocument<RequirementModel>

export const RequirementSchema = SchemaFactory.createForClass(RequirementModel)

RequirementSchema.index({ employeeId: 1, documentTypeId: 1 }, { unique: true })

RequirementSchema.index({ deletedAt: 1, status: 1, _id: -1 })

RequirementSchema.index({ deletedAt: 1, employeeId: 1, status: 1, _id: -1 })
