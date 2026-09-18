# CHIP-8 Agentic Emulator guidance

- Use the Node version in `.nvmrc` and pnpm declared in `package.json`.
- Follow TDD: add a focused failing test, verify the failure, make the smallest implementation change, then re-run the focused and full suites.
- In non-interactive environments, prefix pnpm commands with `CI=true`.
- Before reporting a task complete, run:
  - `CI=true pnpm test`
  - `CI=true pnpm typecheck`
  - `CI=true pnpm lint`
  - `CI=true pnpm format:check`
- Keep emulator behavior in shared/core packages; API and web packages communicate only through exported contracts.
