# BarberOS — edição de instalação única

Monorepo Turborepo + pnpm para uma única barbearia. Não há marketplace nem seleção de tenant.

## Apps

- `apps/frontend`: app do cliente, porta 7693.
- `apps/admin`: painel da barbearia, porta 5928.
- `apps/backend`: API NestJS/Fastify, porta 7192.
- `apps/landing`: landing, porta 6400.
- `packages/tenant-config`: schema compartilhado da configuração do app (`AppConfig`).

## Desenvolvimento

```bash
docker compose up -d
pnpm dev
pnpm build
pnpm --filter @barber/backend test -- --runInBand
pnpm --filter @barber/backend prisma:seed
```

O banco local usa PostgreSQL na porta 5544. A instalação única usa o slug fixo `barberos`.

## Arquitetura

- Toda configuração pública vem da instalação única.
- O host, slug, query string e headers nunca escolhem outra instalação.
- O painel usa rotas fixas em `/admin/installation/...`.
- As rotas antigas `/admin/tenants/...` não existem mais.
- IDs internos de instalação não são recebidos pela URL da API; são resolvidos pelo backend.
- O schema Prisma mantém apenas as tabelas necessárias para o produto atual.
- A tabela física da instalação e a tabela de configurações mantêm seus nomes SQL antigos apenas para compatibilidade dos dados locais.

## Acesso local

Com o seed de desenvolvimento:

- dono: `dono@barberos.dev` / `barber-dono-2026`
- gestor: `gestor@barberos.dev` / `barber-gestor-2026`
- barbeiro: `barbeiro@barberos.dev` / `barber-barbeiro-2026`

## Deploy

O deploy deve aplicar o schema Prisma compatível com o banco da instalação única antes de iniciar a API. Não adicionar novamente lógica de tenants, domínios por cliente, checkout de SaaS, afiliados ou billing de plataforma.

Antes de publicar, revisar os textos legais, imagens mock, segredos de ambiente e as regras do WhatsApp.

## Verificação

O estado esperado é:

- `pnpm build` aprovado em todos os cinco pacotes.
- Backend com 28 testes aprovados.
- `prisma validate` aprovado.
- API, admin, frontend e landing respondendo localmente.
- `rg "admin/tenants" apps deploy packages` sem rotas ativas.
