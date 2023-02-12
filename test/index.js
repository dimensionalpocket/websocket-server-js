import { expect } from '@dimensionalpocket/development'
import { WebsocketServer as WebsocketServerFromSrc } from '../src/WebsocketServer.js'
import { WebsocketConnection as WebsocketConnectionFromSrc } from '../src/WebsocketConnection.js'
import { WebsocketServer, WebsocketConnection } from '../index.js'

describe('main require', function () {
  it('exports WebsocketServer from src', function () {
    expect(WebsocketServer).to.equal(WebsocketServerFromSrc)
  })

  it('exports WebsocketConnection from src', function () {
    expect(WebsocketConnection).to.equal(WebsocketConnectionFromSrc)
  })
})
