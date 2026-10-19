export type DnsRecord = { type: 'A' | 'CNAME' | 'TXT'; name: string; value: string; note?: string };
export type DomainStatus = 'PENDENTE_DNS' | 'VERIFICANDO' | 'ATIVO' | 'ERRO';
export type ProviderName = 'dns' | 'noop' | 'cloudflare';

export type ProviderCreateResult = { externalId: string | null; records: DnsRecord[]; status: DomainStatus };
export type ProviderVerifyResult = { status: DomainStatus; detail: string };

/**
 * Como um domínio próprio entra no ar. Escolhido por DOMAIN_PROVIDER:
 * `dns` (produção: o cliente aponta um A com proxy da Cloudflare e nós só
 * conferimos), `noop` (dev: nada é conferido) e `cloudflare` (Custom
 * Hostnames via API, exige token e zona).
 */
export interface DomainProvider {
  readonly name: ProviderName;
  instructions(hostname: string): DnsRecord[];
  create(hostname: string): Promise<ProviderCreateResult>;
  verify(domain: { hostname: string; externalId: string | null }): Promise<ProviderVerifyResult>;
  remove(domain: { hostname: string; externalId: string | null }): Promise<void>;
}

/** Conteúdo de /tenant-platform.json servido pelo app do cliente: prova que o domínio chega ao nosso frontend. */
export const PLATFORM_MARKER = 'barberos-app';
