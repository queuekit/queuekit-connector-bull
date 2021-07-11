import d from 'debug';

export interface RedisConfig {
  host: string;
  port: number;
  db: number;
  password?: string;
  tls?: Record<string, unknown>;
}

export const debug = d('queuekit-connector-bull');
