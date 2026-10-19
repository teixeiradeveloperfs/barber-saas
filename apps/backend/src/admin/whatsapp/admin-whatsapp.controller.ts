import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { NotificationsService } from '../../whatsapp/notifications.service.js';
import { exampleValues, EVENTS, REMINDER_OPTIONS_MIN, render, VARIABLES, type ActiveEvent } from '../../whatsapp/templates.js';
import { WhatsappService } from '../../whatsapp/whatsapp.service.js';
import type { Actor } from '../auth/admin-auth.service.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentActor, RolesGuard } from '../auth/roles.js';
import { AdminInstallationService } from '../installation/admin-installation.service.js';

const phone = z.string().transform((value) => value.replace(/\D/g, '')).pipe(z.string().regex(/^\d{10,13}$/, 'WhatsApp com DDD, só números.'));
const templateSchema = z.object({
  enabled: z.boolean(),
  text: z.string().trim().min(1, 'Escreva a mensagem.').max(1000, 'Até 1000 caracteres.'),
  offsetMin: z.number().int().refine((value) => REMINDER_OPTIONS_MIN.includes(value), 'Antecedência inválida.').nullable().optional(),
});
const testSchema = z.object({ phone, text: z.string().trim().min(1).max(1000).optional(), event: z.string().optional() });

function eventParam(value: string): ActiveEvent {
  const event = value.toUpperCase() as ActiveEvent;
  if (!EVENTS.includes(event)) throw new BadRequestException('Aviso desconhecido.');
  return event;
}

/**
 * WhatsApp da barbearia no painel. Conectar e desconectar o número é do dono;
 * textos dos avisos, teste e histórico, de dono e gestor.
 */
@Controller('admin/installation/whatsapp')
@UseGuards(AdminGuard, RolesGuard)
export class AdminWhatsappController {
  constructor(
    private readonly whatsapp: WhatsappService,
    private readonly notifications: NotificationsService,
    private readonly tenants: AdminInstallationService,
  ) {}

  @Get()
  async status(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.whatsapp.status(id);
  }

  @Post('connect')
  async connect(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO']);
    return this.whatsapp.connect(id);
  }

  @Get('qr')
  async qr(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO']);
    return this.whatsapp.qr(id);
  }

  @Post('pairing-code')
  async pairingCode(@CurrentActor() actor: Actor, @Body(new ZodValidationPipe(z.object({ phone }))) body: { phone: string }) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO']);
    return this.whatsapp.pairingCode(id, body.phone);
  }

  @Post('disconnect')
  async disconnect(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO']);
    return this.whatsapp.disconnect(id);
  }

  @Get('templates')
  async templates(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return { items: await this.notifications.templates(id), variables: VARIABLES, reminderOptions: REMINDER_OPTIONS_MIN };
  }

  @Put('templates/:event')
  async saveTemplate(
    @CurrentActor() actor: Actor,
    @Param('event') event: string,
    @Body(new ZodValidationPipe(templateSchema)) body: z.infer<typeof templateSchema>,
  ) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.notifications.saveTemplate(id, eventParam(event), body);
  }

  @Delete('templates/:event')
  async resetTemplate(@CurrentActor() actor: Actor, @Param('event') event: string) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.notifications.resetTemplate(id, eventParam(event));
  }

  /** Manda uma mensagem de teste (um aviso com dados de exemplo, ou um texto livre). */
  @Post('test')
  async test(@CurrentActor() actor: Actor, @Body(new ZodValidationPipe(testSchema)) body: z.infer<typeof testSchema>) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    let text = body.text;
    if (!text) {
      const template = await this.notifications.template(id, eventParam(body.event ?? 'LEMBRETE'));
      text = render(template.text, exampleValues());
    }
    const result = await this.whatsapp.send(id, body.phone, `${text}\n\n_(mensagem de teste)_`);
    return { status: result?.status ?? 'ENVIADO', error: result?.error ?? null };
  }

  @Get('messages')
  async messages(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.whatsapp.recentMessages(id);
  }
}
