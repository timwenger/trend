// this page is a copy/paste of environment.ts, except that the baseUrl and apiBaseUrl are changed.
// when compiling, it chooses which to use based on the production = true / false property


export const apiBaseUrl = 'https://trendapi20221210154024.azurewebsites.net/'
export const baseUrl = 'https://trendapp.azurewebsites.net/';

export const environment = {
  production: true,
  auth: {
    // see this page for available properties that can be set:
    // https://auth0.github.io/auth0-angular/interfaces/auth_config.authconfig.html
    domain: 'dev-6tnv9qif.us.auth0.com',
    clientId: 'LnjwdselSHXQr9xIW8P4EuKXGA1kr1Ue',
    redirectUri: baseUrl + 'transactions',
    audience: 'trend007', // Request this audience at user authentication time
    
    // this app needs to be able to write categories and transactions to the api (and indirectly to the database).
    // if, for example, a user is on the 'free account' and can only have the default categories,
    // then their user permissions will only have write:transactions. In that case, the access 
    // tokens sent to the api will not have the write:categories scope. The access token will 
    // have an intersection of the user permissions and the api permissions.
    // https://community.auth0.com/t/scopes-vs-permissions-confusion/30906/10
    // https://auth0.com/blog/permissions-privileges-and-scopes/
    scope: 'write:categories write:transactions', // Request this scope at user authentication time
    httpInterceptor: {
      allowedList: [
        {
          // Match any request that starts with '/api/' (note the asterisk)
          uri: apiBaseUrl + 'api/*',
          tokenOptions: {
            // The attached token should target this audience
            //audience: 'trend007',
            // The attached token should have these scopes
            //scope: 'write:categories write:transactions',
          }
        }
      ]
    },
  },
};