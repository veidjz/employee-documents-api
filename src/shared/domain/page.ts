export type Pagination = {
  page: number
  limit: number
}

export type Page<T> = {
  data: T[]
  total: number
}
