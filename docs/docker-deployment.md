# Docker Deployment

## Architecture

Trend is one Compose project (`trend`) with two unprivileged containers:

```text
Browser on Tailscale -> Tailscale Serve (HTTPS)
                           -> 127.0.0.1:8080 -> trend-webapp (Nginx :8080)
                                                 /api/* -> trend-api (:8080)
                                                               -> Azure Cosmos DB
```

The Angular 22 SPA is compiled with Node 24 and served from static files. The API
targets .NET 10 and is published using the .NET 10 SDK into an ASP.NET 10 runtime
image. Neither SDK nor Node/npm is in the final runtime images.

Only Nginx has a published port, bound to the Linux host's loopback address.
Tailscale runs directly on that host and proxies to this HTTP listener. It manages
the browser-facing HTTPS certificate; Nginx needs no certificate files. The API
has no host port. Compose supplies its default bridge network and DNS;
Nginx resolves `trend-api` internally, including after API container replacement.
Browser requests use same-origin `/api/*`, never a Docker-only hostname. SPA routes
such as `/transactions` fall back to `index.html`; API errors do not.
Both services use `restart: unless-stopped`. Docker must start at boot; explicitly
stopped containers remain stopped until you start them again.

## Tailscale Serve And Auth0

Tailscale must already be running directly on the Linux server with MagicDNS and
HTTPS certificates enabled. After starting Compose, check for existing Serve routes:

```sh
sudo tailscale serve status
```

If HTTPS port 443 already serves another application, do not overwrite that route;
choose a different Serve HTTPS port and include it in the browser and Auth0 URLs.
Otherwise configure Trend:

```sh
sudo tailscale serve --bg --https=443 http://127.0.0.1:8080
sudo tailscale serve status
```

If you change `TREND_PORT`, use that port in the proxy target instead of `8080`.
Serve prints the HTTPS URL, such as `https://server.your-tailnet.ts.net`.
Use that full hostname, not the short MagicDNS name or server IP. It provides
the trusted HTTPS secure context required by Auth0, without installing certificates
on client devices. No Pi-hole DNS record, domain purchase, or manual certificate
renewal is needed. `--bg` persists the Serve configuration across restarts.

Client devices must be connected to Tailscale, including on home Wi-Fi, and your
tailnet access rules must allow them to reach the server's HTTPS port. Use Serve,
not Funnel: this deployment is private to your tailnet, not publicly accessible.

Production keeps the existing public Auth0 tenant, SPA client ID, audience, and
scopes in `webapp/src/environments/environment.prod.ts`. These are public browser
settings, not client secrets. The callback is now the current browser origin plus
`/transactions`; logout URLs also use the current origin. In your existing Auth0
SPA application configure:

- Allowed Callback URLs: `https://YOUR-TAILSCALE-HOSTNAME/transactions`.
- Allowed Logout URLs: `https://YOUR-TAILSCALE-HOSTNAME/`.
- Allowed Web Origins: `https://YOUR-TAILSCALE-HOSTNAME`.

Replace the hostname with the exact one printed by Serve. Add these entries
alongside the existing Azure entries; do not remove the Azure entries.
The backend Auth0 domain and audience must match the existing production SPA.
If changing Auth0 tenants/clients, update the production environment file and
rebuild as well as updating the backend variables. Preserve API permissions and
user grants. Do not put a client secret in this SPA.

## Initial Deployment

Docker Engine with BuildKit and the modern Compose plugin must already be installed.
Tailscale Serve is configured on the host as described above, not in Compose.
Run on the Linux server:

```sh
git clone https://github.com/timwenger/trend.git
cd trend
git checkout LocallyHosted
cp .env.example .env
chmod 600 .env
nano .env
docker compose config --quiet
docker compose build
docker compose up -d
docker compose ps
```

These changes must first be committed and pushed by you to the branch you deploy.
This task does not commit or push. `LocallyHosted` is the branch on which this
deployment change was prepared; use `production` instead once you merge it there.
Do not run a second checkout over your local uncommitted work.

Edit these values in `.env` before building/starting:

| Variable | Value |
| --- | --- |
| `TREND_LAN_IP` | Set to `127.0.0.1`. Despite the legacy name, this controls the bind address; keep it loopback-only for Tailscale Serve. |
| `TREND_PORT` | Local frontend port, default `8080`. Must match the Tailscale Serve proxy target. |
| `COSMOS_ENDPOINT` | Existing Azure Cosmos account endpoint. |
| `COSMOS_KEY` | Existing Cosmos account key. |
| `AUTH0_DOMAIN` | Existing tenant hostname, no `https://` or trailing slash. Match the SPA production environment. |
| `AUTH0_API_IDENTIFIER` | Existing API audience. Match the SPA production environment. |
| `PRIMEUI_LICENSE` | Existing PrimeUI browser license, or leave empty if not required. |

