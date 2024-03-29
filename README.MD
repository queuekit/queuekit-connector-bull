# QueueKit.com Bull Connector

This is a small service which enables you to connect your [Bull](https://github.com/OptimalBits/bull) queues to [QueueKit.com](https://queuekit.com). It acts as a proxy between your Bull queues and the [QueueKit.com](https://queuekit.com) API, providing bi-directional data transfer which enables advanced queue insights and management with [QueueKit.com](https://queuekit.com).

This connector is designed to be used in production-grade environments and does not require the sharing of passwords or SSH tunnels to function. It is also very useful to use the connector in local development environments for rapid queue development and debugging.

The connector is lightweight, efficient and production ready, and uses minimal resources.

## Installation

```sh
npm install queuekit-connector-bull
```

## Usage

```sh
Usage: queuekit-connector-bull [options]

Options:
  -V, --version                           output the version number
  -n, --connector-name <connection-name>  Connector name. Defaults to 'Default connector'. (default: "Default connector")
  -a, --api-key <api-key>                 QueueKit.com organization API key. Get this from https://dashboard.queuekit.com
  -h, --host <host>                       Redis host. Defaults to localhost. (default: "localhost")
  -p, --port <port>                       Redis port. Defaults to 6379. (default: "6379")
  -d, --database <database>               Redis database. Defaults to 0. (default: "0")
  -w, --password <password>               Redis password, can also be supplied by setting REDIS_PASSWORD environment variable.
  --tls [tls]                             Activate secured TLS connection to Redis
  -u, --uri [uri]                         Redis URI.
  -s, --sentinels [host:port]             Comma-separated list of sentinel host/port pairs
  -m, --master [name]                     Name of master node used in sentinel configuration
  -b, --backend <backend>                 QueueKit.com websocket backend. Defaults to wss://api.queuekit.com (default: "wss://api.queuekit.com")
  --help                                  display help for command
```

### Example usage

```sh
npx queuekit-connector-bull -u redis://<redis-host>:<redis-port>/<db-number> -a <your-queuekit-api-key>
```

Your API key can be obtained from your [queuekit.com Dashboard](https://dashboard.queuekit.com/)

### Usage with Docker

The connector can be run with our pre-built docker image:

```sh
docker run -it --net=host queuekit/queuekit-connector-bull -u redis://<redis-host>:<redis-port>/<db-number> -a <your-queuekit-api-key>
```

Your API key can be obtained from your [queuekit.com Dashboard](https://dashboard.queuekit.com/)

### Other connectors

[Bull connector](https://github.com/queuekit/queuekit-connector-bull)
[BullMQ connector](https://github.com/queuekit/queuekit-connector-bullmq)
[Celery connector](https://github.com/queuekit/queuekit-connector-celery)
