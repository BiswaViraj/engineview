# Install dependencies once and reuse for build and migrations.
FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Build the Nuxt/Nitro server. This stage keeps full dependencies so it can also
# run database migrations (see docker-compose.yml).
FROM deps AS build
COPY . .
RUN pnpm build

# Lean runtime image: just the built server output.
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
