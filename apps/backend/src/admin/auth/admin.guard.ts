import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { type Actor, AdminAuthService } from './admin-auth.service.js';

export type AdminRequest = FastifyRequest & { admin?: Actor };

/** Exige `Authorization: Bearer <jwt>` de um usuário ativo do painel. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AdminAuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const header = request.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Faça login para continuar.');
    request.admin = await this.auth.authenticate(token);
    return true;
  }
}
