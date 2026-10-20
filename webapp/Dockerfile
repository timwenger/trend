# syntax=docker/dockerfile:1

# This is a docker file - a recipe for building an image (packaged app, runtime, dependencies).

# Build Angular with Node; this stage's tooling is not included in the final image.
FROM node:24-alpine AS build
WORKDIR /app

# Install locked dependencies, including build tools. Docker can cache this step
# independently of source changes because only the package manifests are copied.
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files, excluding local secrets and outputs listed in .dockerignore.
COPY . ./

# Supply the PrimeUI license as a temporary BuildKit secret during compilation.
# The build script embeds this browser license in the generated JavaScript;
# never use this mechanism to embed private server credentials in the frontend.
RUN --mount=type=secret,id=primeui_license,env=PRIMEUI_LICENSE npm run build -- --configuration production

# Start a separate, non-root Nginx image: no Node, npm, or Angular build tools.
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

# Configure SPA routing and forward /api requests to the trend-api service.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy only the compiled website from the build stage into Nginx's web directory.
COPY --from=build /app/dist/webapp/browser /usr/share/nginx/html

# Document Nginx's internal HTTP port; Compose controls host port publication.
# The base image starts Nginx when the container starts; it does not rebuild Angular.

# 8080 is available for the server and the web app because they're in different containers
EXPOSE 8080