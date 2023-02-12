import { expect, sinon } from '@dimensionalpocket/development'
import { WebsocketServer } from '../src/WebsocketServer.js'

describe('WebsocketServer', function () {
  describe('#stop', function () {
    context('when the server is not started', function () {
      before(function () {
        sinon.stub(console, 'log')
        this.server = new WebsocketServer()
        this.result = this.server.stop()
      })

      after(function () {
        // @ts-ignore
        console.log.restore()
      })

      it('returns false', function () {
        expect(this.result).to.eq(false)
      })

      it('logs that the server is stopped', function () {
        expect(console.log).to.have.been.calledWith('Server', this.server.uuid, 'already stopped.')
      })
    })
  })
})
