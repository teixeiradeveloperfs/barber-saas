/** Slugs que nenhuma barbearia pode ter (viram <slug>.PLATFORM_DOMAIN). */
export const RESERVED_SLUGS = new Set(['www', 'app', 'api', 'admin', 'mail', 'ftp', 'status', 'cdn']);

/**
 * Subdomínios da plataforma que são infraestrutura e nunca viram endereço de
 * barbearia. `app` fica de fora de propósito: é reservado como slug, então
 * pode ser endereço extra de uma barbearia (ex.: a padrão em app.<domínio>).
 */
export const INFRA_SUBDOMAINS = new Set(['www', 'api', 'admin', 'mail', 'ftp', 'status', 'cdn']);
