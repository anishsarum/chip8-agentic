FROM node:24-alpine AS build

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/core/package.json packages/core/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/tsconfig.json packages/contracts/tsconfig.json
COPY packages/core/tsconfig.json packages/core/tsconfig.json
COPY apps/api/tsconfig.json apps/api/tsconfig.json
COPY tsconfig.json ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY packages/contracts/src packages/contracts/src
COPY packages/core/src packages/core/src
COPY apps/api/src apps/api/src
RUN pnpm --filter @chip8/contracts build && pnpm --filter @chip8/core build && pnpm --filter @chip8/api build && pnpm --filter @chip8/api --prod deploy --legacy /production

FROM node:24-alpine

WORKDIR /app
ENV API_HOST=0.0.0.0
ENV API_PORT=3000

COPY --from=build /production ./
COPY --from=build /workspace/packages/contracts /workspace/packages/contracts
COPY --from=build /workspace/packages/core /workspace/packages/core
COPY --from=build /workspace/apps/api/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
