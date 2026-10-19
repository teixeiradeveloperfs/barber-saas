import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminRole } from '../../generated/prisma/enums.js';
import type { AdminRequest } from './admin.guard.js';

export const ROLES_KEY = 'admin:roles';

/** Restringe a rota a papéis. Sem o decorator, qualquer usuário logado passa. */
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);

/** Usuário logado (preenchido pelo AdminGuard). */
export const CurrentActor = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<AdminRequest>();
  if (!request.admin) throw new ForbiddenException('Sem usuário na request.');
  return request.admin;
});

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<AdminRole[] | undefined>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles || roles.length === 0) return true;
    const request = context.switchToHttp().getRequest<AdminRequest>();
    if (!request.admin || !roles.includes(request.admin.role)) {
      throw new ForbiddenException('Só a plataforma pode fazer isso.');
    }
    return true;
  }
}
