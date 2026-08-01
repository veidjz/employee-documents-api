import { Body, Controller, Param, Post } from '@nestjs/common'
import { ParseObjectIdPipe } from '../../../shared/http/object-id.pipe'
import { LinkDocumentTypesUseCase } from '../../application/link-document-types.usecase'
import { LinkDocumentTypesBody } from './dto/link-document-types.body'
import { RequirementListView } from './dto/requirement.view'

@Controller('employees/:employeeId/requirements')
export class EmployeeRequirementsController {
  constructor(private readonly linkDocumentTypes: LinkDocumentTypesUseCase) {}

  @Post()
  async link(
    @Param('employeeId', ParseObjectIdPipe) employeeId: string,
    @Body() body: LinkDocumentTypesBody,
  ): Promise<RequirementListView> {
    return {
      data: await this.linkDocumentTypes.execute(
        employeeId,
        body.documentTypeIds,
      ),
    }
  }
}
