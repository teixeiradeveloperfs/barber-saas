import { ConflictException, HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomInt } from 'node:crypto';
import { hashPassword, verifyPassword } from '../admin/auth/admin-auth.service.js';
import type { OtpChannel, OtpPurpose } from '../generated/prisma/enums.js';
import { MessagingService } from '../messaging/messaging.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReferralsService } from '../referrals/referrals.service.js';
import type { ResolvedInstallation } from '../tenants/tenant-context.js';
import { isValidPhone, maskPhone, normalizePhone } from './phone.js';

export const CODE_TTL_MIN = 10;
const MAX_SENDS_PER_WINDOW = 3;
const SEND_WINDOW_MIN = 10;
const MAX_ATTEMPTS = 5;
const TOKEN_TTL = '30d';

export type CustomerClaims = { sub: string; tenant: string; scope: 'cliente' };

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string | null;
  phoneMasked: string;
  email: string | null;
  hasPassword: boolean;
  createdAt: string;
};

class TooManyRequests extends HttpException {
  constructor(message: string) {
    super({ statusCode: HttpStatus.TOO_MANY_REQUESTS, error: 'Too Many Requests', message }, HttpStatus.TOO_MANY_REQUESTS);
  }
}

/**
 * Conta do cliente por barbearia. Identidade = WhatsApp verificado por código;
 * senha é opcional (quem quiser entra sempre por código). Tokens de cliente
 * ficam presos à barbearia em que foram emitidos.
 */
