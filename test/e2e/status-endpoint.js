import ApiClient from '@dimensionalpocket/api-client'
import { expect, sinon } from '@dimensionalpocket/development'
import { createServer } from '../utils/create-server.js'

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
