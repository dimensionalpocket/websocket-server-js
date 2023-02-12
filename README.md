# @dimensionalpocket/websocket-server-js

Wrapper on µWebSockets.js with opinionated features.

## Features

- Exposes a plain `/` endpoint with a JSON status page
- Exposes the webserver on `/server`
- Upgrades connections with UUIDs and User Agents
- Keeps a list of connections in memory, indexed by UUIDs

## Usage

```javascript
import WebsocketServer from '@dimensionalpocket/websocket-server'

const websocketServer = new WebsocketServer()

websocketServer.on('connect', (connection, server) => {
  // Connection is also available in server.connections.get("connection-uuid")
  console.log('Connected', connection.uuid, 'on server', server.uuid)
})

websocketServer.on('disconnect', (connection, server) => {
  // At this point the connection is no longer available in server.connections.get(...)
  console.log('Disconnected', connection.uuid, 'from server', server.uuid)
})

websocketServer.on('message', (connection, message, isBinary, server) => {
  console.log('Server', server.uuid, 'received message', message, 'from connection', connection.uuid)
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
connection.send('message')

```

## License

MIT
