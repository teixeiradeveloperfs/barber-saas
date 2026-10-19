/** Só dígitos. */
export function digits(value: string) {
  return value.replace(/\D/g, '');
}

/** Número brasileiro sem DDI ganha 55. */
export function withCountry(phone: string) {
  const clean = digits(phone);
  return clean.length === 10 || clean.length === 11 ? `55${clean}` : clean;
}

/**
 * Chave para comparar telefones brasileiros com e sem o nono dígito: DDI + DDD
 * + últimos 8 dígitos. O WhatsApp de celulares antigos ainda usa o formato sem
 * o 9, e o cliente digita com.
 */
export function phoneKey(phone: string) {
  const clean = withCountry(phone);
  if (clean.startsWith('55') && (clean.length === 12 || clean.length === 13)) return `55${clean.slice(2, 4)}${clean.slice(-8)}`;
  return clean;
}

/** "5511987654321@c.us" -> "5511987654321". */
export function phoneFromChatId(chatId: string) {
  return chatId.endsWith('@c.us') || chatId.endsWith('@s.whatsapp.net') ? digits(chatId.split('@')[0]) : null;
}
