import type { MultipartFile } from '@fastify/multipart';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  PayloadTooLargeException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { MEDIA_MAX_BYTES } from '../../media/media-storage.js';
import { MediaService } from '../../media/media.service.js';
import type { Actor } from '../auth/admin-auth.service.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentActor, Roles, RolesGuard } from '../auth/roles.js';
import { AdminInstallationService } from '../installation/admin-installation.service.js';

const linkSchema = z.object({
  url: z.string().trim().min(1, 'Cole o link da imagem.'),
  name: z.string().trim().max(80).optional(),
});
const renameSchema = z.object({ name: z.string().trim().min(1, 'Informe um nome.').max(80) });

type Link = z.infer<typeof linkSchema>;
type Rename = z.infer<typeof renameSchema>;

function tooLarge() {
  return new PayloadTooLargeException('Arquivo maior que 8 MB. Reduza a imagem e tente de novo.');
}

/** Lê o único arquivo do multipart (campo `file`; `name` opcional vem antes dele no form). */
async function readUpload(req: FastifyRequest) {
  if (!req.isMultipart()) throw new BadRequestException('Envie o arquivo como multipart/form-data no campo "file".');
  let file: MultipartFile | undefined;
  let buffer: Buffer;
  try {
    file = await req.file();
    if (!file) throw new BadRequestException('Nenhum arquivo enviado. Use o campo "file".');
    buffer = await file.toBuffer();
    // O plugin corta o stream no limite em vez de falhar; `truncated` denuncia.
    if (file.file.truncated || buffer.length > MEDIA_MAX_BYTES) throw tooLarge();
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'FST_REQ_FILE_TOO_LARGE') throw tooLarge();
    if (code === 'FST_FILES_LIMIT') throw new BadRequestException('Envie um arquivo por vez.');
    throw error;
  }
  const nameField = file.fields.name;
  const name = nameField && !Array.isArray(nameField) && nameField.type === 'field' ? String(nameField.value) : undefined;
  return { buffer, mime: file.mimetype, filename: file.filename, name };
}

/**
 * Banco de imagens. Por barbearia (dono e gestor mexem, qualquer membro vê) e
 * a biblioteca da plataforma (só quem administra a plataforma mexe).
 */
@Controller('admin')
@UseGuards(AdminGuard, RolesGuard)
export class AdminMediaController {
  constructor(
    private readonly media: MediaService,
    private readonly tenants: AdminInstallationService,
  ) {}

  @Get('installation/media')
  async library(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    await this.tenants.access(actor, id);
    return this.media.library(id);
  }

  @Post('installation/media')
  async upload(@CurrentActor() actor: Actor, @Req() req: FastifyRequest) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    const upload = await readUpload(req);
    return this.media.upload({}, { ...upload, actorId: actor.id });
  }

  @Post('installation/media/links')
  async link(@CurrentActor() actor: Actor, @Body(new ZodValidationPipe(linkSchema)) body: Link) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.media.addLink({}, { ...body, actorId: actor.id });
  }

  @Patch('installation/media/:assetId')
  async rename(@CurrentActor() actor: Actor, @Param('assetId') assetId: string, @Body(new ZodValidationPipe(renameSchema)) body: Rename) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.media.rename({}, assetId, body.name);
  }

  @Delete('installation/media/:assetId')
  async remove(@CurrentActor() actor: Actor, @Param('assetId') assetId: string) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.media.remove({}, assetId);
  }

  @Get('media')
  @Roles('PLATAFORMA')
  platformLibrary() {
    return this.media.platformLibrary();
  }

  @Post('media')
  @Roles('PLATAFORMA')
  async platformUpload(@CurrentActor() actor: Actor, @Req() req: FastifyRequest) {
    const upload = await readUpload(req);
    return this.media.upload({}, { ...upload, actorId: actor.id });
  }

  @Post('media/links')
  @Roles('PLATAFORMA')
  platformLink(@CurrentActor() actor: Actor, @Body(new ZodValidationPipe(linkSchema)) body: Link) {
    return this.media.addLink({}, { ...body, actorId: actor.id });
  }

  @Patch('media/:assetId')
  @Roles('PLATAFORMA')
  platformRename(@Param('assetId') assetId: string, @Body(new ZodValidationPipe(renameSchema)) body: Rename) {
    return this.media.rename({}, assetId, body.name);
  }

  @Delete('media/:assetId')
  @Roles('PLATAFORMA')
  platformRemove(@Param('assetId') assetId: string) {
    return this.media.remove({}, assetId);
  }
}
