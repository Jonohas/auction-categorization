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

WORKDIR /build/packages/client

RUN bunx vite build

FROM base AS backend

# ensure conditionals relying on NODE_ENV=production are included in the final build
ARG NODE_ENV=production

WORKDIR /build

# Copy server source files and root node_modules (for hoisted deps in workspace)
COPY packages/server/ ./packages/server/
COPY --from=dependencies /deps/node_modules/ ./node_modules/

WORKDIR /build/packages/server

RUN bun prisma generate

RUN bun build src/index.ts --outdir dist --target bun --external @prisma/client

FROM base AS production

ENV RUNTIME_DIR=/app

WORKDIR /app

COPY --from=frontend /build/packages/client/dist ./dist
COPY --from=backend /build/packages/server/dist/ .

# prisma you b
COPY package.json .
COPY packages/server/prisma/schema.prisma ./prisma/schema.prisma
COPY packages/server/prisma/migrations ./prisma/migrations

RUN bun add prisma@6 @prisma/client@6 &&\
    bun prisma generate &&\
    mkdir -p /prisma &&\
    cp -r ./prisma/* /prisma

COPY docker/entrypoint.sh ./

CMD [ "ash", "./entrypoint.sh" ]
