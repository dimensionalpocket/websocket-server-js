# @dimensionalpocket/websocket-server

[![build](https://github.com/dimensionalpocket/websocket-server-js/actions/workflows/node.js.yml/badge.svg)](https://github.com/dimensionalpocket/websocket-server-js/actions/workflows/node.js.yml)

Wrapper on µWebSockets.js with opinionated features.

## Features

- Exposes a plain root endpoint with a JSON status page
- Exposes the webserver on `/server`
- Upgrades connections with UUIDs and User Agents
- Keeps a list of connections in memory, indexed by UUIDs
- Automatically decode non-binary messages into strings

## Usage

```javascript
import { WebsocketServer } from '@dimensionalpocket/websocket-server'

const websocketServer = new WebsocketServer()

websocketServer.on('connect', (connection) => {
  // Connection is also available in server.connections.get("connection-uuid")
  console.log('Connected', connection.uuid, 'on server', connection.server.uuid)
})

websocketServer.on('message', (connection, message, isBinary) => {
  // If `isBinary` is false, then message will be a string, otherwise an ArrayBuffer
  console.log('Server', connection.server.uuid, 'received message', message, 'from connection', connection.uuid)
})

websocketServer.on('disconnect', (connection) => {
  // At this point the connection is no longer available in server.connections.get(...)
  // Connection can no longer be used
  console.log('Disconnected', connection.uuid, 'from server', connection.server.uuid)
})

websocketServer.on('start', (server) => {
  console.log('Server', server.uuid, 'now listening on host', server.host, 'port', server.port)
})

websocketServer.on('stop', (server) => {
  console.log('Server', server.uuid, 'stopped')
})

websocketServer.start()

// Sending a message to a connection
const connection = websocketServer.connections.get('connection-uuid')
connection.send('test message')

// Close the connection
connection.close()

```

## License

MIT
