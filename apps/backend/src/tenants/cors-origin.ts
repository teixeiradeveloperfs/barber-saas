type OriginCallback = (error: Error | null, allow: boolean) => void;

export type CorsOriginOptions = {
  /** Fora de produção qualquer origem passa (apps em portas e subdomínios locais). */
  production: boolean;
  /** Origens fixas: painel e landing (CORS_ORIGINS, separadas por vírgula). */
  allowList: string[];
  /** Host de barbearia ativa ou da própria plataforma. */
  isKnownHost: (hostname: string) => Promise<boolean>;
  now?: () => number;
};

const ALLOW_TTL = 5 * 60_000;
const DENY_TTL = 30_000;

/**
 * Origem do CORS em produção: aceita o painel e a landing (lista fixa) e
 * qualquer origem cujo host resolva para uma barbearia ativa. Não há lista de
 * domínios de app em env: domínio novo passa a valer quando fica ativo no banco.
 * O resultado fica em memória (5 min para sim, 30 s para não).
 */
export function createCorsOrigin(options: CorsOriginOptions) {
  const cache = new Map<string, { allow: boolean; until: number }>();
  const allowList = new Set(options.allowList.map((origin) => origin.replace(/\/$/, '').toLowerCase()));
  const now = options.now ?? Date.now;

  return (origin: string | undefined, callback: OriginCallback) => {
    // Sem Origin: chamada de servidor, curl ou navegação direta. CORS não se aplica.
    if (!origin || !options.production) return callback(null, true);
    const normalized = origin.replace(/\/$/, '').toLowerCase();
    if (allowList.has(normalized)) return callback(null, true);

    let hostname: string;
    try {
      hostname = new URL(normalized).hostname;
    } catch {
      return callback(null, false);
    }
    const cached = cache.get(hostname);
    if (cached && cached.until > now()) return callback(null, cached.allow);

    options
      .isKnownHost(hostname)
      .then((allow) => {
        cache.set(hostname, { allow, until: now() + (allow ? ALLOW_TTL : DENY_TTL) });
        callback(null, allow);
      })
      .catch(() => callback(null, false));
  };
}
