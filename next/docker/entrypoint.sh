#!/bin/sh
set -eu

if [ "${PRISMA_MIGRATE_ON_START:-true}" = "true" ]; then
  echo "Running Prisma migrations (prisma migrate deploy)..."
  node /app/node_modules/prisma/build/index.js migrate deploy --schema /app/prisma/schema.prisma
fi

exec "$@"
