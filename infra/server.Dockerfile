# Express + Socket.IO server. Runs TypeScript directly via Node's type stripping: no build step.
FROM node:24-alpine
WORKDIR /app

# pnpm at the exact version pinned in the root package.json (corepack is not guaranteed in newer Node images).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g "$(node -p "require('./package.json').packageManager")"

# Production deps of the server and its workspace dependency (@airsoft/shared) only.
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --prod --filter @airsoft/server...

# @airsoft/shared stays a workspace symlink to packages/shared: Node refuses to strip types inside
# node_modules, but resolves the symlink to its real path outside it.
COPY packages/shared/src packages/shared/src
COPY apps/server/src apps/server/src

ENV NODE_ENV=production PORT=3000
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "apps/server/src/main.ts"]
