import { Page, Pagination } from '../domain/page'

export class PageMeta {
  page!: number
  limit!: number
  total!: number
  totalPages!: number
}

export function toPageView<T>(page: Page<T>, pagination: Pagination) {
  return {
    data: page.data,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total: page.total,
      totalPages: Math.ceil(page.total / pagination.limit),
    },
  }
}
