import { readServerConfig, type ServerConfig } from './config.js';

import { createApp } from './app.js';

export async function startServer(config: ServerConfig) {
  const app = createApp();

  await app.listen(config);

  return app;
}

export function startConfiguredServer(
  environment: Record<string, string | undefined>,
) {
  return startServer(readServerConfig(environment));
}
