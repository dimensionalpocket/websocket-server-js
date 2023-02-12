'use strict'

import { expect } from '@dimensionalpocket/development'
import { WebsocketServer as WebsocketServerFromSrc } from '../src/WebsocketServer.js'
import { Connection as ConnectionFromSrc } from '../src/Connection.js'
import { WebsocketServer, Connection } from '../index.js'

describe('main require', function () {
  it('exports WebsocketServer from src', function () {
    expect(WebsocketServer).to.equal(WebsocketServerFromSrc)
  })

  it('exports Connection from src', function () {
    expect(Connection).to.equal(ConnectionFromSrc)
  })
})
