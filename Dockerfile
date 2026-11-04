# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS deps
WORKDIR /app

# bcrypt may need native compilation when a matching prebuilt binary is not
# available for the target architecture.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --include=dev

FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# `output: "standalone"` supplies the server and only its required production
# dependencies. Runtime secrets are provided with `docker run --env-file` or
# the deployment platform and are never copied into this image.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Persistent storage for MRD (Medical Records) uploads. Mount a volume at
# /surakshya so uploaded files survive container restarts, rebuilds and redeploys
# (see docker-compose.yml / your PaaS "Persistent Storage" settings). The
# directory is created here with the correct ownership so a freshly-initialised
# named volume inherits it and the non-root app user can write to it. Do NOT
# mount a volume over /app — that holds the application code.
RUN mkdir -p /surakshya/mrd && chown -R nextjs:nodejs /surakshya

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/signin').then((response)=>process.exit(response.status<500?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
