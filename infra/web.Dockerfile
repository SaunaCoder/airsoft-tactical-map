# SvelteKit app built with adapter-node. All web deps are devDependencies, so the build bundles them
# and the runtime image needs no node_modules.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g "$(node -p "require('./package.json').packageManager")"
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter @airsoft/web build

FROM node:24-alpine
WORKDIR /app
COPY --from=build /app/apps/web/build build
# Only for "type": "module"; there are no runtime dependencies to install.
COPY --from=build /app/apps/web/package.json package.json
# Behind nginx: take the public origin from the forwarded headers.
ENV NODE_ENV=production PORT=3000 PROTOCOL_HEADER=x-forwarded-proto HOST_HEADER=x-forwarded-host
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://localhost:3000/').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "build"]
