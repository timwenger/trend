# syntax=docker/dockerfile:1

# This is a docker file - a recipe for building an image (packaged app, runtime, dependencies).

# Build with the .NET 10 SDK, matching the project's net10.0 target framework.
# The SDK and build tools are not included in the final runtime image.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore NuGet dependencies first so Docker can cache them until the project changes.
COPY Trend.API.csproj ./
RUN dotnet restore Trend.API.csproj

# Copy source, excluding local appsettings, build outputs, and other .dockerignore entries.
COPY . ./

# Publish optimized Release files using the dependencies already restored.
# Skip a platform-specific launcher; the runtime starts the DLL with dotnet instead.
RUN dotnet publish Trend.API.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false

# Use the smaller ASP.NET Core runtime image, without the SDK or source tree.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Listen on HTTP inside Docker; Tailscale Serve handles browser-facing HTTPS.
# Cosmos and Auth0 settings are supplied by Compose at runtime, not baked in here.
ENV ASPNETCORE_HTTP_PORTS=8080
COPY --from=build /app/publish ./

# Run as the non-root application user provided by Microsoft's .NET Linux image.
USER $APP_UID

# Document the internal API port. Compose does not publish it to the host.
EXPOSE 8080

# Start the published API when the container starts; no compilation happens here.
ENTRYPOINT ["dotnet", "Trend.API.dll"]