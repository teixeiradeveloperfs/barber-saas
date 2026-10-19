import { describe, expect, it } from 'vitest';
import { referralCode, rewardDiscount } from './referral-rules.js';

const lines = [
  { id: 'corte', price: 50, covered: false },
  { id: 'barba', price: 30, covered: true },
];

describe('recompensa de indicação no agendamento', () => {
  it('desconto percentual sobre o que paga', () => {
    expect(rewardDiscount({ kind: 'desconto_percentual', value: 20 }, lines, 50)).toEqual({ discount: 10, error: null });
  });
  it('desconto em reais não passa do total', () => {
    expect(rewardDiscount({ kind: 'desconto_valor', value: 80 }, lines, 50).discount).toBe(50);
  });
  it('serviço grátis exige o serviço e fora do Clube', () => {
    expect(rewardDiscount({ kind: 'servico_gratis', value: 0, serviceId: 'corte' }, lines, 50).discount).toBe(50);
    expect(rewardDiscount({ kind: 'servico_gratis', value: 0, serviceId: 'barba' }, lines, 50).error).toMatch(/Adicione/);
    expect(rewardDiscount({ kind: 'servico_gratis', value: 0, serviceId: 'luzes' }, lines, 50).error).toMatch(/Adicione/);
  });
  it('nada a pagar não usa recompensa', () => {
    expect(rewardDiscount({ kind: 'desconto_valor', value: 10 }, lines, 0).error).toMatch(/nada a pagar/);
  });
  it('código legível a partir do nome', () => {
    expect(referralCode('Rafael Costa', () => 0)).toBe('RAFAAAAA');
    expect(referralCode('Zé', () => 0.99)).toMatch(/^ZEXX[A-Z2-9]{4}$/);
  });
});
