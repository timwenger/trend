# trend
 trend your monthly transactions for a better understanding of your finances


## Development getting started

### The Trend.API backend app
- install Visual studio with .NET 10
- setup your appsettings json files.
    - duplicate `appsettings.Example.json` and rename it to `appsettings.json`
    - duplicate `appsettings.Development.Example.json` and rename it to `appsettings.Development.json`
    - duplicate `appsettings.Production.Example.json` and rename it to `appsettings.Production.json`
    - make changes for the correct database, auth0 service, and CORS. These files are in the .gitignore files to ensure they are not committed so that your connection strings are not public. 

- Ctrl Shift B to build the solution
- push your changes to the production branch to kick off the github action to publish

### The webapp (angular)
- Install Node 20, 22, or 24
- `cd webapp`
- Install cli globally on your machine: `npm install -g @angular/cli@latest`
- install project dependencies: `npm install`
- starts the dev server with hot reloading: `npm start`

Tests:
- Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

Publish:
- manually:
    - create a production build: `ng build`
    - then copy the contents from the `dist/` directory
- automatically:
    - push to production branch to kick off the github action.
