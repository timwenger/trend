# trend
 trend your monthly transactions for a better understanding of your finances

## Linux Server Deployment

Follow the [Linux Docker deployment guide](docs/docker-deployment.md) to get the
complete application running on your server:

1. [Clone, configure credentials, build, and start both containers](docs/docker-deployment.md#initial-deployment).
2. [Enable Tailscale Serve HTTPS and configure Auth0 login](docs/docker-deployment.md#tailscale-serve-and-auth0).
3. [Check status and logs, update the app, or stop it](docs/docker-deployment.md#operations).

Run the frontend and API as one Docker Compose application on a Linux server,
with private HTTPS access through Tailscale Serve. Nginx serves Angular and proxies
same-origin API requests; Tailscale manages the HTTPS certificate for Auth0 login.
Cosmos DB remains in Azure. GitHub Actions validate builds and tests; they no longer deploy to Azure.
Existing Azure App Services can remain running alongside the Docker deployment.

## Development getting started

### The Trend.API backend app
- install Visual studio with .NET 10
#### development deployment
- setup your appsettings configuration:
    - duplicate `appsettings.json.example` and rename it to `appsettings.json`
    - fill in your actual database connection string, Auth0 domain, and API identifier
    - this file is in .gitignore to ensure secrets are not committed

- Hit one of the Visual Studio green arrows to run or debug the server, which listens on: https://localhost:7247

### The webapp (angular)
- Install Node 24
- `cd webapp`
- Install cli globally on your machine: `npm install -g @angular/cli@latest`
- Install project dependencies: `npm install`
- Start the dev server with hot reloading: `npm start`

Open `http://localhost:4200` with the backend running or debugging at
`https://localhost:7247`. The Angular development server proxies `/api/**` to the
backend using [proxy.conf.json](webapp/proxy.conf.json), so API calls and Auth0
tokens use the frontend's origin without API CORS. Backend breakpoints still work.
The proxy accepts the local development certificate; this setting applies only
to the development server, not production HTTPS.

Tests:
- Run `npm test` to execute the unit tests via [Vitest](https://vitest.dev/).

Production build: `npm run build -- --configuration production` writes static files
to `webapp/dist/webapp/browser`. The production container serves these with Nginx,
not the Angular development server. This command builds only the frontend; for
the full Linux server deployment, follow the [deployment guide](docs/docker-deployment.md).
