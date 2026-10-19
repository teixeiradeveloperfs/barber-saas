import { promises as dns } from 'node:dns';
import { isIP } from 'node:net';
import { PLATFORM_MARKER, type DnsRecord, type DomainProvider, type ProviderCreateResult, type ProviderVerifyResult } from './domain-provider.js';

/** IPs que nunca podem ser o destino de um domínio público (evita SSRF para a rede interna). */
export function isPrivateIp(ip: string) {
  if (isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    return lower === '::1' || lower === '::' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80') || lower.startsWith('::ffff:');
  }
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
}

export type DnsProviderDeps = {
  serverIp: string | null;
  resolve4?: (hostname: string) => Promise<string[]>;
  fetchMarker?: (hostname: string) => Promise<{ ok: boolean; status: number; service: string | null }>;
};

async function defaultFetchMarker(hostname: string) {
  // TLS com SNI do próprio domínio e certificado validado: o fetch do Node faz os dois.
  const response = await fetch(`https://${hostname}/tenant-platform.json`, { signal: AbortSignal.timeout(8000), redirect: 'follow', headers: { accept: 'application/json' } });
  let service: string | null = null;
  try {
    const body = (await response.json()) as { service?: unknown };
    service = typeof body.service === 'string' ? body.service : null;
  } catch {
    service = null;
  }
  return { ok: response.ok, status: response.status, service };
}

/**
 * Produção: a API não cria nada em lugar nenhum. O cliente cria um registro A
 * para o IP do servidor na zona dele (na Cloudflare, com o proxy ligado, que
 * cuida de DNS e HTTPS na borda) e "Verificar" confere se o domínio chega ao
 * nosso frontend: resolve, recusa IP privado e pede /tenant-platform.json por
 * HTTPS.
 */
export class DnsProvider implements DomainProvider {
  readonly name = 'dns' as const;
  private readonly resolve4: (hostname: string) => Promise<string[]>;
  private readonly fetchMarker: (hostname: string) => Promise<{ ok: boolean; status: number; service: string | null }>;

  constructor(private readonly deps: DnsProviderDeps) {
    this.resolve4 = deps.resolve4 ?? ((hostname) => dns.resolve4(hostname));
    this.fetchMarker = deps.fetchMarker ?? defaultFetchMarker;
  }

  instructions(hostname: string): DnsRecord[] {
    return [
      {
        type: 'A',
        name: hostname,
        value: this.deps.serverIp ?? 'IP do servidor (defina PLATFORM_SERVER_IP)',
        note: 'Na Cloudflare, deixe o proxy ligado (nuvem laranja): DNS e HTTPS ficam na borda. Funciona no domínio raiz e no www.',
      },
    ];
  }

  async create(hostname: string): Promise<ProviderCreateResult> {
    return { externalId: null, records: this.instructions(hostname), status: 'PENDENTE_DNS' };
  }

  async verify(domain: { hostname: string }): Promise<ProviderVerifyResult> {
    let addresses: string[];
    try {
      addresses = await this.resolve4(domain.hostname);
    } catch (error) {
      return { status: 'PENDENTE_DNS', detail: `DNS ainda não responde para ${domain.hostname} (${(error as Error).message}).` };
    }
    if (addresses.length === 0) return { status: 'PENDENTE_DNS', detail: `Nenhum registro A encontrado para ${domain.hostname}.` };
    const privates = addresses.filter(isPrivateIp);
    if (privates.length > 0) return { status: 'ERRO', detail: `O domínio aponta para IP privado (${privates.join(', ')}). Use o IP público do servidor.` };

    try {
      const marker = await this.fetchMarker(domain.hostname);
      if (marker.ok && marker.service === PLATFORM_MARKER) return { status: 'ATIVO', detail: `${domain.hostname} chega ao app por HTTPS.` };
      return {
        status: 'PENDENTE_DNS',
        detail: marker.ok
          ? `${domain.hostname} responde, mas ainda não é o nosso app. A borda leva até 1 minuto para receber um domínio novo; confira também o registro A.`
          : `${domain.hostname} respondeu ${marker.status} em /tenant-platform.json. A borda leva até 1 minuto para receber um domínio novo; confira também o registro A e o proxy.`,
      };
    } catch (error) {
      return { status: 'PENDENTE_DNS', detail: `Não foi possível abrir https://${domain.hostname} (${(error as Error).message}). O certificado pode ainda estar sendo emitido.` };
    }
  }

  async remove() {
    // Nada foi criado fora do nosso banco.
  }
}
