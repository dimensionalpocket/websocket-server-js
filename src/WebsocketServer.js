import uWS from 'uWebSockets.js'
import EventEmitter from 'eventemitter3'
import { v4 as uuidv4 } from 'uuid'
import { WebsocketConnection } from './WebsocketConnection.js'
import { StringDecoder } from 'string_decoder'

const decoder = new StringDecoder('utf8')

export class WebsocketServer extends EventEmitter {
  constructor () {
    super()

    /** @type {string} */
    this.uuid = uuidv4()

    /** @type {Map<string,WebsocketConnection>} */
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
        const dpwsConnection = new WebsocketConnection(this)
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

      open: (uwsConnection) => {
        // @ts-ignore
        const connection = uwsConnection.dpwsConnection

        connection.uwsConnection = uwsConnection
        connection.active = true
        this.connections.set(connection.uuid, connection)

        this.emit('connect', connection)
      },

      message: (uwsConnection, message, isBinary) => {
        // @ts-ignore
        const connection = uwsConnection.dpwsConnection

        let m = message

        // If not a binary message, convert it to string.
        if (!isBinary) {
          // @ts-ignore
          m = decoder.write(new Uint8Array(message))
          decoder.end() // discard incomplete characters at the end of the buffer
        }

        this.emit('message', connection, m, isBinary)
      },

      drain: (uwsConnection) => {
        // @ts-ignore
        const connection = uwsConnection.dpwsConnection

        console.warn('Server', connection.server.uuid, 'Connection', connection.uuid, 'backpressure draining', uwsConnection.getBufferedAmount())
      },

      close: (uwsConnection) => {
        // @ts-ignore
        const connection = uwsConnection.dpwsConnection
        connection.implode()

        this.emit('disconnect', connection)
      }
    })

    // Status endpoint for health checks and kickstarts.
    this._uwsApp.get('/', (res) => {
      console.log('Server', this.uuid, 'STATUS')

      res
        .writeStatus('200 OK')
        .writeHeader('Access-Control-Allow-Origin', '*')
        .writeHeader('Content-Type', 'application/json')
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

  /**
   * Publish a message to a topic, to be sent to all connections subscribed to it.
   *
   * @param {string} topic
   * @param {ArrayBuffer|string} message
   * @param {boolean} [isBinary]
   * @param {boolean} [compress]
   */
  publish (topic, message, isBinary = undefined, compress = undefined) {
    const app = this._uwsApp

    if (!app) {
      console.warn('Server', this.uuid, 'tried to publish but uwsApp is not set', topic, message, isBinary, compress)
      return false
    }

    app.publish(topic, message, isBinary, compress)
    return true
  }

  stop () {
    if (this._uwsSocket) {
      uWS.us_listen_socket_close(this._uwsSocket)
      this._uwsSocket = null
      console.log('Server', this.uuid, 'stopped.')
      this.emit('stop', this)
      return true
    }

    console.log('Server', this.uuid, 'already stopped.')
    return false
  }
}