@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referrals: ReferralsService,
    private readonly env: ConfigService,
    private readonly jwt: JwtService,
    private readonly messaging: MessagingService,
  ) {}

  private get secret() {
    // Variável presente mas vazia no .env conta como ausente.
    const own = this.env.get<string>('CUSTOMER_JWT_SECRET')?.trim();
    return own || `${this.env.getOrThrow<string>('ADMIN_JWT_SECRET')}:cliente`;
  }

  private get isProd() {
    return this.env.get<string>('NODE_ENV') === 'production';
  }

  /* ---------- códigos ---------- */

  /** Gera e envia o código. Cadastro exige telefone livre; login e recuperação exigem conta. */
  async requestCode(tenant: ResolvedInstallation, input: { phone: string; channel: OtpChannel; purpose: OtpPurpose }) {
    const phone = normalizePhone(input.phone);
    if (!isValidPhone(phone)) throw new ConflictException('Informe o WhatsApp com DDD, ex.: (11) 98765-4321.');

    const existing = await this.prisma.customer.findUnique({ where: { phone } });
    if (input.purpose === 'CADASTRO' && existing) throw new ConflictException('Já existe uma conta com esse WhatsApp. Entre em vez de cadastrar.');
    if (input.purpose !== 'CADASTRO' && !existing) throw new NotFoundException('Não encontramos conta com esse WhatsApp. Confira o número ou crie uma conta.');

    const since = new Date(Date.now() - SEND_WINDOW_MIN * 60_000);
    const recent = await this.prisma.otpCode.count({ where: { phone, createdAt: { gte: since } } });
    if (recent >= MAX_SENDS_PER_WINDOW) throw new TooManyRequests(`Muitos códigos em pouco tempo. Aguarde ${SEND_WINDOW_MIN} minutos e tente de novo.`);

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60_000);
    await this.prisma.otpCode.create({
      data: { phone, channel: input.channel, purpose: input.purpose, codeHash: this.hashCode(tenant.id, phone, code), expiresAt },
    });
    const text = `${tenant.name}: seu código é ${code}. Vale por ${CODE_TTL_MIN} minutos. Se não foi você, ignore.`;
    const { provider } = await this.messaging.send(input.channel, phone, text);

    return {
      sent: true as const,
      channel: input.channel,
      phone,
      phoneMasked: maskPhone(phone),
      expiresInSeconds: CODE_TTL_MIN * 60,
      retryInSeconds: 60,
      // Só fora de produção e sem provedor real: deixa testar sem telefone.
      ...(provider === 'console' && !this.isProd ? { devCode: code } : {}),
    };
  }

  /** Consome o código mais novo válido. Cinco erros invalidam o código. */
  private async consumeCode(installationId: string, phone: string, purpose: OtpPurpose, code: string) {
    const candidate = await this.prisma.otpCode.findFirst({
      where: { phone, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!candidate) throw new UnauthorizedException('Código expirado ou não encontrado. Peça um novo.');
    if (candidate.attempts >= MAX_ATTEMPTS) throw new UnauthorizedException('Muitas tentativas com esse código. Peça um novo.');
    const ok = candidate.codeHash === this.hashCode(installationId, phone, code.replace(/\D/g, ''));
    if (!ok) {
      await this.prisma.otpCode.update({ where: { id: candidate.id }, data: { attempts: { increment: 1 } } });
      const left = MAX_ATTEMPTS - candidate.attempts - 1;
      throw new UnauthorizedException(left > 0 ? `Código incorreto. ${left} ${left === 1 ? 'tentativa' : 'tentativas'} restante${left === 1 ? '' : 's'}.` : 'Código incorreto. Peça um novo.');
    }
    await this.prisma.otpCode.update({ where: { id: candidate.id }, data: { consumedAt: new Date() } });
  }

  private hashCode(installationId: string, phone: string, code: string) {
    return createHmac('sha256', this.secret).update(`${installationId}:${phone}:${code}`).digest('hex');
  }

  /* ---------- e-mail + senha (porta de entrada atual) ---------- */

  async registerEmail(tenant: ResolvedInstallation, input: { name: string; email: string; password: string; phone?: string; referralCode?: string }) {
    const email = input.email.trim().toLowerCase();
    const taken = await this.prisma.customer.findUnique({ where: { email } });
    if (taken) throw new ConflictException('Já existe uma conta com esse e-mail. Entre em vez de cadastrar.');
    let phone: string | null = null;
    if (input.phone?.trim()) {
      phone = normalizePhone(input.phone);
      if (!isValidPhone(phone)) throw new ConflictException('WhatsApp inválido. Use o DDD, ex.: (11) 98765-4321.');
      const phoneTaken = await this.prisma.customer.findUnique({ where: { phone } });
      if (phoneTaken) throw new ConflictException('Esse WhatsApp já está em outra conta.');
    }
    const customer = await this.prisma.customer.create({
      data: { name: input.name.trim(), email, phone, passwordHash: hashPassword(input.password), lastLoginAt: new Date() },
    });
    await this.referrals.attach(tenant.id, tenant.config, customer, input.referralCode);
    return this.session(customer, tenant.id);
  }

  async loginEmail(tenant: ResolvedInstallation, input: { email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const customer = await this.prisma.customer.findUnique({ where: { email } });
    if (!customer?.passwordHash || !verifyPassword(input.password, customer.passwordHash)) throw new UnauthorizedException('E-mail ou senha incorretos.');
    await this.prisma.customer.update({ where: { id: customer.id }, data: { lastLoginAt: new Date() } });
    return this.session(customer, tenant.id);
  }

  /* ---------- fluxos por código (prontos, fora da porta de entrada por enquanto) ---------- */

  async register(tenant: ResolvedInstallation, input: { name: string; phone: string; email?: string; password?: string; code: string; referralCode?: string }) {
    const phone = normalizePhone(input.phone);
    if (!isValidPhone(phone)) throw new ConflictException('Informe o WhatsApp com DDD.');
    const exists = await this.prisma.customer.findUnique({ where: { phone } });
    if (exists) throw new ConflictException('Já existe uma conta com esse WhatsApp. Entre em vez de cadastrar.');
    await this.consumeCode(tenant.id, phone, 'CADASTRO', input.code);
    const customer = await this.prisma.customer.create({
      data: {
        name: input.name.trim(),
        phone,
        email: input.email?.trim().toLowerCase() || null,
        passwordHash: input.password ? hashPassword(input.password) : null,
        phoneVerifiedAt: new Date(),
        lastLoginAt: new Date(),
      },
    });
    await this.referrals.attach(tenant.id, tenant.config, customer, input.referralCode);
    return this.session(customer, tenant.id);
  }

  async loginWithPassword(tenant: ResolvedInstallation, input: { phone: string; password: string }) {
    const phone = normalizePhone(input.phone);
    const customer = await this.prisma.customer.findUnique({ where: { phone } });
    if (!customer) throw new UnauthorizedException('WhatsApp ou senha incorretos.');
    if (!customer.passwordHash) throw new UnauthorizedException('Essa conta entra com código. Peça um código pelo WhatsApp ou SMS.');
    if (!verifyPassword(input.password, customer.passwordHash)) throw new UnauthorizedException('WhatsApp ou senha incorretos.');
    await this.prisma.customer.update({ where: { id: customer.id }, data: { lastLoginAt: new Date() } });
    return this.session(customer, tenant.id);
  }

  async loginWithCode(tenant: ResolvedInstallation, input: { phone: string; code: string }) {
    const phone = normalizePhone(input.phone);
    const customer = await this.prisma.customer.findUnique({ where: { phone } });
    if (!customer) throw new NotFoundException('Não encontramos conta com esse WhatsApp.');
    await this.consumeCode(tenant.id, phone, 'LOGIN', input.code);
    await this.prisma.customer.update({ where: { id: customer.id }, data: { lastLoginAt: new Date(), phoneVerifiedAt: customer.phoneVerifiedAt ?? new Date() } });
    return this.session(customer, tenant.id);
  }

  /** Recuperação: código por WhatsApp ou SMS e nova senha. Já devolve sessão. */
  async recover(tenant: ResolvedInstallation, input: { phone: string; code: string; newPassword: string }) {
    const phone = normalizePhone(input.phone);
    const customer = await this.prisma.customer.findUnique({ where: { phone } });
    if (!customer) throw new NotFoundException('Não encontramos conta com esse WhatsApp.');
    await this.consumeCode(tenant.id, phone, 'RECUPERACAO', input.code);
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: { passwordHash: hashPassword(input.newPassword), lastLoginAt: new Date() },
    });
    return this.session(updated, tenant.id);
  }

  /* ---------- sessão ---------- */

  async authenticate(token: string, installationId: string) {
    let claims: CustomerClaims;
    try {
      claims = await this.jwt.verifyAsync<CustomerClaims>(token, { secret: this.secret });
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }
    if (claims.scope !== 'cliente' || claims.tenant !== installationId) throw new UnauthorizedException('Sessão de outra barbearia.');
    const customer = await this.prisma.customer.findUnique({ where: { id: claims.sub } });
    if (!customer) throw new UnauthorizedException('Sessão inválida ou expirada.');
    return customer;
  }

  async me(customerId: string): Promise<CustomerProfile> {
    const customer = await this.prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    return profile(customer);
  }

  async updateMe(customerId: string, input: { name?: string; email?: string | null; phone?: string | null }) {
    const current = await this.prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    let phone: string | null | undefined = undefined;
    if (input.phone !== undefined) {
      phone = input.phone?.trim() ? normalizePhone(input.phone) : null;
      if (phone && !isValidPhone(phone)) throw new ConflictException('WhatsApp inválido. Use o DDD, ex.: (11) 98765-4321.');
      if (phone) {
        const taken = await this.prisma.customer.findUnique({ where: { phone } });
        if (taken && taken.id !== customerId) throw new ConflictException('Esse WhatsApp já está em outra conta.');
      }
    }
    let email: string | null | undefined = undefined;
    if (input.email !== undefined) {
      email = input.email?.trim().toLowerCase() || null;
      if (email) {
        const taken = await this.prisma.customer.findUnique({ where: { email } });
        if (taken && taken.id !== customerId) throw new ConflictException('Esse e-mail já está em outra conta.');
      }
    }
    const customer = await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
    });
    return profile(customer);
  }

  async changePassword(customerId: string, input: { current?: string; next: string }) {
    const customer = await this.prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    // 422, não 401: o cliente está logado, só errou a senha atual. Um 401 aqui seria lido pelo app como sessão vencida e deslogaria a pessoa.
    if (customer.passwordHash && !verifyPassword(input.current ?? '', customer.passwordHash)) throw new UnprocessableEntityException('Senha atual incorreta.');
    await this.prisma.customer.update({ where: { id: customerId }, data: { passwordHash: hashPassword(input.next) } });
    return { ok: true as const };
  }

  private async session(customer: { id: string; name: string; phone: string | null; email: string | null; passwordHash: string | null; createdAt: Date }, installationId: string) {
    const claims: CustomerClaims = { sub: customer.id, tenant: installationId, scope: 'cliente' };
    const token = await this.jwt.signAsync(claims, { secret: this.secret, expiresIn: TOKEN_TTL });
    return { token, customer: profile(customer) };
  }
}

function profile(customer: { id: string; name: string; phone: string | null; email: string | null; passwordHash: string | null; createdAt: Date }): CustomerProfile {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    phoneMasked: customer.phone ? maskPhone(customer.phone) : '',
    email: customer.email,
    hasPassword: Boolean(customer.passwordHash),
    createdAt: customer.createdAt.toISOString(),
  };
}
