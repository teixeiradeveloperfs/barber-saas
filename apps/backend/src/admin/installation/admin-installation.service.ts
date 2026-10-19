import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MemberRole } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { type Actor, hashPassword, temporaryPassword } from '../auth/admin-auth.service.js';
import { ConfigsService } from '../configs/configs.service.js';
import { SINGLE_TENANT_SLUG } from '../../tenants/single-tenant.js';


const memberSelect = {
  id: true, email: true, name: true, role: true, memberRole: true, memberBarberId: true, status: true, lastLoginAt: true, createdAt: true,
} as const;

/** O que o usuário pode nesta barbearia. Plataforma entra como dono. */
export type InstallationAccess = { role: 'PLATAFORMA' | MemberRole; barberId: string | null };

const ROLE_LABEL: Record<MemberRole, string> = { DONO: 'o dono', GESTOR: 'o gestor', BARBEIRO: 'o barbeiro' };

@Injectable()
export class AdminInstallationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: ConfigService,
    private readonly configs: ConfigsService,
  ) {}

  private get platformDomain() {
    return this.env.get<string>('PLATFORM_DOMAIN', 'localhost').toLowerCase();
  }

  /** ID interno da única instalação; nunca vem da URL ou do cliente. */
  async installationId() {
    const installation = await this.prisma.installation.findUnique({ where: { slug: SINGLE_TENANT_SLUG }, select: { id: true } });
    if (!installation) throw new NotFoundException('Instalação não encontrada. Execute o seed do banco.');
    return installation.id;
  }

  /** Vínculo do usuário com a barbearia. 403 sem vínculo. */
  async access(actor: Actor, installationId: string): Promise<InstallationAccess> {
    if (actor.role === 'PLATAFORMA') return { role: 'PLATAFORMA', barberId: null };
    const user = await this.prisma.adminUser.findUnique({ where: { id: actor.id }, select: { memberRole: true, memberBarberId: true } });
    if (!user) throw new ForbiddenException('Você não tem acesso a esta barbearia.');
    return { role: user.memberRole, barberId: user.memberBarberId };
  }

  /** Garante que o usuário pode mexer nesta barbearia (qualquer papel). */
  async assertAccess(actor: Actor, installationId: string) {
    await this.access(actor, installationId);
  }

  /** Exige um dos papéis dentro da barbearia. Plataforma sempre passa. */
  async assertRole(actor: Actor, installationId: string, roles: MemberRole[]): Promise<InstallationAccess> {
    const access = await this.access(actor, installationId);
    if (access.role === 'PLATAFORMA') return access;
    if (!roles.includes(access.role)) {
      const needed = roles.map((role) => ROLE_LABEL[role]).join(' ou ');
      throw new ForbiddenException(`Só ${needed} pode fazer isso nesta barbearia.`);
    }
    return access;
  }

  async get(actor: Actor, id: string) {
    await this.assertAccess(actor, id);
    const tenant = await this.prisma.installation.findUnique({
      where: { id },
    });
    if (!tenant) throw new NotFoundException('Barbearia não encontrada.');
    const configs = await this.configs.state(id);
    return { ...tenant, configs, freeHostname: `${tenant.slug}.${this.platformDomain}` };
  }

  async update(actor: Actor, id: string, input: { name?: string; status?: 'ATIVO' | 'SUSPENSO' | 'ENCERRADO' }) {
    await this.assertRole(actor, id, ['DONO']);
    if (input.status && actor.role !== 'PLATAFORMA') throw new ForbiddenException('Só a plataforma altera o status da barbearia.');
    await this.prisma.installation.update({ where: { id }, data: { ...input, name: input.name?.trim() } });
    return this.get(actor, id);
  }

  /* ---------- donos ---------- */

  async listMembers(actor: Actor, installationId: string) {
    await this.assertRole(actor, installationId, ['DONO', 'GESTOR']);
    const members = await this.prisma.adminUser.findMany({ where: { role: 'BARBEARIA' }, orderBy: { createdAt: 'asc' }, select: memberSelect });
    return members.map((member) => ({ ...member, memberRole: member.memberRole, barberId: member.memberBarberId, since: member.createdAt }));
  }

  /**
   * Vincula um dono pelo e-mail. Se não existir, cria como DONO com senha
   * temporária, devolvida uma única vez para a plataforma repassar.
   */
  async addMember(actor: Actor, installationId: string, input: { email: string; name?: string; role?: MemberRole; barberId?: string | null }) {
    await this.assertRole(actor, installationId, ['DONO']);
    const role: MemberRole = input.role ?? 'DONO';
    if (role === 'BARBEIRO') {
      if (!input.barberId) throw new ForbiddenException('Informe qual barbeiro da equipe esta pessoa é.');
      const state = await this.configs.state(installationId);
      const config = (state.published ?? state.draft)?.config;
      if (!config?.barbers.some((barber) => barber.id === input.barberId)) throw new NotFoundException('Barbeiro não encontrado na equipe.');
    }
    const email = input.email.trim().toLowerCase();
    let user = await this.prisma.adminUser.findUnique({ where: { email } });
    let password: string | undefined;
    if (!user) {
      password = temporaryPassword();
      user = await this.prisma.adminUser.create({
        data: {
          email,
          name: input.name?.trim() || email.split('@')[0],
          role: 'BARBEARIA',
          passwordHash: hashPassword(password),
          mustChangePassword: true,
        },
      });
    }
    if (user.role === 'PLATAFORMA') throw new ForbiddenException('Quem opera a plataforma já vê todas as barbearias.');
    const barberId = role === 'BARBEIRO' ? (input.barberId ?? null) : null;
    await this.prisma.adminUser.update({ where: { id: user.id }, data: { memberRole: role, memberBarberId: barberId } });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      memberRole: role,
      barberId,
      status: user.status,
      created: Boolean(password),
      temporaryPassword: password,
    };
  }

  /** Dono muda papel e barbeiro vinculado de quem já tem acesso. Não mexe em quem opera a plataforma nem rebaixa o próprio acesso. */
  async updateMember(actor: Actor, installationId: string, userId: string, input: { role: MemberRole; barberId?: string | null }) {
    await this.assertRole(actor, installationId, ['DONO']);
    const member = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!member) throw new NotFoundException('Acesso não encontrado.');
    if (member.role === 'PLATAFORMA') throw new ForbiddenException('Quem opera a plataforma não tem papel por barbearia.');
    if (userId === actor.id && input.role !== 'DONO') throw new ForbiddenException('Você não pode rebaixar o próprio acesso. Peça a outro dono.');
    let barberId: string | null = null;
    if (input.role === 'BARBEIRO') {
      if (!input.barberId) throw new ForbiddenException('Informe qual barbeiro da equipe esta pessoa é.');
      const state = await this.configs.state(installationId);
      const config = (state.published ?? state.draft)?.config;
      if (!config?.barbers.some((barber) => barber.id === input.barberId)) throw new NotFoundException('Barbeiro não encontrado na equipe.');
      barberId = input.barberId;
    }
    const updated = await this.prisma.adminUser.update({ where: { id: userId }, data: { memberRole: input.role, memberBarberId: barberId }, select: memberSelect });
    return { ...updated, memberRole: updated.memberRole, barberId: updated.memberBarberId, since: updated.createdAt };
  }

  /** Nova senha temporária para um acesso desta barbearia. Volta uma única vez; a pessoa troca no primeiro login. */
  async resetMemberPassword(actor: Actor, installationId: string, userId: string) {
    await this.assertRole(actor, installationId, ['DONO']);
    const member = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!member) throw new NotFoundException('Acesso não encontrado.');
    if (member.role === 'PLATAFORMA') throw new ForbiddenException('Senha de quem opera a plataforma só a plataforma redefine.');
    const password = temporaryPassword();
    await this.prisma.adminUser.update({ where: { id: userId }, data: { passwordHash: hashPassword(password), mustChangePassword: true } });
    return { temporaryPassword: password };
  }

  async removeMember(actor: Actor, installationId: string, userId: string) {
    await this.assertRole(actor, installationId, ['DONO']);
    if (actor.role !== 'PLATAFORMA' && userId === actor.id) {
      throw new ForbiddenException('Você não pode remover o próprio acesso. Peça à plataforma.');
    }
    await this.prisma.adminUser.update({ where: { id: userId }, data: { memberRole: 'DONO', memberBarberId: null, status: 'SUSPENSO' } });
    return { ok: true as const };
  }
}

