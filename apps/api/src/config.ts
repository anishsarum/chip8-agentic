export type ServerConfig = {
  host: string;
  port: number;
};

export function readServerConfig(
  environment: Record<string, string | undefined>,
): ServerConfig {
  return {
    host: environment.API_HOST ?? '0.0.0.0',
    port: Number(environment.API_PORT ?? '3000'),
  };
}
