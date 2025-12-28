# 🧰 Self-Hosted Deployment Guide (v2.0.0+)

## Email Receiving Principle

Use Cloudflare's email routing feature to forward all received emails to this program via Workers.

**Therefore, the self-hosted email domain must use Cloudflare for DNS resolution**

## Enable Email Routing & Create Workers

- First, enable email routing following the official process

- Create a Worker, you can choose any template

![workers-create](doc/workers-create.webp)

After creation, click `Code editor` to edit the code, paste the code from [here](doc/workers.js), replace the domain `mail.sunls.de` with your own, and don't forget to click `Save and deploy` to deploy:

![workers-edit](doc/workers-edit.webp)

- Then you need to add a `Catch-All` rule, make sure to select `Send to a Worker`, as shown:

![email-routing.png](doc/email-routing.webp)

## Environment Variables Configuration

### Database Configuration

**Currently only PostgreSQL is supported**

- `DB_HOST`: Database address
- `DB_PASS`: Database password
- `DB_NAME`: Database name, default is `tmail`

### Required
- `DOMAIN_LIST`: List of supported domains, separated by `,`, for example: `isco.eu.org,chato.eu.org`

### Optional
- `ADMIN_ADDRESS`: Administrator email address, can view all emails (default returns latest 100)
- `HOST`: Service listening address, default is `127.0.0.1`
- `PORT`: Service listening port, default is `3000`

### Analytics
- `UMAMI_ID`: Umami analytics website-id
- `UMAMI_URL`: Umami analytics script.js URL
- `UMAMI_DOMAINS`: Umami analytics only runs on specific domains, comma-separated

## Deployment

_Please modify the environment variable configuration accordingly_

### Docker

```shell
docker run --name tmail -d --restart unless-stopped -e 'DB_HOST=127.0.0.1' -e 'DB_PASS=postgres' -e 'HOST=0.0.0.0' -e 'DOMAIN_LIST=isco.eu.org,chato.eu.org' -p 3000:3000 sunls24/tmail
```

### Docker Compose & Caddy (Recommended)

_If you don't need a reverse proxy, you need to set the `HOST=0.0.0.0` environment variable_

**docker-compose.yaml**

```yaml
version: "3.0"

services:
  tmail:
    container_name: tmail
    image: sunls24/tmail:latest
    network_mode: host
    restart: unless-stopped
    environment:
      - "DB_HOST=127.0.0.1"
      - "DB_PASS=postgres"
      - "DOMAIN_LIST=isco.eu.org,chato.eu.org"
    volumes:
      - ./tmail:/app/fs
```

**Caddyfile**

```text
mail.example.com {
	encode zstd gzip
	@cache path /_astro/* /*.webp /favicon.svg
	header @cache Cache-Control "public, max-age=31536000, immutable"
	reverse_proxy 127.0.0.1:3000
}
```

