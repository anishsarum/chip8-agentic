FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/e2e/package.json apps/e2e/package.json
RUN corepack enable && pnpm install --frozen-lockfile

COPY apps/e2e apps/e2e

ENV PLAYWRIGHT_BASE_URL=http://web

CMD ["pnpm", "--filter", "@chip8/e2e", "test"]
