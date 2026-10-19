import { Controller, Get, Header, NotFoundException, Param, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { currentInstallation } from '../tenants/tenant-context.js';
import { APP_ICONS, AppIconService, type AppIconFile } from './app-icon.service.js';

/** Endpoints sem autenticação lidos pelo app do cliente. */
@Controller('public')
export class PublicController {
  constructor(private readonly icons: AppIconService) {}

  /** Config publicado do tenant do Host (ou ?tenant= em dev). */
  @Get('tenant')
  // Sem cache no navegador: publicar tem que valer no próximo reload.
  @Header('Cache-Control', 'no-cache')
  tenant(@Res({ passthrough: true }) reply: FastifyReply) {
    const tenant = requireTenant();
    // Rascunho em preview nunca vai para cache.
    if (tenant.draft) reply.header('Cache-Control', 'no-store');
    return { id: tenant.id, slug: tenant.slug, hostname: tenant.hostname, draft: tenant.draft, config: tenant.config };
  }

  /** Manifest do PWA com nome, cor e ícones do tenant. */
  @Get('manifest.webmanifest')
  @Header('Cache-Control', 'public, max-age=300')
  @Header('Content-Type', 'application/manifest+json; charset=utf-8')
  manifest() {
    const { config } = requireTenant();
    const theme = config.brand.theme.dark.accent;
    // Com marca em imagem, os ícones saem dela (rota abaixo, servida na origem do
    // app pelo nginx). O ?v= muda com a imagem, então trocar o favicon fura o cache.
    const version = this.icons.versionOf(config);
    const icon = (file: AppIconFile) => (version ? `/app-icon/${file}?v=${version}` : APP_ICONS[file].fallback);
    // String, não objeto: o Fastify só respeita o Content-Type customizado assim.
    return JSON.stringify({
      name: config.name,
      short_name: config.name.length <= 12 ? config.name : config.name.split(' ')[0],
      description: config.copy.splashHeadline,
      lang: 'pt-BR',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#0b0b0c',
      theme_color: theme,
      icons: [
        { src: icon('icon-192.png'), sizes: '192x192', type: 'image/png' },
        { src: icon('icon-512.png'), sizes: '512x512', type: 'image/png' },
        { src: icon('maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      shortcuts: [
        { name: 'Agendar', url: '/barbeiros' },
        ...(config.loyalty.enabled ? [{ name: 'Recompensas', url: '/recompensas' }] : []),
        { name: 'Como chegar', url: '/como-chegar' },
      ],
    });
  }

  /**
   * Ícone do app instalado gerado da marca da barbearia. O app chama por
   * /app-icon/<arquivo> na própria origem; o nginx repassa para cá com o host.
   * Sem marca em imagem (ou imagem fora do ar), redireciona para o ícone padrão.
   */
  @Get('app-icon/:file')
  async appIcon(@Param('file') file: string, @Res() reply: FastifyReply) {
    const { config } = requireTenant();
    if (!Object.hasOwn(APP_ICONS, file)) throw new NotFoundException('Ícone desconhecido.');
    const name = file as AppIconFile;
    const png = await this.icons.render(config, name);
    if (!png) {
      return reply.header('Cache-Control', 'public, max-age=300').redirect(APP_ICONS[name].fallback, 302);
    }
    return reply
      .header('Content-Type', 'image/png')
      .header('Cache-Control', 'public, max-age=86400')
      .send(png);
  }
}

function requireTenant() {
  const tenant = currentInstallation();
  if (!tenant) throw new NotFoundException('Tenant não resolvido para esta requisição.');
  return tenant;
}
