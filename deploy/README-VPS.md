# Deploy simples com Docker

Este é o caminho recomendado para quem está começando. Você não precisa configurar PM2, buildar cada aplicativo separadamente nem entender GitHub Actions.

O Docker sobe tudo junto: site do cliente, painel administrativo, landing page, API e PostgreSQL.

## 1. Instale Docker na VPS

Em uma VPS Ubuntu, execute:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo systemctl enable --now docker
```

## 2. Baixe o projeto

```bash
cd /opt
sudo git clone https://github.com/teixeiradeveloperfs/barber-saas.git sua-barbearia
sudo chown -R "$USER":"$USER" /opt/sua-barbearia
cd /opt/sua-barbearia
```

## 3. Configure apenas um arquivo

```bash
cp deploy/.env.docker.example deploy/.env.docker
nano deploy/.env.docker
```

Troque obrigatoriamente:

- `SEU_IP_OU_DOMINIO` pelo IP ou domínio da VPS;
- `POSTGRES_PASSWORD` pela senha do banco;
- `ADMIN_JWT_SECRET` e `CUSTOMER_JWT_SECRET` por chaves longas;
- `ADMIN_PASSWORD` pela senha do primeiro administrador.

Se ainda não tiver domínio, use o IP da VPS. Exemplo: `http://203.0.113.10:7693`.

## 4. Suba o sistema

Ainda na raiz do projeto:

```bash
docker compose --env-file deploy/.env.docker -f deploy/docker-compose.yml up -d --build
```

A primeira execução pode demorar alguns minutos, pois o Docker baixa as imagens e compila o sistema.

## 5. Acesse

Substitua `IP_DA_VPS` pelo IP real:

- Cliente: `http://IP_DA_VPS:7693`
- Admin: `http://IP_DA_VPS:5928`
- Landing: `http://IP_DA_VPS:6400`
- API: `http://IP_DA_VPS:7192`

Abra no firewall da VPS as portas `7693`, `5928`, `6400` e `7192` se elas estiverem bloqueadas.

## Comandos do dia a dia

Ver se está rodando:

```bash
docker compose --env-file deploy/.env.docker -f deploy/docker-compose.yml ps
```

Ver os logs:

```bash
docker compose --env-file deploy/.env.docker -f deploy/docker-compose.yml logs -f app
```

Atualizar para a versão mais recente:

```bash
git pull
docker compose --env-file deploy/.env.docker -f deploy/docker-compose.yml up -d --build
```

Parar o sistema:

```bash
docker compose --env-file deploy/.env.docker -f deploy/docker-compose.yml down
```

Os dados do PostgreSQL e os uploads ficam em volumes Docker e não são apagados pelo comando `down`.

## Domínio e HTTPS

Para o primeiro deploy, acesse pelas portas acima. Quando o sistema estiver funcionando, você pode colocar um domínio e HTTPS na frente dele usando um proxy como Cloudflare, Nginx Proxy Manager ou Nginx.

Essa etapa é opcional e está documentada em [nginx-vps.conf.example](nginx-vps.conf.example). Ela não é necessária para entender ou testar o projeto.

## Solução de problemas

### O container não sobe

```bash
docker compose --env-file deploy/.env.docker -f deploy/docker-compose.yml logs app
```

Normalmente é algum valor incorreto no `deploy/.env.docker`, principalmente `DATABASE_URL` ou os segredos.

### O site abre, mas não faz login

Confira se `VITE_API_URL` aponta para o IP ou domínio da VPS, e não para `localhost`. Depois refaça o build:

```bash
docker compose --env-file deploy/.env.docker -f deploy/docker-compose.yml up -d --build
```

### Quero começar do zero

O comando abaixo remove também o banco e os uploads. Use somente se aceitar perder os dados:

```bash
docker compose --env-file deploy/.env.docker -f deploy/docker-compose.yml down -v
```
