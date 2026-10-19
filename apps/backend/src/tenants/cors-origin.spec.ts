import { describe, expect, it, vi } from 'vitest';
import { createCorsOrigin } from './cors-origin.js';

const ask = (fn: ReturnType<typeof createCorsOrigin>, origin: string | undefined) => new Promise<boolean>((resolve) => fn(origin, (_error, allow) => resolve(allow)));

describe('createCorsOrigin', () => {
  it('fora de produção aceita tudo', async () => {
    const fn = createCorsOrigin({ production: false, allowList: [], isKnownHost: async () => false });
    expect(await ask(fn, 'http://qualquer.localhost:7693')).toBe(true);
  });
  it('em produção aceita painel e landing da lista e hosts de barbearia ativa', async () => {
    const isKnownHost = vi.fn(async (host: string) => host === 'luxe.barberosbr.com');
    const fn = createCorsOrigin({ production: true, allowList: ['https://admin.barberosbr.com/'], isKnownHost });
    expect(await ask(fn, 'https://admin.barberosbr.com')).toBe(true);
    expect(await ask(fn, 'https://luxe.barberosbr.com')).toBe(true);
    expect(await ask(fn, 'https://site-estranho.com')).toBe(false);
    expect(await ask(fn, undefined)).toBe(true);
    expect(await ask(fn, 'nao-e-url')).toBe(false);
  });
  it('guarda a resposta em cache e expira', async () => {
    let time = 0;
    const isKnownHost = vi.fn(async () => false);
    const fn = createCorsOrigin({ production: true, allowList: [], isKnownHost, now: () => time });
    await ask(fn, 'https://novo.com.br');
    await ask(fn, 'https://novo.com.br');
    expect(isKnownHost).toHaveBeenCalledTimes(1);
    time = 31_000;
    isKnownHost.mockResolvedValueOnce(true);
    expect(await ask(fn, 'https://novo.com.br')).toBe(true);
    expect(isKnownHost).toHaveBeenCalledTimes(2);
  });
});
