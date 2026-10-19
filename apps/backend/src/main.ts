import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import { createCorsOrigin } from './tenants/cors-origin.js';
import { registerInstallationHook } from './tenants/tenant.hook.js';
import { InstallationService } from './tenants/tenants.service.js';
import { PreviewService } from './admin/preview/preview.service.js';
import { MEDIA_MAX_BYTES, MEDIA_PREFIX, resolveMediaRoot } from './media/media-storage.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
  );
  const config = app.get(ConfigService);

  const port = config.get<number>('PORT', 3000);
  const corsOrigins = config
    .get<string>('CORS_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const fastify = app.getHttpAdapter().getInstance();
  await fastify.register(helmet, {
    // O manifest e o config público são lidos por outros domínios (os dos tenants).
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
  const tenants = app.get(InstallationService);
  await fastify.register(cors, {
    // Em produção: painel e landing vêm de CORS_ORIGINS; o app do cliente roda em
    // qualquer domínio de barbearia, então a origem vale se o host resolver para
    // uma barbearia ativa (sem lista de domínios em env). Fora de produção, tudo passa.
    // Autenticação é por Bearer, sem cookies.
    origin: createCorsOrigin({
      production: config.get<string>('NODE_ENV') === 'production',
      allowList: corsOrigins,
      isKnownHost: (hostname) => tenants.isKnownHost(hostname),
    }),
    credentials: false,
    maxAge: 600,
    // O painel usa PATCH/PUT/DELETE; o padrão do plugin libera só GET/HEAD/POST.
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization', 'accept'],
  });
  // Banco de imagens: upload multipart (um arquivo por request) e os arquivos
  // servidos em /media/. O nome é o hash do conteúdo, então o cache pode ser eterno.
  await fastify.register(multipart, { limits: { fileSize: MEDIA_MAX_BYTES, files: 1, fields: 5 } });
  await fastify.register(fastifyStatic, {
    root: resolveMediaRoot(config),
    prefix: MEDIA_PREFIX,
    decorateReply: false,
    index: false,
    list: false,
    cacheControl: true,
    maxAge: '365d',
    immutable: true,
  });
  // Resolve o tenant pelo Host antes de qualquer rota do app do cliente.
  registerInstallationHook(fastify, tenants, app.get(PreviewService));

  await app.listen(port, '0.0.0.0');
  console.log(
    `[${config.get<string>('APP_NAME', 'API')}] ${config.get<string>('NODE_ENV', 'development')} — http://localhost:${port}`,
  );
}
await bootstrap();
