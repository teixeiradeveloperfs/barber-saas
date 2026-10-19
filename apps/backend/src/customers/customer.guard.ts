import { type CanActivate, createParamDecorator, type ExecutionContext, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { Customer } from '../generated/prisma/client.js';
import { currentInstallation } from '../tenants/tenant-context.js';
import { CustomerAuthService } from './customer-auth.service.js';

export type CustomerRequest = FastifyRequest & { customer?: Customer };

function bearer(request: FastifyRequest) {
  const [scheme, token] = (request.headers.authorization ?? '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

/** Exige cliente logado da barbearia da requisição. */
@Injectable()
export class CustomerGuard implements CanActivate {
  constructor(private readonly auth: CustomerAuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<CustomerRequest>();
    const tenant = currentInstallation();
    if (!tenant) throw new NotFoundException('Tenant não resolvido para esta requisição.');
    const token = bearer(request);
    if (!token) throw new UnauthorizedException('Entre para continuar.');
    request.customer = await this.auth.authenticate(token, tenant.id);
    return true;
  }
}

/** Cliente se houver token válido; senão segue anônimo (ex.: reservar sem conta). */
@Injectable()
export class OptionalCustomerGuard implements CanActivate {
  constructor(private readonly auth: CustomerAuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<CustomerRequest>();
    const tenant = currentInstallation();
    const token = bearer(request);
    if (!tenant || !token) return true;
    try {
      request.customer = await this.auth.authenticate(token, tenant.id);
    } catch {
      // token velho ou de outra barbearia: trata como anônimo
    }
    return true;
  }
}

export const CurrentCustomer = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  return context.switchToHttp().getRequest<CustomerRequest>().customer ?? null;
});
