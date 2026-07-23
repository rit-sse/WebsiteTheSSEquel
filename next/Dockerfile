FROM node:24-bookworm-slim AS corepack

FROM node:26-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

COPY --from=corepack /usr/local/lib/node_modules/corepack /usr/local/lib/node_modules/corepack

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/* && \
    ln -s ../lib/node_modules/corepack/dist/corepack.js /usr/local/bin/corepack && \
    corepack enable && \
    corepack install --global pnpm@10.34.0

WORKDIR /workspace

# Install the workspace from its single frozen lockfile.
FROM base AS deps

ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_ENV

ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY next/package.json ./next/package.json
COPY next/scripts/check-node-version.cjs ./next/scripts/check-node-version.cjs

RUN pnpm install --frozen-lockfile

# Build the application and assemble a self-contained Prisma runtime.
FROM base AS builder

ARG DATABASE_URL
ARG GIT_COMMIT
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_ENV

ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/next/node_modules ./next/node_modules
COPY . .

# Use the commit hash passed from CI for accurate branch-specific build metadata.
RUN COMMIT_HASH="${GIT_COMMIT:-dev}" && \
    echo "COMMIT_HASH=$COMMIT_HASH" && \
    echo "$COMMIT_HASH" > /tmp/commit_hash

RUN pnpm run prisma:generate

RUN COMMIT_HASH=$(cat /tmp/commit_hash) && \
    NEXT_PUBLIC_COMMIT_HASH=$COMMIT_HASH pnpm run build

# pnpm stores packages behind symlinks. Dereference the Prisma CLI, client, and
# engine packages into a small, portable tree for startup migrations.
RUN set -eux; \
    mkdir -p /prisma-runtime/node_modules/@prisma; \
    cp -RL next/node_modules/prisma /prisma-runtime/node_modules/prisma; \
    for generated_client in node_modules/.pnpm/@prisma+client@*/node_modules/.prisma; do \
      cp -RL "$generated_client" /prisma-runtime/node_modules/.prisma; \
    done; \
    for package in node_modules/.pnpm/@prisma+*/node_modules/@prisma/*; do \
      if [ -d "$package" ]; then \
        cp -RL "$package" /prisma-runtime/node_modules/@prisma/; \
      fi; \
    done; \
    node /prisma-runtime/node_modules/prisma/build/index.js --version

# Production image, copy only the standalone app and migration runtime.
FROM base AS runner

WORKDIR /app/next

ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_ENV

ENV NODE_ENV=production
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV PRISMA_MIGRATE_ON_START=true
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /workspace/next/.next/standalone /app
COPY --from=builder --chown=nextjs:nodejs /workspace/next/.next/static /app/next/.next/static
COPY --from=builder --chown=nextjs:nodejs /workspace/next/public /app/next/public
COPY --from=builder --chown=nextjs:nodejs /workspace/next/prisma /app/next/prisma
COPY --from=builder --chown=nextjs:nodejs /prisma-runtime/node_modules /app/node_modules
COPY next/docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