Copy Cosmos/Auth0 backend values from your existing App Service settings or your
local configuration, without committing them. Compose maps them to the existing
ASP.NET keys `DbContext__COSMOS_ENDPOINT`, `DbContext__COSMOS_KEY`, `Auth0__Domain`,
and `Auth0__ApiIdentifier`. The database ID remains `trend-nosql-db`; existing
containers, queries, data, and Auth0 authorization policies are unchanged.
No database is deployed or migrated.

Quote values containing special characters using Compose dotenv syntax, preferably
single quotes for literal `$` characters. `.env` is ignored by Git. Do not share
the output of `docker compose config` without `--quiet`: it contains resolved
credentials. Docker administrators can inspect backend environment variables;
restrict access to the server and Docker daemon accordingly.

Local API appsettings, frontend `.env.local`, generated license files, and build
outputs are excluded from Docker build contexts. PrimeUI's license is passed only
to the frontend build via a BuildKit secret, not a Docker build argument or backend
runtime variable. The existing build script embeds the browser license in the SPA
as required by PrimeUI; it is therefore visible to browser users. Never use this
setting for Cosmos keys or private server secrets. When changing a build secret,
use `docker compose build --no-cache trend-webapp` because secret contents do not
invalidate Docker's build cache.

The API runs in Production on HTTP internally; Compose disables HTTPS redirection
with `HttpsRedirection__Enabled=false`. Outside Compose the existing default of
HTTPS redirection is preserved. CORS middleware, controller attributes, and settings
have been removed: the SPA and API share the same browser origin through Nginx.
Auth0 authentication and authorization remain enforced by the API.

The server needs outbound Internet access to Cosmos DB and Auth0, and build-time
access to image/package registries. If Cosmos has firewall/network restrictions,
allow your home's outbound public IP using your existing Cosmos access policy.
This is outbound database access, not opening your server to the Internet. No
router forwarding, public web listener, or Azure hosting is added. Keep the Compose
port bound to loopback and use Tailscale access rules to control remote access.

## Operations

From the repository directory on the server:

```sh
docker compose ps
docker compose logs --tail=100 -f
docker compose logs --tail=100 -f trend-api
docker compose logs --tail=100 -f trend-webapp
```

Browse to the HTTPS URL printed by Serve from a device connected to your tailnet.
These checks should return the SPA and an HTTP 401 from the protected API, not an
Nginx 502 or an HTTPS redirect:

```sh
curl -I https://YOUR-TAILSCALE-HOSTNAME/transactions
curl -i https://YOUR-TAILSCALE-HOSTNAME/api/categories
```

The 401 checks proxying and authentication enforcement, not Cosmos connectivity.
Sign in and check existing categories and transactions to verify Cosmos access.
The backend port must not be separately reachable on the LAN. Azure and Docker
can run alongside each other; writes use the same live data when configured with
the same Cosmos account and database.

To update, with a clean checkout containing your deployment changes:

```sh
git pull --ff-only
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Changing backend `.env` configuration requires `docker compose up -d` to recreate
the service, not just `docker compose restart`. To refresh base images, use
`docker compose build --pull` followed by `docker compose up -d`.

```sh
docker compose stop
docker compose start
docker compose down
```

`stop` preserves containers; `start` resumes them. `down` removes this application's
containers and network, not the Azure database. There are no local database volumes.
Images and your local `.env` remain on disk.

## GitHub Actions And Existing Azure Hosting

The two existing workflow files retain their `production` push and manual triggers,
production build/publish artifact uploads, and now run the existing tests. The API
build runs on Linux to match the deployment target. Azure login, App Service deploy
jobs, deployment environments, and publish-profile references are removed. There
is no automatic home-server deployment yet.

As a separate step, choose a self-hosted runner, SSH deployment, or a container
registry plus a pull/update mechanism. Then decide credentials, runner/network
access, image versioning, deployment protection, and rollback before wiring CD.
Do not open public inbound access just for CI.

Changing YAML does not stop existing App Services. Leave the existing Azure
frontend and API running alongside this deployment; no Azure resources or secrets
need to be removed for this setup. Preserve Cosmos DB and Auth0. Historical Azure
ServiceDependencies and the unused static `web.config` are not active deployments
and are left untouched.