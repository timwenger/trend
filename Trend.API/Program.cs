using Trend.API.Models;
using Microsoft.EntityFrameworkCore;

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

//https://docs.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-6.0#attr
builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularDebugging",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200")
            .AllowAnyMethod()
            .AllowAnyHeader();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.UseCors();

app.MapControllers();

app.Run();
