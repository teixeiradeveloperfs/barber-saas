import { Body, Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { type Actor, AdminAuthService } from './admin-auth.service.js';
import { AdminGuard } from './admin.guard.js';
import { CurrentActor } from './roles.js';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(1, 'Informe a senha.'),
});
const passwordSchema = z.object({
  current: z.string().min(1, 'Informe a senha atual.'),
  next: z.string().min(8, 'A nova senha precisa de pelo menos 8 caracteres.'),
});

const accessSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres.').max(200),
});
const forgotSchema = z.object({ email: z.string().trim().email('E-mail inválido.') });

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post('login')
  login(@Body(new ZodValidationPipe(loginSchema)) body: z.infer<typeof loginSchema>) {
    return this.auth.login(body.email, body.password);
  }

  /** Primeiro acesso / redefinição: quem é o dono do link (sem login). */
  @Get('access/:token')
  peekAccess(@Param('token') token: string) {
    return this.auth.peekAccessLink(token);
  }

  /** Cria a senha pelo link e já devolve a sessão. */
  @Post('access')
  @HttpCode(200)
  redeemAccess(@Body(new ZodValidationPipe(accessSchema)) body: z.infer<typeof accessSchema>) {
    return this.auth.redeemAccessLink(body.token, body.password);
  }

  /** Esqueci a senha: manda um link por e-mail (resposta igual exista ou não o e-mail). */
  @Post('forgot')
  @HttpCode(200)
  forgot(@Body(new ZodValidationPipe(forgotSchema)) body: z.infer<typeof forgotSchema>) {
    return this.auth.requestAccessLink(body.email);
  }

  /** Perfil de quem está logado e as barbearias que ele enxerga. */
  @Get('me')
  @UseGuards(AdminGuard)
  me(@CurrentActor() actor: Actor) {
    return this.auth.me(actor);
  }

  @Patch('password')
  @UseGuards(AdminGuard)
  changePassword(@CurrentActor() actor: Actor, @Body(new ZodValidationPipe(passwordSchema)) body: z.infer<typeof passwordSchema>) {
    return this.auth.changePassword(actor, body.current, body.next);
  }
}
