import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import { Socket } from './socket.js'
import { Logger } from './logger.js'
import { AttachmentLocal } from './localdb.js'
import { fileTypeFromBuffer } from 'file-type'
export class App {
  private debug: boolean = false
  private port = process.env.PORT || 3000
  constructor(args: string[]) {
    const app = express()
    
    app.use(cors({
      origin: process.env.CORS || '*',
      methods: ['GET', 'POST']
    }))
    
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    
    app.set('json spaces', 2)
    
    app.get('/', (req, res) => {
      return res.json({
        message: 'Hello World'
      })
    })

    app.get('/attachment/:id', async (req, res) => {
      const id = req.params.id
      const attachment = await AttachmentLocal.read(id)
      if (!attachment) return res.status(404).json({ message: 'Not found' })
      const base64Data = attachment.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      const type = await fileTypeFromBuffer(Buffer.from(base64Data, 'base64'))
      if (!type) return res.status(404).json({ message: 'Not found' })
      // stream
      res.writeHead(200, {
        'Content-Type': type.mime,
        'Content-Length': Buffer.from(base64Data, 'base64').length
      })
      res.end(Buffer.from(base64Data, 'base64'))
    })
    
    const server = app.listen(this.port, () => {
      Logger.info(`[server] Server is running on port ${this.port}`)
    })
    
    const io = new Server(server, {
      cors: {
        origin: process.env.CORS || '*',
        methods: ['GET', 'POST']
      },
      maxHttpBufferSize: 1e7 // 10MB
    })
    
    if (args.includes('--debug')) {
      this.debug = true
      Logger.warn(`[server] Debug mode is enabled`)
    }
    
    new Socket(io, this.debug)
  }
}

const args = process.argv.slice(2)
new App(args)

process.on('SIGINT', () => {
  Logger.info('[server] Server is shutting down')
  process.exit(0)
})