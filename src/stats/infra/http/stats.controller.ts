import { Controller, Get } from '@nestjs/common'
import { GetOverviewUseCase } from '../../application/get-overview.usecase'
import { OverviewView } from './dto/overview.view'

@Controller('stats')
export class StatsController {
  constructor(private readonly getOverview: GetOverviewUseCase) {}

  @Get('overview')
  overview(): Promise<OverviewView> {
    return this.getOverview.execute()
  }
}
