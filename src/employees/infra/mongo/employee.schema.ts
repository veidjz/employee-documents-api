import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

@Schema({ collection: 'employees', timestamps: true, versionKey: false })
export class EmployeeModel {
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 120 })
  name!: string

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string

  @Prop({ required: true })
  cpf!: string

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null

  createdAt!: Date
}

export type EmployeeDocument = HydratedDocument<EmployeeModel>

export const EmployeeSchema = SchemaFactory.createForClass(EmployeeModel)

EmployeeSchema.index(
  { cpf: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
)

EmployeeSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
)

EmployeeSchema.index({ deletedAt: 1, _id: -1 })
