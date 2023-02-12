# @dimensionalpocket/websocket-server-js

Wrapper on µWebSockets.js with opinionated features.

## Features

- Exposes a plain `/` endpoint with a JSON status page
- Exposes the webserver on `/server`
- Upgrades connections with UUIDs and User Agents
- Keeps a list of connections in memory, indexed by UUIDs

## Usage

```javascript
import { WebsocketServer } from '@dimensionalpocket/websocket-server'

const websocketServer = new WebsocketServer()

websocketServer.on('connect', (connection) => {
  // Connection is also available in server.connections.get("connection-uuid")
  console.log('Connected', connection.uuid, 'on server', connection.server.uuid)
})

websocketServer.on('disconnect', (connection) => {
  // At this point the connection is no longer available in server.connections.get(...)
  // The connection can no longer receive messages.
  console.log('Disconnected', connection.uuid, 'from server', connection.server.uuid)
})

websocketServer.on('message', (connection, message, isBinary) => {
  // If `isBinary` is false, then message will be a string, otherwise, an ArrayBuffer
  console.log('Server', connection.server.uuid, 'received message', message, 'from connection', connection.uuid)
})

websocketServer.on('start', (server) => {
  console.log('Server', server.uuid, 'now listening on host', server.host, 'port', server.port)
})

websocketServer.on('stop', (server) => {
  console.log('Server', server.uuid, 'stopped')
})

websocketServer.start()

// Sending an object to a connection
const connection = websocketServer.connections.get('connection-uuid')
connection.send({type: 'message', value: 'test'})

```

## License

MIT
