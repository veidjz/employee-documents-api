import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { PaginationQuery } from '../../../shared/http/pagination.query'
import { toPageView } from '../../../shared/http/page.view'
import { CreateDocumentTypeUseCase } from '../../application/create-document-type.usecase'
import { ListDocumentTypesUseCase } from '../../application/list-document-types.usecase'
import { CreateDocumentTypeBody } from './dto/create-document-type.body'
import {
  DocumentTypePageView,
  DocumentTypeView,
} from './dto/document-type.view'

@Controller('document-types')
export class DocumentTypesController {
  constructor(
    private readonly createDocumentType: CreateDocumentTypeUseCase,
    private readonly listDocumentTypes: ListDocumentTypesUseCase,
  ) {}

  @Post()
  create(@Body() body: CreateDocumentTypeBody): Promise<DocumentTypeView> {
    return this.createDocumentType.execute(body)
  }

  @Get()
  async list(
    @Query() pagination: PaginationQuery,
  ): Promise<DocumentTypePageView> {
    return toPageView(
      await this.listDocumentTypes.execute(pagination),
      pagination,
    )
  }
}
