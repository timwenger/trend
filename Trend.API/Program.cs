using Trend.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using Trend.API;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<TrendDbContext>(options =>
{
    // set the TrendDbContext string in appsettings.json
    // I think that it's traditionally set in that file so that the db can
    // be changed between dev and production environments
    string connectionString = builder.Configuration.GetConnectionString("TrendDbContext");
    options.UseSqlServer(connectionString);
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
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseRouting();
#region These calls must go between UseRouting and UseEndPoints
app.UseAuthentication();
app.UseAuthorization();
#endregion
app.UseEndpoints(endpoints => endpoints.MapControllers());

app.Run();
