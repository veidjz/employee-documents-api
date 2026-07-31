import { isValidCpf, normalizeCpf } from '../src/employees/domain/cpf'

describe('cpf', () => {
  it('strips every character that is not a digit', () => {
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725')
  })

  it('accepts a formatted cpf with valid check digits', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true)
  })

  it('rejects a cpf with an invalid check digit', () => {
    expect(isValidCpf('52998224724')).toBe(false)
  })

  it('rejects a cpf made of a single repeated digit', () => {
    expect(isValidCpf('11111111111')).toBe(false)
  })
})
