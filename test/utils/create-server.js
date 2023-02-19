import { WebsocketServer } from '../../src/WebsocketServer.js'

// Use a random port for each server
// so they don't conflict with local instances
// or multiple servers running in specs.
var nextPort = 18888

/**
 * Creates and starts a server, and set it in the context.
 *
 * @param {any} context
 * @param {function} done
 */
export function createServer (context, done) {
  context.server = new WebsocketServer()
  context.server.port = nextPort++
  context.server.once('start', () => done())

  context.server.on('start', (/** @type {WebsocketServer} */ server) => {
    console.log('Server', server.uuid, 'started and listening on', server.host, server.port)
  })

  context.server.on('connect', (/** @type {WebsocketConnection} */ connection) => {
    console.log('Server', connection.server.uuid, 'received connection', connection.uuid)
  })

  context.server.on('message', (/** @type {WebsocketConnection} */ connection, /** @type {any} */ message, /** @type {boolean} */ isBinary) => {
    console.log('Server', connection.server.uuid, 'received message', message, isBinary)
  })

  context.server.on('stop', (/** @type {WebsocketServer} */ server) => {
    console.log('Server', server.uuid, 'stopped.')
  })

  context.server.on('status', (/** @type {WebsocketServer} */ server) => {
    console.log('Server', server.uuid, 'STATUS')
  })

  context.server.on('drain', (/** @type {WebsocketConnection} */ connection, /** @type {number} */ bufferedAmount) => {
    console.warn('Server', connection.server.uuid, 'Connection', connection.uuid, 'backpressure draining', bufferedAmount)
  })

  try {
    context.server.start()
  } catch (e) {
    done(e)
  }
}
