import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsMongoId,
} from 'class-validator'

export class LinkDocumentTypesBody {
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsMongoId({ each: true })
  documentTypeIds!: string[]
}
