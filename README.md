# Sua Barbearia

Sistema web para gestão de uma barbearia em instalação única, com área do cliente, painel administrativo, API e landing page pública.

O projeto foi preparado para uso em curso e não possui fluxo de criação ou isolamento de múltiplos tenants. A instalação representa uma única barbearia.

## Visão geral

- **Cliente:** agendamento, visualização de serviços, profissionais e horários.
- **Admin:** gestão da operação, agenda, serviços, profissionais, clientes e configurações.
- **API:** autenticação, regras de negócio e persistência.
- **Landing page:** apresentação pública da barbearia.
- **Banco:** PostgreSQL.
- **Produção:** Nginx para os arquivos estáticos e proxy da API; PM2 para manter a API em execução.

## Stack

- Node.js 22+
- pnpm 11+
- TypeScript
- React + Vite
- NestJS + Fastify
- Prisma ORM
- PostgreSQL
- Nginx e PM2

## Estrutura do monorepo

```text
apps/
  backend/     API NestJS
  frontend/    Aplicação do cliente
  admin/       Painel administrativo
  landing/     Site público
packages/
  tenant-config/ Configuração da instalação única e tema
deploy/        Arquivos de Nginx, PM2 e instruções de VPS
```

## Requisitos

- Node.js 22 ou superior
- pnpm 11 ou superior
- Docker e Docker Compose, para subir o PostgreSQL localmente

Confira as versões:

```bash
node --version
pnpm --version
docker --version
```

## Instalação local

Na raiz do projeto:

```bash
corepack enable
pnpm install
```

Crie os arquivos de ambiente locais a partir dos exemplos:

```bash
cp apps/backend/.env.example apps/backend/.env.development
cp apps/frontend/.env.example apps/frontend/.env.development
cp apps/admin/.env.example apps/admin/.env.development
cp apps/landing/.env.example apps/landing/.env.development
```

Revise principalmente `DATABASE_URL`, os segredos JWT e as URLs da API. Os arquivos `.env.development` são locais e não devem ser versionados.

Suba o PostgreSQL:

```bash
docker compose up -d
```

Aplique o schema e carregue os dados de desenvolvimento:

```bash
pnpm --filter @barber/backend prisma:deploy
pnpm --filter @barber/backend prisma:seed
```

Inicie os aplicativos:

```bash
pnpm dev
```

## URLs locais

| Aplicação | URL |
|---|---|
| Cliente | http://localhost:7693 |
| Admin | http://localhost:5928 |
| Landing | http://localhost:6400 |
| API | http://localhost:7192 |
| PostgreSQL | localhost:5544 |

## Usuários de desenvolvimento

Os usuários abaixo são criados pelo seed e servem apenas para ambiente local:

| Perfil | E-mail | Senha |
|---|---|---|
| Dono | `dono@barberos.dev` | `barber-dono-2026` |
| Gestor | `gestor@barberos.dev` | `barber-gestor-2026` |
| Barbeiro | `barbeiro@barberos.dev` | `barber-barbeiro-2026` |
| Cliente | `rafael.costa@exemplo.com` | `luxe-cliente-2026` |

Não use essas credenciais em produção. Altere-as antes de disponibilizar o sistema.

## Comandos principais

```bash
pnpm dev                         # executa os aplicativos em desenvolvimento
pnpm build                       # gera os builds de produção
pnpm test                        # executa os testes do workspace
pnpm lint                        # verifica o código
pnpm --filter @barber/backend exec prisma validate
pnpm --filter @barber/backend prisma:deploy
pnpm --filter @barber/backend prisma:seed
```

Para executar somente os testes da API:

```bash
pnpm --filter @barber/backend test -- --run
```

## Configuração da instalação

A identidade visual fica em `packages/tenant-config`. O nome atual é **Sua Barbearia**, incluindo o slogan usado pela interface. O pacote permanece com esse nome por compatibilidade estrutural do monorepo, mas o produto funciona como uma instalação única.

O slug interno legado `barberos` pode aparecer em dados e URLs internas já existentes. Ele não representa um mecanismo de múltiplos tenants nem permite cadastrar outra instalação.

## Deploy em VPS

O caminho recomendado para iniciantes é Docker Compose. Um único comando sobe a aplicação, a API e o PostgreSQL, sem exigir configuração manual de PM2, build separado ou GitHub Actions.

O passo a passo está em [deploy/README-VPS.md](deploy/README-VPS.md). O arquivo de configuração é [deploy/docker-compose.yml](deploy/docker-compose.yml) e o modelo de variáveis está em [deploy/.env.docker.example](deploy/.env.docker.example).

```bash
cp deploy/.env.docker.example deploy/.env.docker
# edite deploy/.env.docker e troque IP, senhas e segredos
docker compose --env-file deploy/.env.docker -f deploy/docker-compose.yml up -d --build
```

Nginx, PM2 e GitHub Actions ficam como opções avançadas para uma segunda etapa. O deploy básico não depende deles.

## Segurança

- Nunca publique arquivos `.env.development` ou `.env.production`.
- Use os arquivos `.env.example` apenas como modelo.
- Troque todos os segredos JWT e credenciais de exemplo em produção.
- Não execute o seed em um banco de produção sem revisar o código antes.
- Restrinja o acesso ao PostgreSQL e mantenha o banco fora da exposição pública.
- Configure HTTPS no Nginx com um certificado válido.

## Solução de problemas

### API retorna 502

Verifique se a API está rodando na porta `7192`:

```bash
pm2 status
pm2 logs sua-barbearia-api
curl http://127.0.0.1:7192/health
```

### Login retorna 401

Confira se o frontend está apontando para a URL correta da API, se os segredos JWT são consistentes e se o usuário existe no banco. Em ambiente local, o seed recria os usuários de desenvolvimento.

### A aplicação retorna 404 ao atualizar uma rota

O Nginx precisa usar fallback para `index.html` nas aplicações SPA. Use a configuração fornecida em `deploy/nginx-vps.conf.example`.

### Prisma não conecta

Confira `DATABASE_URL`, se o PostgreSQL está ativo e se a porta configurada corresponde à porta publicada pelo Docker ou pela VPS:

```bash
docker compose ps
pnpm --filter @barber/backend exec prisma validate
```

## Validação antes de publicar

Execute o conjunto abaixo antes do deploy:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
pnpm --filter @barber/backend exec prisma validate
```

Se todos os comandos concluírem sem erro, confira também o login e os fluxos principais no cliente e no painel administrativo.
