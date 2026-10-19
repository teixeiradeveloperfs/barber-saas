import { createHash } from 'node:crypto';
import { basename, extname } from 'node:path';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { imageSize } from 'image-size';
import type { MediaAsset } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MediaStorage } from './media-storage.js';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

/** Tipos aceitos no upload. */
export const MEDIA_MIME_TYPES = Object.keys(EXTENSIONS);

/** Escopo mantido por compatibilidade com o painel; a instalação é única. */
export type MediaScope = Record<string, never>;

export type MediaAssetView = {
  id: string;
  name: string;
  url: string;
  source: 'UPLOAD' | 'LINK';
  mime: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  /** A URL aparece no config (rascunho ou publicado) ou na foto de um barbeiro da barbearia consultada. */
  inUse: boolean;
  createdAt: Date;
};

type UploadInput = {
  buffer: Buffer;
  mime: string;
  filename: string;
  name?: string;
  actorId: string;
};

/**
 * Banco de imagens. Uploads vão para o storage com nome = hash do conteúdo
 * (mesmo arquivo duas vezes vira um registro só); links só guardam a URL.
 */
@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: MediaStorage,
  ) {}

  /** Imagens da barbearia mais a biblioteca da plataforma, marcando o que está em uso nela. */
  async library(_installationId: string) {
    const [rows, used] = await Promise.all([
      this.prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } }),
      this.usedHaystack(),
    ]);
    return {
      own: rows.map((row) => this.view(row, used)),
      platform: [],
    };
  }

  /** Biblioteca da plataforma, para quem a administra. */
  async platformLibrary() {
    const rows = await this.prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((row) => this.view(row, ''));
  }

  async upload(scope: MediaScope, input: UploadInput) {
    const ext = EXTENSIONS[input.mime];
    if (!ext) throw new BadRequestException('Formato não aceito. Envie JPG, PNG, WebP, GIF, AVIF ou SVG.');
    if (input.buffer.length === 0) throw new BadRequestException('O arquivo está vazio.');

    const folder = 'barberos';
    const hash = createHash('sha256').update(input.buffer).digest('hex').slice(0, 24);
    const key = `${folder}/${hash}.${ext}`;

    const existing = await this.prisma.mediaAsset.findFirst({ where: { storageKey: key } });
    if (existing) return this.view(existing, await this.usedHaystack());

    const dimensions = measure(input.buffer);
    await this.storage.save(key, input.buffer);
    const row = await this.prisma.mediaAsset.create({
      data: {
        name: cleanName(input.name) || cleanName(stripExtension(basename(input.filename))) || 'Imagem',
        url: this.storage.urlFor(key),
        storageKey: key,
        source: 'UPLOAD',
        mime: input.mime,
        size: input.buffer.length,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
        createdById: input.actorId,
      },
    });
    return this.view(row, '');
  }

  async addLink(scope: MediaScope, input: { url: string; name?: string; actorId: string }) {
    const url = input.url.trim();
    if (!/^https?:\/\/\S+$/i.test(url) && !/^\/\S*$/.test(url)) {
      throw new BadRequestException('Cole um link começando com https:// (ou um caminho do app começando com /).');
    }
    const existing = await this.prisma.mediaAsset.findFirst({ where: { url } });
    if (existing) return this.view(existing, await this.usedHaystack());
    const row = await this.prisma.mediaAsset.create({
      data: {
        name: cleanName(input.name) || nameFromUrl(url),
        url,
        source: 'LINK',
        createdById: input.actorId,
      },
    });
    return this.view(row, '');
  }

  async rename(scope: MediaScope, assetId: string, name: string) {
    const row = await this.find(scope, assetId);
    const updated = await this.prisma.mediaAsset.update({ where: { id: row.id }, data: { name: cleanName(name) || row.name } });
    return this.view(updated, await this.usedHaystack());
  }

  /** Apaga o registro e o arquivo. Quem usava a URL fica sem imagem: o painel avisa antes. */
  async remove(scope: MediaScope, assetId: string) {
    const row = await this.find(scope, assetId);
    await this.prisma.mediaAsset.delete({ where: { id: row.id } });
    // A pasta é por escopo e o nome é o hash: nenhum outro registro aponta para este arquivo.
    if (row.storageKey) await this.storage.remove(row.storageKey);
    return { ok: true as const };
  }

  private async find(scope: MediaScope, assetId: string) {
    const row = await this.prisma.mediaAsset.findUnique({ where: { id: assetId } });
    if (!row) throw new NotFoundException('Imagem não encontrada.');
    return row;
  }

  /** Texto onde procurar URLs em uso: último config, último publicado e fotos da equipe. */
  private async usedHaystack() {
    const [latest, published, barbers] = await Promise.all([
      this.prisma.appConfig.findFirst({ orderBy: { version: 'desc' }, select: { config: true } }),
      this.prisma.appConfig.findFirst({ where: { published: true }, orderBy: { version: 'desc' }, select: { config: true } }),
      this.prisma.barber.findMany({ select: { image: true } }),
    ]);
    return [JSON.stringify(latest?.config ?? null), JSON.stringify(published?.config ?? null), ...barbers.map((barber) => barber.image)].join('\n');
  }

  private view(row: MediaAsset, haystack: string): MediaAssetView {
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      source: row.source,
      mime: row.mime,
      size: row.size,
      width: row.width,
      height: row.height,
      inUse: haystack !== '' && haystack.includes(row.url),
      createdAt: row.createdAt,
    };
  }
}

function measure(buffer: Buffer) {
  try {
    const { width, height } = imageSize(buffer);
    return width && height ? { width, height } : null;
  } catch {
    return null;
  }
}

function cleanName(value: string | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

function stripExtension(filename: string) {
  const ext = extname(filename);
  return ext ? filename.slice(0, -ext.length) : filename;
}

function nameFromUrl(url: string) {
  try {
    const path = url.startsWith('/') ? url : new URL(url).pathname;
    const last = decodeURIComponent(path.split('/').filter(Boolean).pop() ?? '');
    return cleanName(stripExtension(last)) || 'Link';
  } catch {
    return 'Link';
  }
}
