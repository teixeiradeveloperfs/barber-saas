import { describe, expect, it } from 'vitest';
import { DnsProvider, isPrivateIp } from './dns.provider.js';

describe('isPrivateIp', () => {
  it('recusa redes privadas, loopback e link-local', () => {
    for (const ip of ['10.0.0.5', '127.0.0.1', '172.16.4.1', '172.31.255.255', '192.168.1.10', '169.254.10.1', '0.0.0.0', '100.64.0.1', '::1', 'fd00::1', '::ffff:10.0.0.1']) expect(isPrivateIp(ip)).toBe(true);
  });
  it('aceita IP público', () => {
    for (const ip of ['104.21.5.9', '172.32.0.1', '8.8.8.8', '2606:4700::1111']) expect(isPrivateIp(ip)).toBe(false);
  });
});

describe('DnsProvider', () => {
  const make = (resolve4: () => Promise<string[]>, marker: { ok: boolean; status: number; service: string | null } | Error) =>
    new DnsProvider({ serverIp: '203.0.113.10', resolve4, fetchMarker: async () => { if (marker instanceof Error) throw marker; return marker; } });

  it('instrui um registro A para o IP do servidor', () => {
    const [record] = make(async () => [], { ok: true, status: 200, service: null }).instructions('www.exemplo.com.br');
    expect(record).toMatchObject({ type: 'A', name: 'www.exemplo.com.br', value: '203.0.113.10' });
  });
  it('ativa quando o domínio chega ao app', async () => {
    const result = await make(async () => ['104.21.5.9'], { ok: true, status: 200, service: 'barberos-app' }).verify({ hostname: 'www.exemplo.com.br' });
    expect(result.status).toBe('ATIVO');
  });
  it('fica pendente quando o DNS não responde', async () => {
    const result = await make(async () => { throw new Error('ENOTFOUND'); }, { ok: true, status: 200, service: 'barberos-app' }).verify({ hostname: 'x.exemplo.com.br' });
    expect(result.status).toBe('PENDENTE_DNS');
  });
  it('erra quando aponta para IP privado', async () => {
    const result = await make(async () => ['192.168.0.10'], { ok: true, status: 200, service: 'barberos-app' }).verify({ hostname: 'x.exemplo.com.br' });
    expect(result.status).toBe('ERRO');
  });
  it('fica pendente quando responde outro site ou o TLS falha', async () => {
    expect((await make(async () => ['104.21.5.9'], { ok: true, status: 200, service: 'outro' }).verify({ hostname: 'x.exemplo.com.br' })).status).toBe('PENDENTE_DNS');
    expect((await make(async () => ['104.21.5.9'], new Error('certificate has expired')).verify({ hostname: 'x.exemplo.com.br' })).status).toBe('PENDENTE_DNS');
  });
});
