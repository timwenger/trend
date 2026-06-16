# trend
 trend your monthly transactions for a better understanding of your finances


## Development getting started

### The Trend.API backend app
- install Visual studio with .NET 10
#### development deployment
- setup your appsettings configuration:
    - duplicate `appsettings.json.example` and rename it to `appsettings.json`
    - fill in your actual database connection string, Auth0 domain, and API identifier
    - this file is in .gitignore to ensure secrets are not committed

- Hit one of the Visual Studio green arrows to run or debug the server, which listens on: https://localhost:7247

#### Production deployment
- The production API is deployed to Azure Web App via GitHub Actions when you push to the `production` branch
- **There's no point to create `appsettings.Production.json`** — production configuration is managed via Azure App Service settings:
  - Go to Azure Portal > Your app Service > API > CORS, and add the webapp's url to the Allowed Origins list
  - Go to Azure Portal > Your app Service > Settings > Environment variables, and add the following (Note the double _ _ between json nested layers)
    - `DbContext__COSMOS_ENDPOINT`
    - `DbContext__COSMOS_KEY`
    - `Auth0__Domain`
    - `Auth0__ApiIdentifier`

### The webapp (angular)
- Install Node 20, 22, or 24
- `cd webapp`
- Install cli globally on your machine: `npm install -g @angular/cli@latest`
- install project dependencies: `npm install --legacy-peer-deps` (legacy peer deps needed while deps like prime aren't yet compatible with Angular 22)
- starts the dev server with hot reloading: `npm start`

Tests:
- Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

Publish:
- manually:
    - create a production build: `ng build`
    - then copy the contents from the `dist/` directory
- automatically:
    - push to production branch to kick off the github action.
