# trend
 trend your monthly transactions for a better understanding of your finances


## Development getting started

### The Trend.API backend app
- install Visual studio with .NET 10
- Ctrl Shift B to build the solution
- push your changes to the production branch to kick off the github action to publish

### The webapp (angular)
- Install Node 20, 22, or 24
- cd webapp
- Install cli globally on your machine: npm install -g @angular/cli@latest
- install project dependencies: npm install
- starts the dev server with hot reloading: npm start

Publish:
- manually:
    - create a production build: ng build
    - then copy the contents
- automatically:
    - push to production branch to kick off the github action.
