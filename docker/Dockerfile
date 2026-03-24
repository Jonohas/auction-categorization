FROM oven/bun:1-alpine AS base

FROM base AS dependencies

WORKDIR /deps

COPY package.json bun.lock ./
COPY packages/client/package.json ./packages/client/
COPY packages/server/package.json ./packages/server/

RUN bun i

FROM base AS frontend

WORKDIR /build

# Copy client source files and root node_modules (for hoisted deps in workspace)
COPY packages/client/ ./packages/client/
COPY --from=dependencies /deps/node_modules/ ./node_modules/
COPY --from=dependencies /deps/packages/client/node_modules ./packages/client/node_modules

WORKDIR /build/packages/client

RUN bun run build

FROM base AS backend

# ensure conditionals relying on NODE_ENV=production are included in the final build
ARG NODE_ENV=production

WORKDIR /build

# Copy server source files and root node_modules (for hoisted deps in workspace)
COPY packages/server/ ./packages/server/
COPY --from=dependencies /deps/node_modules/ ./node_modules/
COPY --from=dependencies /deps/packages/server/node_modules ./packages/server/node_modules

WORKDIR /build/packages/server

RUN bun build src/index.ts --outdir dist --target bun --external drizzle

FROM base AS production

ENV RUNTIME_DIR=/app

WORKDIR /app

COPY --from=frontend /build/packages/client/dist ./dist
COPY --from=backend /build/packages/server/dist/ .

# drizzle setup
COPY package.json .
COPY packages/server/drizzle ./drizzle
COPY packages/server/db ./db

RUN bun add drizzle-kit@latest &&\
    mkdir -p /drizzle &&\
    cp -r ./drizzle/* /drizzle/

COPY docker/entrypoint.sh ./

CMD [ "ash", "./entrypoint.sh" ]