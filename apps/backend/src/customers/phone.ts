/** Normaliza para dígitos com DDI. Número brasileiro sem 55 (10 ou 11 dígitos) ganha o 55. */
export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function isValidPhone(digits: string) {
  return /^\d{12,15}$/.test(digits);
}

/** +55 11 98765-4321 → exibição amigável. */
export function maskPhone(digits: string) {
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    const local = digits.slice(2);
    const ddd = local.slice(0, 2);
    const rest = local.slice(2);
    return `(${ddd}) ${rest.length === 9 ? `${rest.slice(0, 5)}-${rest.slice(5)}` : `${rest.slice(0, 4)}-${rest.slice(4)}`}`;
  }
  return `+${digits}`;
}
