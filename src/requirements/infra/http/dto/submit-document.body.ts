import {
  IsInt,
  IsMimeType,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator'

export class SubmitDocumentBody {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string

  @IsMimeType()
  contentType!: string

  @IsInt()
  @IsPositive()
  sizeBytes!: number
}
