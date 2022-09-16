// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  auth: {
    // see this page for available properties that can be set:
    // https://auth0.github.io/auth0-angular/interfaces/auth_config.authconfig.html
    domain: 'dev-6tnv9qif.us.auth0.com',
    clientId: 'LnjwdselSHXQr9xIW8P4EuKXGA1kr1Ue',
    redirectUri: 'http://localhost:4200/transactions',
    audience: 'trend007', // Request this audience at user authentication time
    //scope: 'write:categories', // Request this scope at user authentication time
    httpInterceptor: {
      allowedList: [
        {
          // Match any request that starts with '/api/' (note the asterisk)
          uri: 'https://localhost:7247/api/*',
          tokenOptions: {
            // The attached token should target this audience
            //audience: 'trend007',
            // The attached token should have these scopes
            //scope: 'write:categories'
          }
        }
      ]
    },
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
