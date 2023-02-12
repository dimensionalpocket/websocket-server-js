import uWS from 'uWebSockets.js'
import EventEmitter from 'eventemitter3'
import { v4 as uuidv4 } from 'uuid'
import { Connection } from './Connection.js'
import { StringDecoder } from 'string_decoder'

const decoder = new StringDecoder('utf8')

export class WebsocketServer extends EventEmitter {
  constructor () {
    super()

    /** @type {string} */
    this.uuid = uuidv4()

    /** @type {Map<string,Connection>} */
    this.connections = new Map()

    this.host = '0.0.0.0'
    this.port = process.env.PORT || 8888

    /**
     * @private
     * uWebSocket app instance.
     *
     * @type {uWS.TemplatedApp}
     */
    this._uwsApp = uWS.App()

    this._uwsApp.ws('/server', {
      compression: uWS.SHARED_COMPRESSOR,
      maxPayloadLength: 16 * 1024 * 1024,
      maxBackpressure: 1 * 1024 * 1024,
      idleTimeout: 600, // 10 minutes - clients should send messages periodically to keep connection alive

      /**
       * This is called before #open.
       * Inject request data into response so it can be part of the `ws` instance.
       *
       * @param {any} res
       * @param {any} req
       * @param {any} context
       *
       * @return {void}
       */
      upgrade: (res, req, context) => {
        const dpwsConnection = new Connection(this)
        const userAgent = req.getHeader('user-agent')
        const userData = { dpwsConnection, userAgent }

        res.upgrade(
          userData,
          req.getHeader('sec-websocket-key'),
          req.getHeader('sec-websocket-protocol'),
          req.getHeader('sec-websocket-extensions'),
          context
        )
      },

      open: (wsConnection) => {
        // @ts-ignore
        const connection = wsConnection.dpwsConnection

        connection.uwsConnection = wsConnection
        connection.active = true
        this.connections.set(connection.uuid, connection)

        this.emit('connect', connection)
      },

      message: (wsConnection, message, isBinary) => {
        // @ts-ignore
        const connection = wsConnection.dpwsConnection

        let m = message

        // If not a binary message, convert it to string.
        if (!isBinary) {
          try {
            // @ts-ignore
            m = decoder.write(new Uint8Array(message))
          } catch (e) {
            console.error('Server', this.uuid, 'Connection', connection.uuid, 'failed to decode message, error', e)
            return
          }
        }

        this.emit('message', connection, m, isBinary)
      },

      drain: (wsConnection) => {
        // @ts-ignore
        const connection = wsConnection.dpwsConnection

        console.warn('Connection', connection.uuid, 'backpressure draining', wsConnection.getBufferedAmount())
      },

      close: (wsConnection) => {
        // @ts-ignore
        const connection = wsConnection.dpwsConnection

        connection.active = false
        connection.uwsConnection = null

        this.connections.delete(connection.uuid)

        this.emit('disconnect', connection)
      }
    })

    // Status endpoint for health checks and kickstarts.
    this._uwsApp.get('/', (res) => {
      console.log('Server', this.uuid, 'STATUS')

      res
        .writeStatus('200 OK')
        .writeHeader('Access-Control-Allow-Origin', '*')
        .end('{"status": "OK"}')
    })

    /**
     * @private
     * uWebSocket socket instance.
     *
     * @type {?uWS.us_listen_socket}
     */
    this._uwsSocket = null
  }

  start () {
    this._uwsApp.listen(this.host, +this.port, socket => {
      if (socket) {
        this._uwsSocket = socket
        console.log('Server', this.uuid, 'started and listening on', this.host, this.port)
        this.emit('start', this)
      } else {
        throw new Error(`FATAL: Server ${this.uuid} failed to listen on ${this.host}:${this.port}.`)
      }
    })
  }

  stop () {
    if (this._uwsSocket) {
      uWS.us_listen_socket_close(this._uwsSocket)
      this._uwsSocket = null
      console.log('Server', this.uuid, 'stopped.')
      this.emit('stop', this)
    } else {
      console.log('Server', this.uuid, 'already stopped.')
    }
  }
}
