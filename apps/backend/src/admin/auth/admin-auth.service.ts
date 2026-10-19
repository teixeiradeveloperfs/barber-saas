import { ForbiddenException, GoneException, Injectable, NotFoundException, type OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { EmailService } from '../../email/email.service.js';
import { accessLinkEmail } from '../../email/templates.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AdminRole } from '../../generated/prisma/enums.js';
import { SINGLE_TENANT_SLUG } from '../../tenants/single-tenant.js';

export type AdminClaims = { sub: string; email: string; role: AdminRole };

/** Usuário autenticado, anexado à request pelo AdminGuard. */
export type Actor = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  mustChangePassword: boolean;
};

/**
 * Autenticação do painel. Usuários vivem em `admin_users`; o primeiro admin da
 * plataforma nasce do ambiente (ADMIN_EMAIL + ADMIN_PASSWORD_HASH, ou
 * ADMIN_PASSWORD em claro fora de produção) na primeira subida sem usuários.
 */
@Injectable()
export class AdminAuthService implements OnModuleInit {
  constructor(
    private readonly env: ConfigService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  /** Endereço do painel para os links de e-mail. */
  get adminUrl() {
    const configured = this.env.get<string>('ADMIN_URL')?.trim();
    if (configured) return configured.replace(/\/$/, '');
    const production = this.env.get<string>('NODE_ENV') === 'production';
    return production ? `https://admin.${this.env.get<string>('PLATFORM_DOMAIN', 'localhost')}` : 'http://localhost:5928';
  }

  /* ---------- link de acesso (primeiro acesso e esqueci a senha) ---------- */

  /** Gera um link de uso único (7 dias) para criar a senha. Guarda só o hash. */
  async issueAccessLink(userId: string, installationId: string | null) {
    const token = randomBytes(32).toString('base64url');
    await this.prisma.adminAccessToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 7 * 86_400_000) },
    });
    return `${this.adminUrl}/primeiro-acesso?token=${token}`;
  }

  private async findAccessToken(token: string) {
    const row = await this.prisma.adminAccessToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
    if (!row) throw new NotFoundException('Link inválido. Peça um novo na tela de login.');
    if (row.usedAt) throw new GoneException('Este link já foi usado. Entre com a sua senha ou peça um novo.');
    if (row.expiresAt.getTime() < Date.now()) throw new GoneException('Este link expirou. Peça um novo na tela de login.');
    if (row.user.status !== 'ATIVO') throw new ForbiddenException('Acesso suspenso. Fale com a plataforma.');
    return row;
  }

  /** O que a tela de primeiro acesso mostra antes de criar a senha. */
  async peekAccessLink(token: string) {
    const row = await this.findAccessToken(token);
    return { name: row.user.name, email: row.user.email, tenant: null, firstAccess: !row.user.lastLoginAt };
  }

  /** Cria a senha, queima o link e já entra. */
  async redeemAccessLink(token: string, password: string) {
    const row = await this.findAccessToken(token);
    await this.prisma.$transaction([
      this.prisma.adminUser.update({ where: { id: row.userId }, data: { passwordHash: hashPassword(password), mustChangePassword: false, lastLoginAt: new Date() } }),
      this.prisma.adminAccessToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      // Outros links abertos desse usuário deixam de valer.
      this.prisma.adminAccessToken.updateMany({ where: { userId: row.userId, usedAt: null, id: { not: row.id } }, data: { usedAt: new Date() } }),
    ]);
    const claims: AdminClaims = { sub: row.user.id, email: row.user.email, role: row.user.role };
    const jwt = await this.jwt.signAsync(claims, { expiresIn: '12h' });
    return { token: jwt, admin: toActor({ ...row.user, mustChangePassword: false }), installationId: null };
  }

  /** Esqueci a senha: manda o link se o e-mail existir. A resposta é sempre a mesma. */
  async requestAccessLink(emailAddress: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { email: emailAddress.trim().toLowerCase() } });
    if (user && user.status === 'ATIVO') {
      const recent = await this.prisma.adminAccessToken.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 15 * 60_000) } } });
      if (recent < 3) {
        const link = await this.issueAccessLink(user.id, null);
        await this.email.send({ to: user.email, ...accessLinkEmail({ name: user.name, link }) });
      }
    }
    return { ok: true as const };
  }

  async onModuleInit() {
    await this.ensureBootstrapAdmin();
  }

  /** Cria o admin da plataforma a partir do ambiente se ainda não houver nenhum. */
  async ensureBootstrapAdmin() {
    const existing = await this.prisma.adminUser.count({ where: { role: 'PLATAFORMA' } });
    if (existing > 0) return;
    const email = this.env.get<string>('ADMIN_EMAIL', '').trim().toLowerCase();
    const hash = this.env.get<string>('ADMIN_PASSWORD_HASH');
    const plain = this.env.get<string>('ADMIN_PASSWORD');
    const isProd = this.env.get<string>('NODE_ENV') === 'production';
    const passwordHash = hash ?? (plain && !isProd ? hashPassword(plain) : null);
    if (!email || !passwordHash) {
      console.warn('[admin] Nenhum admin da plataforma e ADMIN_EMAIL/ADMIN_PASSWORD(_HASH) ausentes: ninguém consegue entrar no painel.');
      return;
    }
    await this.prisma.adminUser.create({
      data: { email, name: 'Plataforma', passwordHash, role: 'PLATAFORMA' },
    });
    console.log(`[admin] admin da plataforma criado a partir do ambiente: ${email}`);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !verifyScrypt(password, user.passwordHash)) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }
    if (user.status !== 'ATIVO') throw new ForbiddenException('Acesso suspenso. Fale com a plataforma.');
    await this.prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const claims: AdminClaims = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwt.signAsync(claims, { expiresIn: '12h' });
    return { token, admin: toActor(user) };
  }

  /** Valida o token e recarrega o usuário, para suspensão e troca de papel valerem na hora. */
  async authenticate(token: string): Promise<Actor> {
    let claims: AdminClaims;
    try {
      claims = await this.jwt.verifyAsync<AdminClaims>(token);
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }
    const user = await this.prisma.adminUser.findUnique({ where: { id: claims.sub } });
    if (!user || user.status !== 'ATIVO') throw new UnauthorizedException('Sessão inválida ou expirada.');
    return toActor(user);
  }

  /** Perfil do usuário logado com as barbearias que ele enxerga. */
  async me(actor: Actor) {
    // The course edition has one shop. Even a legacy platform admin receives
    // that single record so the rest of the panel does not need a shop picker.
    const singleTenant = await this.prisma.installation.findFirst({
      where: { status: 'ATIVO', slug: SINGLE_TENANT_SLUG },
      select: { id: true, slug: true, name: true, status: true },
    });
    const memberships = singleTenant
      ? [{ role: 'DONO' as const, barberId: null, tenant: singleTenant }]
      : [];
    return { ...actor, affiliate: null, tenants: memberships.map((item) => ({ ...item.tenant, role: item.role, barberId: item.barberId })) };
  }

  async changePassword(actor: Actor, current: string, next: string) {
    const user = await this.prisma.adminUser.findUniqueOrThrow({ where: { id: actor.id } });
    if (!verifyScrypt(current, user.passwordHash)) throw new UnauthorizedException('Senha atual incorreta.');
    await this.prisma.adminUser.update({
      where: { id: actor.id },
      data: { passwordHash: hashPassword(next), mustChangePassword: false },
    });
    return { ok: true as const };
  }
}

export function toActor(user: { id: string; email: string; name: string; role: AdminRole; mustChangePassword: boolean }): Actor {
  return { id: user.id, email: user.email, name: user.name, role: user.role, mustChangePassword: user.mustChangePassword };
}

export function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

/** Senha temporária legível: 10 caracteres sem ambiguidade (sem 0/O, 1/l). */
export function temporaryPassword() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(10);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

/** Confere senha contra hash scrypt "salt:hash". Usado também pelas contas de cliente. */
export function verifyPassword(password: string, stored: string) {
  return verifyScrypt(password, stored);
}

function verifyScrypt(password: string, stored: string) {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const derived = scryptSync(password, salt, 64).toString('hex');
  return safeEqual(derived, expected);
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
