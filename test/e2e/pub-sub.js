import { expect, sinon } from '@dimensionalpocket/development'
import { createConnection } from '../support/create-connection.js'
import { createServer } from '../support/create-server.js'

describe('e2e - pub/sub', function () {
  before(function (done) {
    this.connections = [{}, {}, {}]
    const checkConnections = () => {
      for (let c of this.connections) {
        if (!c.clientConnection?.connectionUuid) return
      }

      // All connections are set.
      done()
    }

    createServer(this, (/** @type {any} */ err) => {
      if (err) return done(err)

      this.server.on('connect', (/** @type {WebsocketConnection} */ connection) => {
        connection.subscribe('connections/all')
        connection.subscribe(`connections/${connection.uuid}`)
      })

      sinon.spy(this.server, 'emit')
      for (let c of this.connections) {
        createConnection(this.server, c, () => {
          checkConnections()
        })
      }
    })
  })

  after(function () {
    for (let c of this.connections) {
      if (c.clientConnection) { c.clientConnection.close() }
    }

    this.server.stop()
    this.server.emit.restore()
  })

  it('sends messages to all subscribers', function (done) {
    const message = 'message to all connections'
    var receivedMessageCount = 0
    const checkDone = () => {
      if (receivedMessageCount === this.connections.length) {
        done()
      }
    }
    for (let c of this.connections) {
      c.clientConnection.once('message', (/** @type {any} */ data) => {
        if (data.utf8Data === message) {
          receivedMessageCount++
          checkDone()
        }
      })
    }
    this.server.publish('connections/all', message)
  })

  it('sends messages to some subscribers', function (done) {
    const message = 'message to first connection only'
    var receivedMessageCount = 0

    const checkDone = () => {
      // Remove listeners
      for (let c of this.connections) {
        c.clientConnection.removeListener('message', callback)
      }

      if (receivedMessageCount === 1) {
        done()
      } else {
        done('More than 1 message arrived')
      }
    }

    const callback = (/** @type {any} */ data) => {
      if (data.utf8Data === message) {
        receivedMessageCount++
      }
    }

    for (let c of this.connections) {
      c.clientConnection.once('message', callback)
    }

    // Publish a message to a topic only one connection is subscribed to
    this.server.publish(`connections/${this.connections[0].clientConnection.connectionUuid}`, message)

    // Wait 500ms then check for how many messages arrived
    setTimeout(checkDone, 500)
  })
})
