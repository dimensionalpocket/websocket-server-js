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
    context.connection = connection
    done()
  })
  context.client.connect(`ws://${server.host}:${server.port}/server`, 'echo-protocol')
}
