# syntax=docker/dockerfile:1

FROM node:24-trixie-slim AS base
# pnpm version comes from package.json "packageManager".
# Corepack is bundled up to Node 24; it is no longer shipped from Node 25.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY package.json ./
RUN corepack enable && corepack install

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile
COPY . .

# Build-time configuration (passed by Dokku with `docker-options:add ... build --build-arg NAME`).
# NEXT_PUBLIC_* are inlined into the browser bundle, so they must exist at build time.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_AUTH_PROVIDER
ARG NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FEATURE_STORE

# Server-side modes: 
ARG PANEL_API_URL
ARG API_MODE
ARG API_MODE_AUTH
ARG API_MODE_USERS
ARG API_MODE_PROJECTS
ARG API_MODE_MEDIA
ARG API_MODE_PORTFOLIO
ARG API_MODE_PRODUCTION
ARG API_MODE_PUBLICATION
ARG API_MODE_DASHBOARD

# Args that were not passed arrive as empty strings; unset them so the zod defaults apply
# (an empty API_MODE_* would fail z.enum(["mock","real"])).
RUN for v in $(env | grep -E '^(NEXT_PUBLIC_[A-Z_]+|PANEL_API_URL|API_MODE[A-Z_]*)=$' | cut -d= -f1); do unset "$v"; done; \
  pnpm build

FROM node:24-trixie-slim AS runtime
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  PORT=3000 \
  HOSTNAME=0.0.0.0
WORKDIR /app
# Standalone output: server.js + traced node_modules. Static assets and public/ are copied apart.
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
# Exec form: node is PID 1 and receives SIGTERM.
CMD ["node", "server.js"]
