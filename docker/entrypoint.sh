#!/bin/ash

export NODE_ENV=${NODE_ENV:-production}

# Always copy prisma schema and migrations to ensure latest versions are used
# (preserves any existing database files)
echo "[ENTRYPOINT] Copying prisma schema and migrations from /prisma..."
cp -r /prisma/schema.prisma ./prisma/
rm -rf ./prisma/migrations
cp -r /prisma/migrations ./prisma/

echo "[ENTRYPOINT] Running prisma migrations, this might take a while."
bunx --silent prisma@6 migrate deploy

echo "[ENTRYPOINT] Migrations handled, starting application."
exec bun index.js
