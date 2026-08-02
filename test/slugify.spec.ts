import { slugify } from '@document-types/domain/slugify'

describe('slugify', () => {
  it('collapses accents, casing and repeated separators into one slug', () => {
    expect(slugify('Certidão Negativa')).toBe('certidao-negativa')
    expect(slugify('  certidao   negativa ')).toBe('certidao-negativa')
  })

  it('drops punctuation instead of turning it into a separator run', () => {
    expect(slugify('Atestado de Saúde Ocupacional (ASO)')).toBe(
      'atestado-de-saude-ocupacional-aso',
    )
  })
})
