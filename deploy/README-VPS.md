# Deploy simples em VPS

Estrutura usada:

- Nginx serve os três `dist`: landing, site do cliente e admin.
- PM2 mantém apenas a API NestJS na porta `7192`.
- PostgreSQL deve estar acessível pela `DATABASE_URL` de produção.

## 1. Dependências da VPS

```bash
sudo apt update
sudo apt install -y nginx git curl
sudo npm install -g pm2
```

Instale Node.js 22+ e pnpm 11+ na VPS. Depois clone o projeto:

```bash
sudo mkdir -p /var/www
sudo chown -R "$USER":"$USER" /var/www
cd /var/www
git clone URL_DO_SEU_REPOSITORIO sua-barbearia
cd sua-barbearia
```

## 2. Variáveis de produção

Crie `apps/backend/.env.production` com, no mínimo:

```env
NODE_ENV=production
PORT=7192
DATABASE_URL=postgresql://usuario:senha@127.0.0.1:5432/sua_barbearia
ADMIN_JWT_SECRET=troque-por-uma-chave-grande
CUSTOMER_JWT_SECRET=troque-por-outra-chave-grande
```

Antes do build, configure a URL pública da API nos apps:

```bash
printf 'VITE_API_URL=https://api.seudominio.com.br\n' > apps/frontend/.env.production
printf 'VITE_API_URL=https://api.seudominio.com.br\nVITE_FRONTEND_URL=https://app.seudominio.com.br\n' > apps/admin/.env.production
```

## 3. Build e banco

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm --filter @barber/backend prisma:deploy
pnpm build
```

## 4. Subir a API com PM2

```bash
pm2 start deploy/ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

Execute o comando que o `pm2 startup` imprimir para o serviço subir novamente após reboot.

## 5. Configurar o Nginx

```bash
sudo cp deploy/nginx-vps.conf.example /etc/nginx/sites-available/sua-barbearia.conf
sudo sed -i 's/seudominio.com.br/seu-dominio-real.com.br/g' /etc/nginx/sites-available/sua-barbearia.conf
sudo ln -s /etc/nginx/sites-available/sua-barbearia.conf /etc/nginx/sites-enabled/sua-barbearia.conf
sudo nginx -t
sudo systemctl reload nginx
```

Configure no DNS os registros `@`, `www`, `app`, `admin` e `api` apontando para o IP da VPS. Depois ative HTTPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio-real.com.br -d www.seu-dominio-real.com.br -d app.seu-dominio-real.com.br -d admin.seu-dominio-real.com.br -d api.seu-dominio-real.com.br
```

## Atualizar uma versão

```bash
cd /var/www/sua-barbearia
git pull
pnpm install --frozen-lockfile
pnpm --filter @barber/backend prisma:deploy
pnpm build
pm2 restart sua-barbearia-api --update-env
sudo nginx -t && sudo systemctl reload nginx
```

Verificação rápida:

```bash
pm2 status
pm2 logs sua-barbearia-api --lines 100
curl -I https://api.seu-dominio-real.com.br/
```
