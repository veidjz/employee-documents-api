import { IsEmail, IsString, Length, registerDecorator } from 'class-validator'
import { isValidCpf } from '../../../domain/cpf'

function IsCpf() {
  return (target: object, propertyName: string) =>
    registerDecorator({
      name: 'isCpf',
      target: target.constructor,
      propertyName,
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && isValidCpf(value),
        defaultMessage: () => 'cpf must be a valid CPF number',
      },
    })
}

export class CreateEmployeeBody {
  @IsString()
  @Length(2, 120)
  name!: string

  @IsEmail()
  email!: string

  @IsCpf()
  cpf!: string
}
