import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import { ParseObjectIdPipe } from '../../../shared/http/object-id.pipe'
import { PaginationQuery } from '../../../shared/http/pagination.query'
import { toPageView } from '../../../shared/http/page.view'
import { CreateDocumentTypeUseCase } from '../../application/create-document-type.usecase'
import { ListDocumentTypesUseCase } from '../../application/list-document-types.usecase'
import { SoftDeleteDocumentTypeUseCase } from '../../application/soft-delete-document-type.usecase'
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
    private readonly softDeleteDocumentType: SoftDeleteDocumentTypeUseCase,
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

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseObjectIdPipe) id: string): Promise<void> {
    return this.softDeleteDocumentType.execute(id)
  }
}
