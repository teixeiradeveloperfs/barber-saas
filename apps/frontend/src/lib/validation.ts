const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isEmail(value: string) {
  return EMAIL.test(value.trim())
}

export const MIN_PASSWORD = 6

/** WhatsApp brasileiro com DDD (10 ou 11 dígitos) ou internacional com DDI. */
export function isPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || digits.length === 11 || (digits.length >= 12 && digits.length <= 15)
}

/** (11) 98765-4321 enquanto digita. */
export function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 13)
  if (digits.length > 11) return `+${digits}`
  const ddd = digits.slice(0, 2)
  const rest = digits.slice(2)
  if (digits.length <= 2) return digits
  if (rest.length <= 4) return `(${ddd}) ${rest}`
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
}

/** 0 a 4. Regras simples, só para orientar; a validação real fica no backend. */
export function passwordScore(password: string) {
  if (!password) return 0
  let score = 0
  if (password.length >= MIN_PASSWORD) score++
  if (/\d/.test(password)) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score++
  return score
}

export const messages = {
  nameRequired: 'Informe seu nome.',
  emailRequired: 'Informe seu e-mail.',
  emailInvalid: 'E-mail inválido. Confira e tente de novo.',
  phoneRequired: 'Informe seu WhatsApp.',
  phoneInvalid: 'WhatsApp inválido. Use o DDD, ex.: (11) 98765-4321.',
  codeInvalid: 'Digite os 6 números do código.',
  passwordRequired: 'Informe sua senha.',
  passwordShort: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`,
  passwordMismatch: 'As senhas não coincidem.',
  termsRequired: 'Aceite os termos para continuar.',
} as const
