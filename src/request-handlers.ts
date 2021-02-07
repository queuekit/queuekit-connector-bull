/* eslint-disable unicorn/consistent-function-scoping */
import { Redis } from 'ioredis';
import { Socket } from 'socket.io-client';
import { getQueue, queueCache } from './queues';

const jobStartDefault = 0;
const jobEndDefault = 100;

interface Request {
  id: string;
  path: 'getQueues' | 'getIsQueuePaused';
  data: any;
}

export const registerRequestHandlers = ({
  redis,
  socket,
}: {
  redis: Redis;
  socket: Socket;
}) => {
  const getQueues = () => {
    const queues = queueCache.map((queue) => {
      return {
        name: queue.name,
        prefix: queue.prefix,
      };
    });
    return queues;
  };

  const getIsQueuePaused = async (request: Request) => {
    const metaPausedValue = await redis.get(
      `${request.data.queuePrefix}:${request.data.queueName}:meta-paused`,
    );
    const isPaused = metaPausedValue === '1';
    return isPaused;
  };

  const getQueueJobCounts = async (request: Request) => {
    const queue = getQueue({
      name: request.data.queueName,
      prefix: request.data.queuePrefix,
    });
    const jobCounts = await queue.bull.getJobCounts();
    return jobCounts;
  };

  const getWaiting = async (request: Request) => {
    const queue = getQueue({
      name: request.data.queueName,
      prefix: request.data.queuePrefix,
    });
    const jobs = await queue.bull.getWaiting(
      request.data.start || jobStartDefault,
      request.data.end || jobEndDefault,
    );
    return jobs;
  };

  const getActive = async (request: Request) => {
    const queue = getQueue({
      name: request.data.queueName,
      prefix: request.data.queuePrefix,
    });
    const jobs = await queue.bull.getActive(
      request.data.start || jobStartDefault,
      request.data.end || jobEndDefault,
    );
    return jobs;
  };

  const getDelayed = async (request: Request) => {
    const queue = getQueue({
      name: request.data.queueName,
      prefix: request.data.queuePrefix,
    });
    const jobs = await queue.bull.getDelayed(
      request.data.start || jobStartDefault,
      request.data.end || jobEndDefault,
    );
    return jobs;
  };

  const getCompleted = async (request: Request) => {
    const queue = getQueue({
      name: request.data.queueName,
      prefix: request.data.queuePrefix,
    });
    const jobs = await queue.bull.getCompleted(
      request.data.start || jobStartDefault,
      request.data.end || jobEndDefault,
    );
    return jobs;
  };

  const getFailed = async (request: Request) => {
    const queue = getQueue({
      name: request.data.queueName,
      prefix: request.data.queuePrefix,
    });
    const jobs = await queue.bull.getFailed(
      request.data.start || jobStartDefault,
      request.data.end || jobEndDefault,
    );
    return jobs;
  };

  const getJob = async (request: Request) => {
    const queue = getQueue({
      name: request.data.queueName,
      prefix: request.data.queuePrefix,
    });
    const job = await queue.bull.getJob(request.data.jobId);
    const state = await job?.getState();
    return { ...job, state };
  };

  const pauseQueue = async (request: Request) => {
    const queue = getQueue({
      name: request.data.queueName,
      prefix: request.data.queuePrefix,
    });
    await queue.bull.pause();
    return queue;
  };

  const resumeQueue = async (request: Request) => {
    const queue = getQueue({
      name: request.data.queueName,
      prefix: request.data.queuePrefix,
    });
    await queue.bull.resume();
    return queue;
  };

  const cleanQueue = async (request: Request) => {
    const queue = getQueue({
      name: request.data.queueName,
      prefix: request.data.queuePrefix,
    });
    const { status, duration } = request.data;
    await queue.bull.clean(duration, status);
    return queue;
  };

  const emptyQueue = async (request: Request) => {
    const queue = getQueue({
      name: request.data.queueName,
      prefix: request.data.queuePrefix,
    });
    await queue.bull.empty();
    return queue;
  };

  const discardJob = async (request: Request) => {
    const queue = getQueue({
      name: request.data.queueName,
      prefix: request.data.queuePrefix,
    });
    const job = await queue.bull.getJob(request.data.jobId);
    await job?.discard();
    const discardedJob = await queue.bull.getJob(request.data.jobId);
    const state = await discardedJob?.getState();
    return { ...discardedJob, state };
  };

  const promoteJob = async (request: Request) => {
    const queue = getQueue({
      name: request.data.queueName,
      prefix: request.data.queuePrefix,
    });
    const job = await queue.bull.getJob(request.data.jobId);
    await job?.promote();
    const promotedJob = await queue.bull.getJob(request.data.jobId);
    const state = await promotedJob?.getState();
    return { ...promotedJob, state };
  };

  const removeJob = async (request: Request) => {
    const queue = getQueue({
      name: request.data.queueName,
      prefix: request.data.queuePrefix,
    });
    const job = await queue.bull.getJob(request.data.jobId);
    await job?.remove();
  };

  const retryJob = async (request: Request) => {
    const queue = getQueue({
      name: request.data.queueName,
      prefix: request.data.queuePrefix,
    });
    const job = await queue.bull.getJob(request.data.jobId);
    await job?.retry();
    const promotedJob = await queue.bull.getJob(request.data.jobId);
    const state = await promotedJob?.getState();
    return { ...promotedJob, state };
  };

  const requestHandlers: { [key: string]: (request: Request) => any } = {
    getQueues,
    getIsQueuePaused,
    getQueueJobCounts,
    getWaiting,
    getActive,
    getDelayed,
    getCompleted,
    getFailed,
    getJob,
    pauseQueue,
    resumeQueue,
    cleanQueue,
    emptyQueue,
    discardJob,
    promoteJob,
    removeJob,
    retryJob,
  };

  socket.on(`request`, async (request: Request) => {
    const { path } = request;
    const handler = requestHandlers[path];
    const result = await handler(request);
    const response = { request, result };
    socket.volatile.emit('response', response);
  });

  return true;
};
