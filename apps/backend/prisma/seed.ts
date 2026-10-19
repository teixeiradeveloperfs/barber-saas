import { barberOs, parseAppConfig } from '@barber/tenant-config';
import { PrismaPg } from '@prisma/adapter-pg';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/admin/auth/admin-auth.service.js';

loadEnv({ path: `.env.${process.env.NODE_ENV ?? 'development'}` });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
});

async function upsertInstallation(raw: unknown) {
  const config = parseAppConfig(raw);
  const tenant = await prisma.installation.upsert({
    where: { slug: config.id },
    create: { slug: config.id, name: config.name },
    update: { name: config.name },
  });

  // Mantém a instalação local alinhada com a identidade padrão do curso.
  const existing = await prisma.appConfig.findFirst({ orderBy: { version: 'desc' } });
  if (!existing) {
    await prisma.appConfig.create({
      data: { version: 1, published: true, config },
    });
  } else {
    await prisma.appConfig.update({ where: { id: existing.id }, data: { config, published: true } });
  }
  console.log(`instalação ${config.id} ok`);
}
// One fixed installation for the course edition.
await upsertInstallation(barberOs);

await seedPlatformLibrary();

// Dono de exemplo (só fora de produção) da instalação única.
// Senha fora de listas de vazamento: senhas comuns fazem o Chrome abrir um aviso
// modal que trava a aba nos testes automatizados.
const OWNER_PASSWORD = 'barber-dono-2026';
if (process.env.NODE_ENV !== 'production') {
  const owner = await prisma.adminUser.upsert({
    where: { email: 'dono@barberos.dev' },
    create: { email: 'dono@barberos.dev', name: 'Dono Sua Barbearia', role: 'BARBEARIA', passwordHash: hashPassword(OWNER_PASSWORD) },
    // Reseed devolve a senha conhecida, útil depois de testes que a trocam.
    update: { passwordHash: hashPassword(OWNER_PASSWORD), mustChangePassword: false, status: 'ATIVO' },
  });
  await prisma.adminUser.update({ where: { id: owner.id }, data: { memberRole: 'DONO', memberBarberId: null } });
  console.log(`dono de exemplo: dono@barberos.dev / ${OWNER_PASSWORD}`);

  // Gestor e barbeiro de exemplo da mesma instalação.
  const luxeConfig = parseAppConfig(barberOs);
  const firstBarber = luxeConfig.barbers[0];
  const staff = [
    { email: 'gestor@barberos.dev', name: 'Gestor Sua Barbearia', password: 'barber-gestor-2026', role: 'GESTOR' as const, barberId: null },
    { email: 'barbeiro@barberos.dev', name: firstBarber?.name ?? 'Barbeiro Sua Barbearia', password: 'barber-barbeiro-2026', role: 'BARBEIRO' as const, barberId: firstBarber?.id ?? null },
  ];
  for (const person of staff) {
    const user = await prisma.adminUser.upsert({
      where: { email: person.email },
      create: { email: person.email, name: person.name, role: 'BARBEARIA', passwordHash: hashPassword(person.password) },
      update: { passwordHash: hashPassword(person.password), mustChangePassword: false, status: 'ATIVO' },
    });
    await prisma.adminUser.update({ where: { id: user.id }, data: { memberRole: person.role, memberBarberId: person.barberId } });
    console.log(`${person.role.toLowerCase()} de exemplo: ${person.email} / ${person.password}${person.barberId ? ` (barbeiro ${person.barberId})` : ''}`);
  }
}

// Cliente de exemplo do app (só fora de produção): entra com WhatsApp + senha ou código.
if (process.env.NODE_ENV !== 'production') {
  const luxe = await prisma.installation.findUniqueOrThrow({ where: { slug: 'barberos' } });
  const CUSTOMER_PHONE = '5511999990001';
  const CUSTOMER_PASSWORD = 'luxe-cliente-2026';
  await prisma.customer.upsert({
    where: { email: 'rafael.costa@exemplo.com' },
    create: { name: 'Rafael Costa', phone: CUSTOMER_PHONE, email: 'rafael.costa@exemplo.com', passwordHash: hashPassword(CUSTOMER_PASSWORD), phoneVerifiedAt: new Date() },
    update: { passwordHash: hashPassword(CUSTOMER_PASSWORD), phone: CUSTOMER_PHONE },
  });
  console.log(`cliente de exemplo: rafael.costa@exemplo.com / ${CUSTOMER_PASSWORD}`);
}

await prisma.$disconnect();

// Biblioteca de imagens da plataforma: fotos mock do app (Unsplash, créditos em
// apps/frontend/public/images/CREDITS.md) como links, para qualquer barbearia
// escolher no seletor enquanto não tem as próprias. Trocar antes de publicar.
async function seedPlatformLibrary() {
  const items = [
    { url: '/hero.jpg', name: 'Salão da barbearia' },
    { url: '/images/auth.jpg', name: 'Detalhe da barbearia' },
    { url: '/images/avatar.jpg', name: 'Avatar de cliente' },
    { url: '/images/barbers/tony.jpg', name: 'Retrato de barbeiro 1' },
    { url: '/images/barbers/lucas.jpg', name: 'Retrato de barbeiro 2' },
    { url: '/images/barbers/andre.jpg', name: 'Retrato de barbeiro 3' },
    { url: '/images/barbers/rafa.jpg', name: 'Retrato de barbeiro 4' },
    { url: '/images/barbers/diego.jpg', name: 'Retrato de barbeiro 5' },
    { url: '/images/barbers/caio.jpg', name: 'Retrato de barbeiro 6' },
  ];
  let created = 0;
  for (const item of items) {
    const existing = await prisma.mediaAsset.findFirst({ where: { url: item.url } });
    if (existing) continue;
    await prisma.mediaAsset.create({ data: { ...item, source: 'LINK' } });
    created += 1;
  }
  console.log(`biblioteca da plataforma: ${items.length} imagens (${created} novas)`);
}
