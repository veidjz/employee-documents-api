import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, Length, MaxLength } from 'class-validator'

export class CreateDocumentTypeBody {
  @IsString()
  @Length(2, 120)
  name!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description: string | null = null
}
