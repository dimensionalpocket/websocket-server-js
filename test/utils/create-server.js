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

  try {
    context.server.start()
  } catch (e) {
    done(e)
  }
}
