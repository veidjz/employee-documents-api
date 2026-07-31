export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

export function isValidCpf(cpf: string): boolean {
  const digits = normalizeCpf(cpf)

  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false
  }

  return (
    checkDigit(digits, 9) === Number(digits[9]) &&
    checkDigit(digits, 10) === Number(digits[10])
  )
}

function checkDigit(digits: string, upToPosition: number): number {
  const weightedSum = [...digits.slice(0, upToPosition)].reduce(
    (total, digit, position) =>
      total + Number(digit) * (upToPosition + 1 - position),
    0,
  )
  const remainder = weightedSum % 11

  return remainder < 2 ? 0 : 11 - remainder
}
