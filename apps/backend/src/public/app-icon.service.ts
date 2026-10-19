import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '@barber/tenant-config';
import sharp, { type Sharp } from 'sharp';
import { isPrivateIp } from '../admin/domains/providers/dns.provider.js';
import { MediaStorage } from '../media/media-storage.js';

/**
 * Ícones do app instalado (PWA) gerados a partir da marca de cada barbearia.
 * O manifest e o apple-touch-icon apontam para cá (via nginx do app, na mesma
 * origem), então o celular mostra o favicon configurado no painel, não o ícone
 * padrão do build.
 */
export const APP_ICONS = {
  'icon-192.png': { size: 192, maskable: false, fallback: '/icons/icon-192.png' },
  'icon-512.png': { size: 512, maskable: false, fallback: '/icons/icon-512.png' },
  'maskable-512.png': { size: 512, maskable: true, fallback: '/icons/icon-512-maskable.png' },
  'apple-touch-icon.png': { size: 180, maskable: false, fallback: '/icons/apple-touch-icon.png' },
} as const;

export type AppIconFile = keyof typeof APP_ICONS;

/** Fundo dos ícones quando a imagem não traz o próprio (mesmo do tema escuro). */
const DEFAULT_BG = { r: 11, g: 11, b: 12, alpha: 1 };
/** Mude para regenerar todos os ícones (entra no ?v= do manifest). */
const RENDER_VERSION = '1';
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const CACHE_LIMIT = 300;
const FAILURE_TTL_MS = 10 * 60 * 1000;

type CacheEntry = { png: Buffer | null; at: number };

@Injectable()
export class AppIconService {
  private readonly logger = new Logger(AppIconService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly appStaticUrl: string;

  constructor(
    private readonly storage: MediaStorage,
    env: ConfigService,
  ) {
    // Arquivos personalizados da instalação podem vir do nginx do app.
    this.appStaticUrl = (env.get<string>('APP_STATIC_URL')?.trim() || 'http://localhost:7693').replace(/\/$/, '');
  }

  /** Imagem de origem: favicon do painel, senão o logo em imagem. */
  sourceOf(config: AppConfig): string | null {
    const favicon = config.brand.faviconUrl?.trim();
    if (favicon) return favicon;
    if (config.brand.logo.kind === 'image' && config.brand.logo.url.trim()) return config.brand.logo.url.trim();
    return null;
  }

  /** Versão curta para o ?v= das URLs: muda quando a origem muda. */
  versionOf(config: AppConfig) {
    const source = this.sourceOf(config);
    if (!source) return null;
    return createHash('sha256').update(`${RENDER_VERSION}|${source}`).digest('hex').slice(0, 10);
  }

  /** PNG do ícone pedido, ou null quando não há marca ou a imagem não carrega. */
  async render(config: AppConfig, file: AppIconFile): Promise<Buffer | null> {
    const source = this.sourceOf(config);
    if (!source) return null;
    const key = `${source}|${file}`;
    const cached = this.cache.get(key);
    if (cached && (cached.png || Date.now() - cached.at < FAILURE_TTL_MS)) return cached.png;

    let png: Buffer | null = null;
    try {
      png = await draw(await this.load(source), APP_ICONS[file]);
    } catch (error) {
      this.logger.warn(`Ícone não gerado a partir de ${source}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (this.cache.size >= CACHE_LIMIT) this.cache.delete(this.cache.keys().next().value as string);
    this.cache.set(key, { png, at: Date.now() });
    return png;
  }

  private async load(source: string): Promise<Buffer> {
    const mediaKey = this.storage.keyForUrl(source);
    if (mediaKey) return this.storage.read(mediaKey);
    if (source.startsWith('/') && !source.startsWith('//')) return download(`${this.appStaticUrl}${source}`, false);
    return download(source, true);
  }
}

/** Baixa a imagem. Endereços externos só por HTTPS público: nada de rede interna. */
async function download(url: string, external: boolean, hops = 0): Promise<Buffer> {
  const parsed = new URL(url);
  if (external) {
    if (parsed.protocol !== 'https:') throw new Error('Só imagens por HTTPS.');
    const addresses = await lookup(parsed.hostname, { all: true });
    if (addresses.length === 0 || addresses.some(({ address }) => isPrivateIp(address))) throw new Error('Endereço da imagem não é público.');
  }
  const response = await fetch(parsed, { redirect: 'manual', signal: AbortSignal.timeout(8000), headers: { accept: 'image/*' } });
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (!location || hops >= 3) throw new Error('Redirecionamentos demais.');
    return download(new URL(location, parsed).toString(), external, hops + 1);
  }
  if (!response.ok) throw new Error(`Imagem respondeu ${response.status}.`);
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > MAX_SOURCE_BYTES) throw new Error('Imagem grande demais.');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_SOURCE_BYTES) throw new Error('Imagem grande demais.');
  return buffer;
}

/**
 * Quadrado opaco no tamanho pedido. Imagem quadrada (ícone pronto) ocupa tudo e
 * o fundo vem da borda dela, cobrindo cantos arredondados transparentes. Logo
 * retangular ou recortado fica centralizado com respiro sobre o fundo escuro.
 * Maskable guarda a zona segura (círculo de 80%) porque o Android recorta.
 */
async function draw(input: Buffer, spec: { size: number; maskable: boolean }): Promise<Buffer> {
  const probe = await sharp(input).metadata();
  if (!probe.width || !probe.height) throw new Error('Imagem sem dimensões.');
  const isSvg = probe.format === 'svg';
  const density = isSvg ? Math.min(2400, Math.max(72, Math.ceil((72 * spec.size) / Math.min(probe.width, probe.height)))) : undefined;
  const open = () => sharp(input, density ? { density } : {});

  const ratio = probe.width / probe.height;
  const square = Math.abs(ratio - 1) < 0.08;
  const background = square ? await edgeColor(open(), probe.width, probe.height, density ? density / 72 : 1) : DEFAULT_BG;

  const scale = spec.maskable ? (square ? 0.8 : 0.62) : square ? 1 : 0.78;
  const inner = Math.round(spec.size * scale);
  const art = await open()
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({ create: { width: spec.size, height: spec.size, channels: 4, background } })
    .composite([{ input: art, gravity: 'centre' }])
    .flatten({ background })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Cor da borda de cima (a 3% da altura, no meio). Transparente cai no fundo padrão. */
async function edgeColor(image: Sharp, width: number, height: number, factor: number) {
  const w = Math.round(width * factor);
  const h = Math.round(height * factor);
  const { data } = await image
    .ensureAlpha()
    .extract({ left: Math.floor(w / 2), top: Math.min(h - 1, Math.floor(h * 0.03)), width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const [r, g, b, a] = data;
  return a >= 250 ? { r, g, b, alpha: 1 } : DEFAULT_BG;
}
