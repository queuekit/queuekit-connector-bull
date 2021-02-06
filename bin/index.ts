#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import program from 'commander';
import Redis from 'ioredis';
import { io } from 'socket.io-client';
import {
  setIntervalAsync,
  SetIntervalAsyncTimer,
  clearIntervalAsync,
} from 'set-interval-async/dynamic';
// @ts-ignore
import redisUrlParse from 'redis-url-parse';
import { RedisConfig } from '../src/utils';
import { updateQueuesCache } from '../src/queues';
import { registerRequestHandlers } from '../src/request-handlers';

const pkg = require(`../package.json`);

program.version(pkg.version);

program
  .requiredOption(
    '-n, --connector-name <connection-name>',
    "Connector name. Defaults to 'Default connector'.",
    process.env.CONNECTOR_NAME || 'Default connector',
  )
  .requiredOption(
    '-a, --api-key <api-key>',
    'QueueMetrics.io organization API key. Get this from https://dashboard.queuemetrics.io',
    process.env.API_KEY,
  )
  .option(
    '-h, --host <host>',
    'Redis host. Defaults to localhost.',
    process.env.REDIS_HOST || 'localhost',
  )
  .option(
    '-p, --port <port>',
    'Redis port. Defaults to 6379.',
    process.env.REDIS_PORT || '6379',
  )
  .option(
    '-d, --database <database>',
    'Redis database. Defaults to 0.',
    process.env.REDIS_DB || '0',
  )
  .option(
    '-w, --password <password>',
    'Redis password, can also be supplied by setting REDIS_PASSWORD environment variable.',
    process.env.REDIS_PASSWORD,
  )
  .option('--tls [tls]', 'Activate secured TLS connection to Redis')
  .option('-u, --uri [uri]', 'Redis URI.', process.env.REDIS_URI)
  .option(
    '-s, --sentinels [host:port]',
    'Comma-separated list of sentinel host/port pairs',
    process.env.REDIS_SENTINELS,
  )
  .option(
    '-m, --master [name]',
    'Name of master node used in sentinel configuration',
    process.env.REDIS_MASTER,
  )
  .option(
    '-b, --backend <backend>',
    'QueueMetrics backend. Defaults to wss://api.queuemetrics.io',
    process.env.BACKEND || 'wss://api.queuemetrics.io',
  )
  .parse(process.argv);

(async () => {
  const opts = program.opts();

  const { connectorName } = opts;
  const { apiKey } = opts;

  const redisConfigFromUri: any = (opts.uri as string | undefined)
    ? (redisUrlParse(opts.uri) as Record<string, unknown>)
    : undefined;

  const redisConfig: RedisConfig = {
    host: redisConfigFromUri.host || opts.host,
    port: Number(String(redisConfigFromUri.port) || opts.port),
    db: Number(redisConfigFromUri.database || opts.database),
    password: redisConfigFromUri.password || opts.password,
    tls:
      program.tls || opts.uri?.startsWith('rediss://')
        ? {
            rejectUnauthorized: false,
            requestCert: true,
            agent: false,
          }
        : undefined,
  };

  const redis = new Redis({
    host: redisConfig.host,
    port: redisConfig.port,
    db: redisConfig.db,
    password: redisConfig.password,
    tls: redisConfig.tls,
  });

  const websocketUri = `${program.backend}`;

  console.log(`Attempting to connect to ${websocketUri}`);

  const socket = io(websocketUri, { reconnectionDelayMax: 1000 });

  let timer: SetIntervalAsyncTimer;

  registerRequestHandlers({ redis, socket });

  socket.on('connect', () => {
    console.log(`Socket connected to ${websocketUri}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected from ${websocketUri}`);
      if (timer) {
        clearIntervalAsync(timer);
      }
    });

    socket.emit(
      'initialize-connector-connection',
      {
        apiKey,
        connectorType: 'bull',
        connectorName,
        connectorVersion: pkg.version,
      },
      async () => {
        await updateQueuesCache({ redis, redisConfig, socket, apiKey });
        timer = setIntervalAsync(() => {
          return updateQueuesCache({ redis, redisConfig, socket, apiKey });
        }, 1000);
      },
    );
  });
})();
