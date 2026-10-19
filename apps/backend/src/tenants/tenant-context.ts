import { AsyncLocalStorage } from 'node:async_hooks';
import type { AppConfig } from '@barber/tenant-config';

export type ResolvedInstallation = {
  id: string;
  slug: string;
  name: string;
  hostname: string;
  config: AppConfig;
  /** true quando é um rascunho aberto por token de preview. */
  draft: boolean;
};

/** Tenant da requisição atual, disponível em qualquer serviço sem passar parâmetro. */
export const installationStorage = new AsyncLocalStorage<ResolvedInstallation>();

export function currentInstallation(): ResolvedInstallation | undefined {
  return installationStorage.getStore();
}
