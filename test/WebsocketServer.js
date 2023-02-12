import { expect, sinon } from '@dimensionalpocket/development'
import { createConnection } from './utils/create-connection.js'
import { createServer } from './utils/create-server.js'

describe('WebsocketServer', function () {
  before(function (done) {
    createServer(this, (/** @type {any} */ err) => {
      if (err) return done(err)

      sinon.spy(this.server, 'emit')
      createConnection(this.server, this, done)
    })
  })

  after(function () {
    if (this.connection) { this.connection.close() }
    this.server.stop()
    this.server.emit.restore()
  })

  it('emits the connect event', function () {
    const firstConnection = this.server.connections.entries().next().value[1] // returns a tuple [id, value]
    expect(this.server.emit).to.have.been.calledWith('connect', firstConnection)
  })

  it('adds the connection to the list of connections', function () {
    expect(this.server.connections.size).to.eq(1)
  })

  it('receives a message from client', function (done) {
    const m = 'message from client'
    this.server.once('message', (/** @type {any} */ connection, /** @type {any} */ message, /** @type {any} */ _isBinary) => {
      const firstConnection = this.server.connections.entries().next().value[1]
      expect(message).to.eq(m)
      expect(connection).to.eq(firstConnection)
      done()
    })
    this.connection.send(m)
  })

  it('sends a message to the client', function (done) {
    const m = 'message to client'
    this.connection.once('message', (/** @type {any} */ message) => {
      expect(message.utf8Data).to.eq(m)
      done()
    })
    const connection = this.server.connections.entries().next().value[1]
    connection.send(m)
  })
})
