# Stage 1: Dependencies
FROM oven/bun:1-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN="$(cat /run/secrets/github_token)" \
    bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
# next.config.ts turns this into next/image's remotePatterns, and
# `output: 'standalone'` freezes that config into the build, so the value has
# to be present here and not only on the running container. Left unset, the
# image optimizer refuses every attachment the object store serves.
ARG NEXT_PUBLIC_STORAGE_ORIGIN

# NEXT_PUBLIC_WORKOS_REDIRECT_URI must never be added here. Next inlines a
# NEXT_PUBLIC_ value present at build into the bundle, which would freeze one
# stack's callback URL into every container started from this image. Left
# unset, the app reads it when the server runs (lib/auth/workos/settings.ts),
# and AUTH_PROVIDER and the other WORKOS_* variables are run-time only as well.

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_STORAGE_ORIGIN=${NEXT_PUBLIC_STORAGE_ORIGIN}

RUN bun run build

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk update && apk add --no-cache ca-certificates && update-ca-certificates

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
