import { expect, sinon } from '@dimensionalpocket/development'
import { WebsocketServer } from '../src/WebsocketServer.js'
import Websocket from 'websocket'

const WebsocketClient = Websocket.client

describe('WebsocketServer', function () {
  before(function (done) {
    this.server = new WebsocketServer()
    sinon.spy(this.server, 'emit')
    this.server.port = 18888 // use another port to avoid conflict with local instances
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

  it('starts succesfully', function () {
    expect(this.server.emit).to.have.been.calledWith('start', this.server)
  })

  it('adds a connection', function () {
    expect(this.server.connections.size).to.eq(1)
  })

  it('receives a message from client', function (done) {
    const m = 'message from client'
    this.server.once('message', (/** @type {any} */ _connection, /** @type {any} */ message, /** @type {any} */ _isBinary) => {
      expect(message).to.eq(m)
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
    const connection = this.server.connections.entries().next().value[1] // returns a tuple [id, value]
    connection.send(m)
  })
})
