import '@testing-library/jest-dom'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Spusť MSW server před všemi testy
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Reset handlerů po každém testu
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

// Zastav server po všech testech
afterAll(() => server.close())
