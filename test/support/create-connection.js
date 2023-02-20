import Websocket from 'websocket'

const WebsocketClient = Websocket.client

/**
* Creates a client and connection and sets them in the context.
*
* @param {WebsocketServer} server
* @param {any} context
* @param {function} done
*/
export function createConnection (server, context, done) {
  context.client = new WebsocketClient()

  // These events are based on the ws library.
  context.client.on('connectFailed', (/** @type {any} */ error) => { done(error) })
  context.client.on('connect', (/** @type {any} */ connection) => {
    context.clientConnection = connection
    connection.once('message', (/** @type {any} */ data) => {
      // First message sent by server will be the connection UUID
      const json = JSON.parse(data.utf8Data)
      if (json && json[0] === 'connection-uuid') {
        context.clientConnection.connectionUuid = json[1]
      }
      done()
    })
  })

  context.client.connect(`ws://${server.host}:${server.port}/server`, 'echo-protocol')
}
