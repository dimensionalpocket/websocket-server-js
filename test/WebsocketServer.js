import { expect, sinon } from '@dimensionalpocket/development'
import { WebsocketServer } from '../src/WebsocketServer.js'
import Websocket from 'websocket'

const WebsocketClient = Websocket.client

describe('WebsocketServer', function () {
  before(function (done) {
    this.server = new WebsocketServer()
    this.server.port = 18888 // use another port to avoid conflict with local instances
    sinon.spy(this.server, 'emit')

    this.server.once('start', () => {
      this.client = new WebsocketClient()
      this.client.on('connectFailed', (/** @type {any} */ error) => { done(error) })
      this.client.on('connect', (/** @type {any} */ connection) => {
        this.connection = connection
        done()
      })
      this.client.connect(`ws://${this.server.host}:${this.server.port}/server`, 'echo-protocol')
    })

    this.server.start()
  })

  after(function () {
    if (this.connection) { this.connection.close() }
    this.server.stop()
  })

  it('emits the start event', function () {
    expect(this.server.emit).to.have.been.calledWith('start', this.server)
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
