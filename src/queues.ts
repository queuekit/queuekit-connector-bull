import Bull from 'bull';
import { Redis } from 'ioredis';
import { Socket } from 'socket.io-client';
import { registerEventHandler } from './event-handlers';
import { RedisConfig } from './utils';

export interface Queue {
  key: string;
  name: string;
  prefix: string;
  bull: Bull.Queue;
}

// eslint-disable-next-line import/no-mutable-exports
export let queueCache: Queue[] = [];

const getSkeletonQueues = async ({ redis }: { redis: Redis }) => {
  const keys: string[] = await redis.keys('*:*:id');

  const queues = keys.map((key) => {
    const keyParts = key.split(':');
    const queuePrefix = keyParts[0];
    const queueName = keyParts[1];
    const queue = {
      key: `${queuePrefix}:${queueName}`,
      name: queueName,
      prefix: queuePrefix,
    };
    return queue;
  });

  return queues;
};

export const getQueue = ({
  name,
  prefix,
}: {
  name: string;
  prefix: string;
}) => {
  const queue = queueCache.find((q) => q.name === name && q.prefix === prefix);
  if (!queue) {
    throw new Error('Queue not found.');
  }
  return queue;
};

export const updateQueuesCache = async ({
  apiKey,
  redis,
  redisConfig,
  socket,
}: {
  apiKey: string;
  redis: Redis;
  redisConfig: RedisConfig;
  socket: Socket;
}) => {
  const cachedQueues = queueCache;
  const queues = await getSkeletonQueues({ redis });

  const orphanedQueues = cachedQueues.filter(
    (queue) => !queues.map((q) => q.key).includes(queue.key),
  );
  await Promise.all(
    orphanedQueues.map(async (queue) => {
      console.log(`Removing orphaned queue from cache with key: ${queue.key}`);
      socket.emit('remove-queue', {
        queue: { name: queue.name, prefix: queue.prefix, key: queue.key },
      });
      await queue.bull.close();
    }),
  );

  const activeCachedQueues = cachedQueues.filter((queue) =>
    queues.map((q) => q.key).includes(queue.key),
  );
  const newActiveQueues = queues
    .filter(
      (q) => !activeCachedQueues.map((queue) => queue.key).includes(q.key),
    )
    .map((q) => {
      console.log(`Caching new queue with key: ${q.key}`);
      const queue: Queue = {
        ...q,
        bull: new Bull(q.name, {
          prefix: q.prefix,
          redis: {
            host: redisConfig.host,
            port: redisConfig.port,
            db: redisConfig.db,
            password: redisConfig.password,
          },
        }),
      };

      socket.emit('upsert-queue', {
        queue: { name: queue.name, prefix: queue.prefix, key: queue.key },
      });

      registerEventHandler({ queue, socket, apiKey });

      return queue;
    });
  const allActiveQueues = [...activeCachedQueues, ...newActiveQueues];
  queueCache = allActiveQueues;
};
