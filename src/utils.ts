export interface RedisConfig {
  host: string;
  port: number;
  db: number;
  password?: string;
  tls?: Record<string, unknown>;
}
