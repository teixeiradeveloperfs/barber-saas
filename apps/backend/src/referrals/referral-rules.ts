/** Regras puras da indicação de clientes (testadas em referral-rules.spec.ts). */

export type RewardLike = { kind: string; value: number; serviceId?: string | null };
export type ServiceLine = { id: string; price: number; covered: boolean };

/**
 * Quanto a recompensa abate de um agendamento. `total` já é o que o cliente
 * paga (sem o que o Clube cobre). Serviço grátis exige o serviço na reserva e
 * que ele não esteja coberto pelo Clube.
 */
export function rewardDiscount(reward: RewardLike, lines: ServiceLine[], total: number): { discount: number; error: string | null } {
  if (total <= 0) return { discount: 0, error: 'Este agendamento já não tem nada a pagar.' };
  if (reward.kind === 'desconto_percentual') return { discount: round2(Math.min(total, (total * Math.min(100, reward.value)) / 100)), error: null };
  if (reward.kind === 'desconto_valor') return { discount: round2(Math.min(total, reward.value)), error: null };
  if (reward.kind === 'servico_gratis') {
    const line = lines.find((item) => item.id === reward.serviceId && !item.covered);
    if (!line) return { discount: 0, error: 'Adicione o serviço da recompensa ao agendamento para usar.' };
    return { discount: round2(Math.min(total, line.price)), error: null };
  }
  return { discount: 0, error: 'Recompensa inválida.' };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/** Código curto e legível: 4 letras do nome + 4 caracteres (sem 0/O e 1/I). */
export function referralCode(name: string, random: () => number = Math.random) {
  const base = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const tail = Array.from({ length: 4 }, () => alphabet[Math.floor(random() * alphabet.length)]).join('');
  return `${base}${tail}`;
}
