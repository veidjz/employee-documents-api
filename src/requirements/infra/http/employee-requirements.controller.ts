import { Body, Controller, Delete, HttpCode, Param, Post } from '@nestjs/common'
import { ApiProblemResponses } from '@shared/http/api-problem.decorator'
import { ParseObjectIdPipe } from '@shared/http/object-id.pipe'
import { LinkDocumentTypesUseCase } from '../../application/link-document-types.usecase'
import { UnlinkDocumentTypeUseCase } from '../../application/unlink-document-type.usecase'
import { LinkDocumentTypesBody } from './dto/link-document-types.body'
import { RequirementListView } from './dto/requirement.view'

@Controller('employees/:employeeId/requirements')
export class EmployeeRequirementsController {
  constructor(
    private readonly linkDocumentTypes: LinkDocumentTypesUseCase,
    private readonly unlinkDocumentType: UnlinkDocumentTypeUseCase,
  ) {}

  @Post()
  @ApiProblemResponses(400, 404, 409)
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

  @Delete(':documentTypeId')
  @HttpCode(204)
  @ApiProblemResponses(400, 404)
  unlink(
    @Param('employeeId', ParseObjectIdPipe) employeeId: string,
    @Param('documentTypeId', ParseObjectIdPipe) documentTypeId: string,
  ): Promise<void> {
    return this.unlinkDocumentType.execute(employeeId, documentTypeId)
  }
}
