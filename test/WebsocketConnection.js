import { expect, sinon } from '@dimensionalpocket/development'
import { WebsocketConnection } from '../src/WebsocketConnection.js'
import { createConnection } from './utils/create-connection.js'
import { createServer } from './utils/create-server.js'

describe('WebsocketConnection', function () {
  before(function (done) {
    createServer(this, (/** @type {any} */ err) => {
      sinon.spy(this.server, 'emit')
      done(err)
    })

    sinon.stub(console, 'warn')
    sinon.stub(console, 'error')
  })

  after(function () {
    this.server.stop()
    this.server.emit.restore()

    // @ts-ignore
    console.warn.restore()
    // @ts-ignore
    console.error.restore()
  })

  context('when connection is established', function () {
    describe('#send', function () {
      before(function (done) {
        createConnection(this.server, this, () => {
          this.serverConnection = this.server.connections.entries().next().value[1]
          done()
        })
      })

      after(function () {
        this.clientConnection.close()
      })

      context('without backpressure', function () {
        before(function () {
          sinon.stub(this.serverConnection.uwsConnection, 'send').returns(1)
        })

        after(function () {
          this.serverConnection.uwsConnection.send.restore()
        })

        it('returns true', function () {
          expect(this.serverConnection.send('test message without backpressure')).to.eq(true)
        })
      })

      context('when backpressure is building up', function () {
        before(function () {
          sinon.stub(this.serverConnection.uwsConnection, 'send').returns(0)
        })

        after(function () {
          this.serverConnection.uwsConnection.send.restore()
        })

        it('returns true', function () {
          expect(this.serverConnection.send('test message backpressure buildup')).to.eq(true)
        })

        it('logs a warning', function () {
          this.serverConnection.send('test log backpressure buildup')
          expect(console.warn).to.have.been.calledWith(
            'Server', this.server.uuid,
            'Connection', this.serverConnection.uuid,
            'is under backpressure, delivery will be delayed'
          )
        })
      })

      context('when backpressure has hit the limit', function () {
        before(function () {
          sinon.stub(this.serverConnection.uwsConnection, 'send').returns(2)
        })

        after(function () {
          this.serverConnection.uwsConnection.send.restore()
        })

        it('returns false', function () {
          expect(this.serverConnection.send('test message backpressure limit')).to.eq(false)
        })

        it('logs an error', function () {
          const message = 'test log backpressure limit'
          this.serverConnection.send(message)
          expect(console.error).to.have.been.calledWith(
            'Server', this.server.uuid,
            'Connection', this.serverConnection.uuid,
            'failed to send message due to backpressure limit, message:',
            message
          )
        })
      })
    })

    describe('#close', function () {
      before(function (done) {
        createConnection(this.server, this, () => {
          this.serverConnection = this.server.connections.entries().next().value[1]
          this.uwsConnection = this.serverConnection.uwsConnection
          sinon.spy(this.uwsConnection, 'close')
          this.result = this.serverConnection.close()
          done()
        })
      })

      after(function () {
        this.uwsConnection.close.restore()
        this.clientConnection.close()
      })

      it('returns true', function () {
        expect(this.result).to.eq(true)
      })

      it('unsets the underlying connection', function () {
        expect(this.serverConnection.uwsConnection).to.eq(null)
      })

      it('sets the connection as inactive', function () {
        expect(this.serverConnection.active).to.eq(false)
      })

      it('closes the connection', function () {
        expect(this.uwsConnection.close).to.have.been.called
      })
    })
  })

  context('when connection is not active', function () {
    before(function () {
      // @ts-ignore this.server is set in createServer
      this.inactiveConnection = new WebsocketConnection(this.server)
    })

    describe('#send', function () {
      it('returns false', function () {
        expect(this.inactiveConnection.send('test')).to.eq(false)
      })

      it('logs an error', function () {
        const message = 'test log'
        this.inactiveConnection.send(message)
        expect(console.error).to.have.been.calledWith(
          'Server', this.server.uuid,
          'Connection', this.inactiveConnection.uuid,
          'tried to send message but connection is not active, message:',
          message
        )
      })
    })
  })

  context('when connection socket is not set', function () {
    before(function () {
      // @ts-ignore this.server is set in createServer
      this.socketlessConnection = new WebsocketConnection(this.server)
      this.socketlessConnection.active = true
    })

    describe('#send', function () {
      it('returns false', function () {
        expect(this.socketlessConnection.send('test')).to.eq(false)
      })

      it('logs an error', function () {
        const message = 'test log socketless'
        this.socketlessConnection.send(message)
        expect(console.error).to.have.been.calledWith(
          'Server', this.server.uuid,
          'Connection', this.socketlessConnection.uuid,
          'failed to send message due to uwsConnection not set, message:',
          message
        )
      })
    })

    describe('#close', function () {
      it('returns false', function () {
        expect(this.socketlessConnection.close()).to.eq(false)
      })
    })
  })
})
