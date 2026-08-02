export class FieldErrorView {
  field!: string
  message!: string
}

export class ProblemView {
  type!: string
  title!: string
  status!: number
  detail!: string
  instance!: string
  code!: string
  errors?: FieldErrorView[]
}
