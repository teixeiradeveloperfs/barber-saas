import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type PreviewClaims = { sub: string; scope: 'preview' };

/**
 * Token curto que deixa o app do cliente abrir o rascunho de um tenant:
 * `https://app/?tenant=<slug>&preview=<token>`. Só o admin emite.
 */
@Injectable()
export class PreviewService {
  constructor(private readonly jwt: JwtService) {}

  issue(slug: string) {
    return this.jwt.signAsync({ sub: slug, scope: 'preview' } satisfies PreviewClaims, { expiresIn: '2h' });
  }

  /** Slug autorizado pelo token, ou null se inválido. */
  async slugFor(token: string | undefined | null) {
    if (!token) return null;
    try {
      const claims = await this.jwt.verifyAsync<PreviewClaims>(token);
      return claims.scope === 'preview' ? claims.sub : null;
    } catch {
      return null;
    }
  }
}
