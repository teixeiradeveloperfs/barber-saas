import { mkdirSync } from 'node:fs';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve, sep } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Tamanho máximo de um arquivo enviado. */
export const MEDIA_MAX_BYTES = 8 * 1024 * 1024;
/** Prefixo público onde a API serve os uploads. */
export const MEDIA_PREFIX = '/media/';

/** Pasta dos uploads (MEDIA_DIR, relativa à pasta do backend). Cria se não existir. */
export function resolveMediaRoot(env: ConfigService) {
  const configured = env.get<string>('MEDIA_DIR')?.trim();
  const dir = configured || 'storage/media';
  const root = isAbsolute(dir) ? dir : resolve(process.cwd(), dir);
  mkdirSync(root, { recursive: true });
  return root;
}

/** URL pública da API, base dos links dos uploads (PUBLIC_API_URL). */
export function resolvePublicApiUrl(env: ConfigService) {
  const configured = env.get<string>('PUBLIC_API_URL')?.trim();
  const fallback = `http://localhost:${env.get<string>('PORT', '3000')}`;
  return (configured || fallback).replace(/\/$/, '');
}

/**
 * Storage local em disco. Em produção, monte um volume persistente em
 * MEDIA_DIR ou troque esta classe por uma que fale com R2/S3 mantendo
 * `save`, `read`, `remove`, `urlFor` e `keyForUrl`.
 */
@Injectable()
export class MediaStorage {
  readonly root: string;
  readonly publicBase: string;

  constructor(env: ConfigService) {
    this.root = resolveMediaRoot(env);
    this.publicBase = resolvePublicApiUrl(env);
  }

  urlFor(key: string) {
    return `${this.publicBase}${MEDIA_PREFIX}${key}`;
  }

  async save(key: string, buffer: Buffer) {
    const target = this.pathFor(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, buffer);
  }

  async read(key: string) {
    return readFile(this.pathFor(key));
  }

  /** Chave do arquivo quando a URL é de um upload servido por esta API; senão null. */
  keyForUrl(url: string) {
    const prefix = `${this.publicBase}${MEDIA_PREFIX}`;
    if (!url.startsWith(prefix)) return null;
    const key = decodeURIComponent(url.slice(prefix.length).split(/[?#]/)[0]);
    return key && !key.includes('..') ? key : null;
  }

  async remove(key: string) {
    try {
      await unlink(this.pathFor(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  private pathFor(key: string) {
    const target = resolve(this.root, key);
    if (target !== this.root && !target.startsWith(`${this.root}${sep}`)) throw new Error('Caminho fora do storage.');
    return target;
  }
}
