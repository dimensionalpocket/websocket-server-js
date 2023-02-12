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
  context.client.on('connectFailed', (/** @type {any} */ error) => { done(error) })
  context.client.on('connect', (/** @type {any} */ connection) => {
    context.clientConnection = connection
    // Give the server a moment to get the connection set up
    setTimeout(() => done(), 10)
  })
  context.client.connect(`ws://${server.host}:${server.port}/server`, 'echo-protocol')
}
