import { Socket } from 'socket.io-client';
import { Queue } from './queues';
import { debug } from './utils';

function utcNow() {
  const date = new Date();
  return date;
}

export const registerEventHandler = ({
  apiKey,
  queue,
  socket,
}: {
  apiKey: string;
  queue: Queue;
  socket: Socket;
}) => {
  [
    {
      event: 'global:waiting',
      queueMetricType: 'job_queued',
    },
    {
      event: 'global:active',
      queueMetricType: 'job_processing',
    },
    {
      event: 'global:completed',
      queueMetricType: 'job_completed',
    },
    {
      event: 'global:failed',
      queueMetricType: 'job_failed',
    },
  ].forEach(({ event, queueMetricType }) => {
    queue.bull.on(event, (jobId: string) => {
      const eventData = {
        timestamp: utcNow(),
        apiKey,
        queueName: queue.name,
        queuePrefix: queue.prefix,
        type: queueMetricType,
        data: { jobId },
      };
      if (socket.connected) {
        debug(`Emitting queue-metric: ${JSON.stringify(eventData)}`);
        socket.emit('queue-metric', eventData);
      }
    });
  });
};
