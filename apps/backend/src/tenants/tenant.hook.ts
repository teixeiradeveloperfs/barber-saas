import type { FastifyInstance, FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';
import { NotFoundException } from '@nestjs/common';
import { installationStorage } from './tenant-context.js';
import type { InstallationService } from './tenants.service.js';
import type { PreviewService } from '../admin/preview/preview.service.js';

/** Prefixos de rota pública da instalação única. */
const PUBLIC_PREFIXES = ['/public'];

/**
 * Hook onRequest: carrega a configuração única e roda o pipeline dentro do
 * AsyncLocalStorage para compatibilidade com os controladores públicos.
 *
 * Estilo callback de propósito: chamar `done()` dentro de `storage.run()`
 * faz hooks seguintes e o handler executarem nesse contexto. Hook `async`
 * com `enterWith` não propaga, porque o runner do Fastify invoca cada etapa
 * a partir do próprio contexto dele.
 */
export function registerInstallationHook(fastify: FastifyInstance, tenants: InstallationService, preview: PreviewService) {
  fastify.addHook('onRequest', (req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
    const path = req.url.split('?')[0];
    if (!PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      done();
      return;
    }

    const query = req.query as Record<string, string | undefined>;

    // Preview can only expose a draft of the one configured shop.
    preview
      .slugFor(query.preview)
      .then((previewSlug) => tenants.resolve(req.hostname, null, { draft: Boolean(previewSlug) }))
      .then((tenant) => installationStorage.run(tenant, done))
      .catch((error: unknown) => {
        if (error instanceof NotFoundException) {
          reply.code(404).send({ statusCode: 404, error: 'Not Found', message: error.message });
          return;
        }
        done(error as Error);
      });
  });
}
