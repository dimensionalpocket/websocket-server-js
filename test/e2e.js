import ApiClient from '@dimensionalpocket/api-client'
import { expect, sinon } from '@dimensionalpocket/development'
import { createConnection } from './utils/create-connection.js'
import { createServer } from './utils/create-server.js'

describe('e2e - websocket connection', function () {
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
    this.clientConnection.send(m)
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

describe('e2e - GET /', function () {
  before(function (done) {
    sinon.stub(console, 'log')

    createServer(this, (/** @type {any} */ err) => {
      if (err) return done(err)

      this.apiClient = new ApiClient(`http://${this.server.host}:${this.server.port}`)
      this.apiClient.returnBody = false
      this.apiClient.get('/').then((/** @type {any} */ response) => {
        this.response = response
        this.server.stop()
        done()
      })
    })
  })

  after(function () {
    // @ts-ignore
    console.log.restore()
  })

  it('returns status code 200', function () {
    expect(this.response.status).to.eq(200)
  })

  it('logs the request', function () {
    expect(console.log).to.have.been.calledWith('Server', this.server.uuid, 'STATUS')
  })

  it('responds with permissive CORS headers', function () {
    expect(this.response.headers['access-control-allow-origin']).to.eq('*')
  })

  it('returns a valid JSON response', function () {
    expect(this.response.headers['content-type']).to.eq('application/json')

    const body = this.response.data
    expect(body.status).to.eq('OK')
  })
})
