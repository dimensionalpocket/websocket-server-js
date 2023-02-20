import { expect, sinon } from '@dimensionalpocket/development'
import { createConnection } from '../support/create-connection.js'
import { createServer } from '../support/create-server.js'

describe('e2e - single connection', function () {
  before(function (done) {
    createServer(this, (/** @type {any} */ err) => {
      if (err) return done(err)

      sinon.spy(this.server, 'emit')
      createConnection(this.server, this, done)
    })
  })

  after(function () {
    if (this.clientConnection) { this.clientConnection.close() }
    this.server.stop()
    this.server.emit.restore()
  })

  it('emits the connect event', function () {
    const serverConnection = this.server.connections.get(this.clientConnection.connectionUuid)

    expect(this.server.emit).to.have.been.calledWith('connect', serverConnection)
  })

  it('adds the connection to the list of connections', function () {
    expect(this.server.connections.size).to.eq(1)
  })

  it('receives a message from client', function (done) {
    const m = 'test-client-message'
    const serverConnection = this.server.connections.get(this.clientConnection.connectionUuid)
    this.server.once('message', (/** @type {any} */ connection, /** @type {any} */ message, /** @type {any} */ _isBinary) => {
      expect(message).to.eq(m)
      expect(connection).to.eq(serverConnection)
      done()
    })
    this.clientConnection.send(m)
  })

  it('receives multiple UTF8 messages from client', function (done) {
    const messagesToSend = ['abcde👀', 'fgh 🤯 ijk', '⚠️ 12345']
    const receivedMessages = []
    const server = this.server

    const callback = function (/** @type {any} */ _connection, /** @type {any} */ receivedMessage, /** @type {any} */ _isBinary) {
      expect(messagesToSend).to.include(receivedMessage)

      receivedMessages.push(receivedMessage)

      if (messagesToSend.length === receivedMessages.length) {
        server.removeListener('message', callback)
        done()
      }
    }

    server.on('message', callback)

    for (var m of messagesToSend) {
      this.clientConnection.send(m)
    }
  })

  it('sends a message to the client', function (done) {
    const m = 'message to client'
    this.clientConnection.once('message', (/** @type {any} */ message) => {
      expect(message.utf8Data).to.eq(m)
      done()
    })
    const connection = this.server.connections.entries().next().value[1]
    connection.send(m)
  })
})
