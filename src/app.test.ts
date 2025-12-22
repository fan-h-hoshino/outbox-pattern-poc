import { describe, it, expect } from 'vitest'
import { app } from './app'

describe('GET /hello', () => {
  it('ステータスコード 200 と { message: "Hello World" } を返す', async () => {
    const res = await app.request('/hello')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'Hello World' })
  })
})

