import { expect, sinon } from '@dimensionalpocket/development'
import { WebsocketServer } from '../src/WebsocketServer.js'
import { createServer } from './utils/create-server.js'

describe('WebsocketServer', function () {
  describe('#stop', function () {
    context('when server is started', function () {
      before(function (done) {
        sinon.spy(console, 'log')

        createServer(this, (/** @type {any} */ err) => {
          if (err) return done(err)

          sinon.stub(this.server, 'emit')
          this.server.stop()
          done()
        })
      })

      after(function () {
        // @ts-ignore
        console.log.restore()
        this.server.emit.restore()
      })

      it('emits stop event', function () {
        expect(this.server.emit).to.have.been.calledWith('stop', this.server)
      })

      it('logs that the server has stopped', function () {
        expect(console.log).to.have.been.calledWith('Server', this.server.uuid, 'stopped.')
      })

      it('unsets the internal listen socket', function () {
        expect(this.server._uwsSocket).to.eq(null)
      })
    })

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

      it('logs that the server is already stopped', function () {
        expect(console.log).to.have.been.calledWith('Server', this.server.uuid, 'already stopped.')
      })
    })
  })
})
