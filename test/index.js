'use strict'

import { expect } from '@dimensionalpocket/development'
import { Server as ServerFromSrc } from '../src/Server.js'
import Server from '../index.js'

describe('main require', function () {
  it('exports Server from src', function () {
    expect(Server).to.equal(ServerFromSrc)
  })
})
