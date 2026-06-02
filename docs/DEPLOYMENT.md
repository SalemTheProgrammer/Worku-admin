# Worku-admin Deployment

Worku-admin is an Angular SPA. It runs as a single container behind Worku's
existing nginx, which terminates TLS for `admin.worku.tn` with a Let's Encrypt
certificate.

- **App container:** `worku-admin` (image built from this repo's `Dockerfile`,
  internally an `nginx:alpine` serving the built `dist/`)
- **Edge TLS:** the `worku-nginx` container in the Worku repo
- **Shared docker network:** `worku-network` (external, created once)
- **Install path on VPS:** `/var/www/Worku-admin`
- **Backend URL (prod):** `https://api.worku.tn` (see `src/environments/environment.prod.ts`)
- **Public URL:** `https://admin.worku.tn`

## One-time setup

### 1. DNS

Add an `A` record at your DNS provider:

```
admin.worku.tn   A   31.97.54.244
```

Wait for it to propagate (`dig +short admin.worku.tn` should return the VPS IP).

### 2. VPS bootstrap

SSH to the VPS as a user with docker access:

```bash
ssh root@31.97.54.244

# Clone the repo to the install path
mkdir -p /var/www
cd /var/www
git clone git@github.com:SalemTheProgrammer/Worku-admin.git
cd Worku-admin

# Ensure the shared docker network exists (created by Worku originally)
docker network inspect worku-network >/dev/null 2>&1 \
  || docker network create worku-network
```

### 3. Issue the Let's Encrypt certificate

Worku's nginx serves ACME challenges from `/var/www/certbot`. Run certbot in
webroot mode using the same path:

```bash
# Stop briefly is NOT required if Worku nginx is already running and serving
# the admin.worku.tn HTTP server block. If it isn't yet, do step 4 first, then
# come back here.

docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/Worku/certbot/www:/var/www/certbot \
  certbot/certbot:latest \
  certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d admin.worku.tn \
  --email admin@worku.tn --agree-tos --no-eff-email
```

Certs land in `/etc/letsencrypt/live/admin.worku.tn/{fullchain,privkey}.pem`,
which is the path the new nginx server block in `Worku/nginx.conf` references.

### 4. First deploy (from VPS)

```bash
cd /var/www/Worku-admin
docker compose -f docker-compose.prod.yml up -d --build
```

Then reload Worku's nginx so it picks up the new admin server block + upstream:

```bash
docker exec worku-nginx nginx -t
docker exec worku-nginx nginx -s reload
```

Verify:

```bash
# Container running and healthy
docker ps --filter "name=worku-admin"

# Internal reachability from edge nginx
docker exec worku-nginx wget -qO- http://worku-admin/healthz

# Public HTTPS
curl -I https://admin.worku.tn/healthz
```

## Deploying a new version

Deploys are manual — no GitHub Actions. After pushing changes to `main`:

```bash
ssh root@31.97.54.244
cd /var/www/Worku-admin
./scripts/deploy.sh
```

`scripts/deploy.sh` does:

1. `git fetch && git reset --hard origin/main` in `/var/www/Worku-admin`
2. Ensures `worku-network` exists
3. `docker compose -f docker-compose.prod.yml up -d --build`
4. Prunes dangling images
5. Reloads Worku's nginx if it's running (picks up the admin upstream)

If you prefer to run the steps by hand:

```bash
cd /var/www/Worku-admin
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker exec worku-nginx nginx -s reload    # only needed after nginx.conf changes
```

## Useful commands

```bash
# Logs
docker logs -f worku-admin

# Restart admin only
docker compose -f docker-compose.prod.yml restart

# Force rebuild
docker compose -f docker-compose.prod.yml up -d --build --force-recreate

# Stop
docker compose -f docker-compose.prod.yml down

# Edge nginx logs (errors that affect admin.worku.tn show up here)
docker logs --tail 200 worku-nginx
```

## Rollback

```bash
cd /var/www/Worku-admin
git log --oneline -10                # find the commit to roll back to
git reset --hard <good-sha>
docker compose -f docker-compose.prod.yml up -d --build
```

## Notes

- The admin container speaks **plain HTTP on port 80 internally** — it is not
  exposed to the host (no `ports:` in compose, only `expose:`). TLS is
  terminated by `worku-nginx`.
- Certificate renewal is handled by the same certbot setup Worku uses; the
  admin cert auto-renews alongside the others.
- The admin container joins the **`worku-network`** external network so
  `worku-nginx` can resolve it by service name (`worku-admin`).
