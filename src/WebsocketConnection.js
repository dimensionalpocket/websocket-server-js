import { v4 as uuidv4 } from 'uuid'

export class WebsocketConnection {
  /**
   * @param {WebsocketServer} server
   */
  constructor (server) {
    /** @type {WebsocketServer} */
    this.server = server

    /** @type {string} */
    this.uuid = uuidv4()

    /**
     * Set by server at 'open' event.
     *
     * @type {?uWS.WebSocket}
     */
    this.uwsConnection = null

    /**
     * `true` if connection is active and message transferring is possible.
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

  /**
   * Sends an object as JSON string to the connection.
   *
   * @param {object} object
   * @returns {boolean}
   */
  json (object) {
    return this.send(JSON.stringify(object))
  }

  /**
   * Subscribes this connection to a topic.
   *
   * @param {string} topic
   *
   * @returns {boolean} - `true` if subscription was successful.
   */
  subscribe (topic) {
    const uwsConnection = this.uwsConnection

    if (uwsConnection == null) {
      console.error('Server', this.server.uuid, 'Connection', this.uuid, 'failed to subscribe due to uwsConnection not set, topic:', topic)
      return false
    }

    uwsConnection.subscribe(topic)

    return true
  }

  /**
   * @returns {boolean} - `true` if connection changed from open to closed, `false` if no change happened.
   */
  close () {
    const uwsConnection = this.uwsConnection

    if (uwsConnection == null) {
      return false
    }

    // Calling this will fire the 'close' event on the server,
    // which will then call implode() on this connection.
    uwsConnection.close()

    return true
  }

  /**
   * Removes external references to this connection to reduce GC stress.
   */
  implode () {
    this.active = false

    const uwsConnection = this.uwsConnection

    if (uwsConnection) {
      // @ts-ignore
      uwsConnection.dpwsConnection = null
    }

    this.uwsConnection = null

    // Remove self from server connections
    this.server.connections.delete(this.uuid)
  }
}
