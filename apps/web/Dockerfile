FROM node:24-alpine AS build

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY apps/web/package.json apps/web/package.json
RUN corepack enable && pnpm install --frozen-lockfile

COPY apps/web apps/web
RUN pnpm --filter @chip8/web build

FROM nginx:1.27-alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 80
