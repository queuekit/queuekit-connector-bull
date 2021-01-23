# QueueMetrics.io Bull Connector

This is a small service which enables you to connect your [Bull](https://github.com/OptimalBits/bull) queues to [QueueMetrics.io](https://queuemetrics.io). It acts as a proxy between your Bull queues and the [QueueMetrics.io](https://queuemetrics.io) API, providing bi-directional data transfer which enables advanced queue insights and management with [QueueMetrics.io](https://queuemetrics.io).

This connector is designed to be used in production-grade environments and does not require the sharing of passwords or SSH tunnels to function. It is also very useful to use the connector in local development environments for rapid queue development and debugging.

The connector is very lightweight and efficient, and uses minimal resources.

## Installation

```sh
npm install queuemetrics-connector-bull
```

## Usage

