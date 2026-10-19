import { Body, Controller, Get, Header, NotFoundException, Patch, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import type { Customer } from '../generated/prisma/client.js';
import { currentInstallation } from '../tenants/tenant-context.js';
import { CustomerAuthService } from './customer-auth.service.js';
import { CurrentCustomer, CustomerGuard } from './customer.guard.js';

const phone = z.string().min(8, 'Informe o WhatsApp com DDD.');
const code = z.string().regex(/^\d{6}$/, 'Código de 6 números.');
const password = z.string().min(6, 'A senha precisa de pelo menos 6 caracteres.');

const otpSchema = z.object({ phone, channel: z.enum(['WHATSAPP', 'SMS']).default('WHATSAPP'), purpose: z.enum(['CADASTRO', 'LOGIN', 'RECUPERACAO']) });
const email = z.string().trim().email('E-mail inválido.');
const referralCode = z.string().trim().max(20).optional().or(z.literal(''));
const registerSchema = z.object({ name: z.string().trim().min(2, 'Informe seu nome.'), email, password, phone: z.string().optional().or(z.literal('')), referralCode });
const loginSchema = z.object({ email, password: z.string().min(1, 'Informe a senha.') });
const registerCodeSchema = z.object({ name: z.string().trim().min(2, 'Informe seu nome.'), phone, email: email.optional().or(z.literal('')), password: password.optional().or(z.literal('')), code, referralCode });
const loginPhoneSchema = z.object({ phone, password: z.string().min(1, 'Informe a senha.') });
const loginCodeSchema = z.object({ phone, code });
const recoverSchema = z.object({ phone, code, newPassword: password });
const meSchema = z.object({ name: z.string().trim().min(2).optional(), email: email.nullable().optional().or(z.literal('')), phone: z.string().nullable().optional() });
const passwordSchema = z.object({ current: z.string().optional(), next: password });

/** Conta do cliente: código por WhatsApp/SMS, cadastro, login, recuperação, perfil. */
@Controller('public/auth')
export class CustomerAuthController {
  constructor(private readonly auth: CustomerAuthService) {}

  @Post('otp')
  @Header('Cache-Control', 'no-store')
  otp(@Body(new ZodValidationPipe(otpSchema)) body: z.infer<typeof otpSchema>) {
    return this.auth.requestCode(requireTenant(), body);
  }

  /** Porta de entrada atual: e-mail + senha. */
  @Post('register')
  register(@Body(new ZodValidationPipe(registerSchema)) body: z.infer<typeof registerSchema>) {
    return this.auth.registerEmail(requireTenant(), { ...body, phone: body.phone || undefined });
  }

  @Post('login')
  login(@Body(new ZodValidationPipe(loginSchema)) body: z.infer<typeof loginSchema>) {
    return this.auth.loginEmail(requireTenant(), body);
  }

  /* Fluxos por código no WhatsApp/SMS: prontos, ligados quando fizer sentido. */

  @Post('register-code')
  registerCode(@Body(new ZodValidationPipe(registerCodeSchema)) body: z.infer<typeof registerCodeSchema>) {
    return this.auth.register(requireTenant(), { ...body, email: body.email || undefined, password: body.password || undefined });
  }

  @Post('login-phone')
  loginPhone(@Body(new ZodValidationPipe(loginPhoneSchema)) body: z.infer<typeof loginPhoneSchema>) {
    return this.auth.loginWithPassword(requireTenant(), body);
  }

  @Post('login-code')
  loginCode(@Body(new ZodValidationPipe(loginCodeSchema)) body: z.infer<typeof loginCodeSchema>) {
    return this.auth.loginWithCode(requireTenant(), body);
  }

  @Post('recover')
  recover(@Body(new ZodValidationPipe(recoverSchema)) body: z.infer<typeof recoverSchema>) {
    return this.auth.recover(requireTenant(), body);
  }

  @Get('me')
  @UseGuards(CustomerGuard)
  @Header('Cache-Control', 'no-store')
  me(@CurrentCustomer() customer: Customer) {
    return this.auth.me(customer.id);
  }

  @Patch('me')
  @UseGuards(CustomerGuard)
  updateMe(@CurrentCustomer() customer: Customer, @Body(new ZodValidationPipe(meSchema)) body: z.infer<typeof meSchema>) {
    return this.auth.updateMe(customer.id, { name: body.name, email: body.email === '' ? null : body.email, phone: body.phone });
  }

  @Patch('password')
  @UseGuards(CustomerGuard)
  changePassword(@CurrentCustomer() customer: Customer, @Body(new ZodValidationPipe(passwordSchema)) body: z.infer<typeof passwordSchema>) {
    return this.auth.changePassword(customer.id, body);
  }
}

function requireTenant() {
  const tenant = currentInstallation();
  if (!tenant) throw new NotFoundException('Tenant não resolvido para esta requisição.');
  return tenant;
}
