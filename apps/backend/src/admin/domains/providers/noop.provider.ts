import { DnsProvider } from './dns.provider.js';
import type { DnsRecord, DomainProvider, ProviderCreateResult, ProviderVerifyResult } from './domain-provider.js';

/** Desenvolvimento: mostra as mesmas instruções do `dns`, mas não confere nada. Use "Ativar (dev)". */
export class NoopProvider implements DomainProvider {
  readonly name = 'noop' as const;
  private readonly dns: DnsProvider;

  constructor(serverIp: string | null) {
    this.dns = new DnsProvider({ serverIp });
  }

  instructions(hostname: string): DnsRecord[] {
    return this.dns.instructions(hostname);
  }

  create(hostname: string): Promise<ProviderCreateResult> {
    return this.dns.create(hostname);
  }

  async verify(): Promise<ProviderVerifyResult> {
    return { status: 'PENDENTE_DNS', detail: 'Em desenvolvimento nada é conferido. Use "Ativar (dev)".' };
  }

  async remove() {
    // nada a desfazer
  }
}
