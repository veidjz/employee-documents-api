import { Controller, Get, Redirect } from '@nestjs/common'

@Controller()
export class RootController {
  @Get()
  @Redirect('/docs')
  redirectToDocs() {}
}
