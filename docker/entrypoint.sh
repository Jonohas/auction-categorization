#!/bin/ash

export NODE_ENV=${NODE_ENV:-production}

# Copy drizzle migrations to ensure latest versions are used
# (preserves any existing database files)
echo "[ENTRYPOINT] Copying drizzle migrations from /drizzle..."
rm -rf ./drizzle
cp -r /drizzle ./drizzle

echo "[ENTRYPOINT] Running drizzle migrations..."
bunx drizzle-kit migrate

echo "[ENTRYPOINT] Migrations handled, starting application."
exec bun index.js