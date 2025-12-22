import { Hono } from 'hono'

export const app = new Hono()

app.get('/hello', (c) => {
  return c.json({ message: 'Hello World' })
})

