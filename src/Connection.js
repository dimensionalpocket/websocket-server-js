import { v4 as uuidv4 } from 'uuid'

export class Connection {
  /**
   * @param {WebsocketServer} server
   */
  constructor (server) {
    /** @type {WebsocketServer} */
    this.server = server

    /** @type {string} */
    this.uuid = uuidv4()

    /**
     * @type {?uWS.WebSocket}
     */
    this.uwsConnection = null

    /**
     * `true` if connection can transmit messages.
     *
     * @type {boolean}
     */
    this.active = false
  }

  /**
   * Sends a string to the connection.
   *
   * @param {string} message
   *
   * @returns {boolean}
   */
  send (message) {
    if (this.active === false) {
      console.error('Server', this.server.uuid, 'Connection', this.uuid, 'tried to send message but connection is not active, message:', message)
      return false
    }

    const uwsConnection = this.uwsConnection

    if (uwsConnection == null) {
      console.error('Server', this.server.uuid, 'Connection', this.uuid, 'failed to send message due to uwsConnection not set, message:', message)
      return false
    }

    const result = uwsConnection.send(message, false)

    if (result === 2) {
      console.error('Server', this.server.uuid, 'Connection', this.uuid, 'failed to send message due to backpressure limit, message:', message)
      return false
    }

    if (result === 0) {
      console.warn('Server', this.server.uuid, 'Connection', this.uuid, 'is under backpressure, delivery will be delayed')
    }

    return true
  }
}
