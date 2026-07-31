import { Body, Controller, Post } from '@nestjs/common'
import { CreateDocumentTypeUseCase } from '../../application/create-document-type.usecase'
import { CreateDocumentTypeBody } from './dto/create-document-type.body'
import { DocumentTypeView } from './dto/document-type.view'

@Controller('document-types')
export class DocumentTypesController {
  constructor(private readonly createDocumentType: CreateDocumentTypeUseCase) {}

  @Post()
  create(@Body() body: CreateDocumentTypeBody): Promise<DocumentTypeView> {
    return this.createDocumentType.execute(body)
  }
}
