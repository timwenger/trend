using Trend.API;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using Trend.API.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

string endpoint = builder.Configuration["DbContext:COSMOS_ENDPOINT"] ?? string.Empty;
string accountKey = builder.Configuration["DbContext:COSMOS_KEY"] ?? string.Empty;
TrendDbContext dbContext = new TrendDbContext(endpoint, accountKey);
builder.Services.AddSingleton<TrendDbContext>(dbContext);

//https://docs.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-6.0#attr
builder.Services.AddCors(options =>
{
    string allowedOrigins = builder.Configuration["Cors:AllowedOrigins"]?? string.Empty;

    options.AddPolicy("ProductionOrDevEnvironment",
        policy =>
        {
            policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader();
        });
});

// Auth0 Authentication
// https://auth0.com/docs/quickstart/backend/aspnet-core-webapi-2/01-authorization
string domain = $"https://{builder.Configuration["Auth0:Domain"]}/";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.Authority = domain;
    options.Audience = builder.Configuration["Auth0:ApiIdentifier"];
    options.TokenValidationParameters = new TokenValidationParameters
    {
        NameClaimType = ClaimTypes.NameIdentifier
    };
});

// Auth0 Authorization

// register the scope authorization handler
builder.Services.AddSingleton<IAuthorizationHandler, ScopeHandler>();
// the Policies below are added onto the respective Controller class (ex, CategoriesController).
// if someone wants access to an api endpoint on that controller, they will need to:
//      - Interact with an application that has that scope (The Angular Trend App requests all the scopes
//        it needs in the environment.ts file at user authentication time). Those scope requests will be 
//        be granted because it is configured to use the Auth0 Trend API which grants all scopes listed here.
//
//      - A user must also have these permissions configured in the Auth0 dashboard. The final permissions
//        granted will be those that the application AND the user has. This post has a good explanation:
//        https://community.auth0.com/t/scopes-vs-permissions-confusion/30906/10
//
// https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies?view=aspnetcore-6.0
// https://auth0.com/blog/permissions-privileges-and-scopes/
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanWriteToTransactions", policy => 
        policy.Requirements.Add(new ScopeRequirement("write:transactions", domain)));
    options.AddPolicy("CanWriteToCategories", policy => 
        policy.Requirements.Add(new ScopeRequirement("write:categories", domain)));
});


var app = builder.Build();


// Configure the HTTP request pipeline.
app.UseHttpsRedirection();
app.UseRouting();
#region These calls must go between UseRouting and UseEndPoints
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
#endregion
app.MapControllers();

app.Run();
