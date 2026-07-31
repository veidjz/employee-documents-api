import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^[0-9a-f]{24}$/i.test(value)) {
      throw new BadRequestException({
        code: 'INVALID_OBJECT_ID',
        message: `${value} is not a valid identifier`,
      })
    }

    return value
  }
}
