import { UnprocessableEntityException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hashPassword, verifyPassword } from '../admin/auth/admin-auth.service.js';
import { CustomerAuthService } from './customer-auth.service.js';

type Row = { id: string; passwordHash: string | null };

function build(customer: Row) {
  const prisma = {
    customer: {
      findUniqueOrThrow: vi.fn(async () => customer),
      update: vi.fn(async ({ data }: { data: { passwordHash: string } }) => ({ ...customer, ...data })),
    },
  };
  const service = new CustomerAuthService(prisma as never, {} as never, {} as never, {} as never);
  return { service, prisma };
}

const savedHash = (prisma: ReturnType<typeof build>['prisma']) => (prisma.customer.update.mock.calls[0] as unknown as [{ data: { passwordHash: string } }])[0].data.passwordHash;

describe('trocar a senha do cliente', () => {
  let current: Row;

  beforeEach(() => {
    current = { id: 'c1', passwordHash: hashPassword('senha-antiga') };
  });

  it('com a senha atual certa, grava a nova (e só ela passa a valer)', async () => {
    const { service, prisma } = build(current);
    await expect(service.changePassword('c1', { current: 'senha-antiga', next: 'senha-nova-123' })).resolves.toEqual({ ok: true });
    const stored = savedHash(prisma);
    expect(verifyPassword('senha-nova-123', stored)).toBe(true);
    expect(verifyPassword('senha-antiga', stored)).toBe(false);
  });

  it('senha atual errada dá 422 (não 401, que deslogaria o cliente) e não grava', async () => {
    const { service, prisma } = build(current);
    const attempt = service.changePassword('c1', { current: 'errada', next: 'senha-nova-123' });
    await expect(attempt).rejects.toBeInstanceOf(UnprocessableEntityException);
    await expect(attempt).rejects.toThrow('Senha atual incorreta.');
    expect(prisma.customer.update).not.toHaveBeenCalled();
  });

  it('conta com senha não troca sem informar a atual', async () => {
    const { service, prisma } = build(current);
    await expect(service.changePassword('c1', { next: 'senha-nova-123' })).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prisma.customer.update).not.toHaveBeenCalled();
  });

  it('conta que entrou só por código (sem senha) define a primeira sem informar a atual', async () => {
    const { service, prisma } = build({ id: 'c2', passwordHash: null });
    await expect(service.changePassword('c2', { next: 'primeira-senha' })).resolves.toEqual({ ok: true });
    expect(verifyPassword('primeira-senha', savedHash(prisma))).toBe(true);
  });
});
