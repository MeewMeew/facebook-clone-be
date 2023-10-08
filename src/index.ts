import 'dotenv/config'

import fs from 'fs'
import path from 'path'
import express from 'express'
import cors from 'cors'
import http from 'http'
import https from 'https'
import { Server } from 'socket.io'
import { Socket } from './socket.js'
import { Logger } from './logger.js'
import { fromBase64ToBuffer, blurImage } from './functions.js'
export class App {
  private debug: boolean = false
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

    app.get('/a/:id', async (req, res) => {
      const id = req.params.id
      const result = await fromBase64ToBuffer(id)
      
      res.writeHead(200, {
        'Content-Type': result.mime || 'image/png',
        'Content-Length': result.buffer.length || 0
      })
      
      if (!result) return res.end()
      return res.end(result.buffer)
    })

    app.get('/a/:id/blur', async (req, res) => {
      const id = req.params.id
      const result = await blurImage(id, 100)
      res.writeHead(200, {
        'Content-Type': result.mime || 'image/png',
        'Content-Length': result.buffer.length || 0
      })
      if (!result) return res.end()
      return res.end(result.buffer)
    })
    
    const server = this.createServer(app)
    
    if (args.includes('--debug')) {
      this.debug = true
      Logger.warn(`[server] Debug mode is enabled`)
    }
    
    new Socket(new Server(server, {
      cors: {
        origin: process.env.CORS || '*',
        methods: ['GET', 'POST']
      },
      maxHttpBufferSize: 1e7
    }), this.debug)

    const ssl = this.loadSSL()
    const PORT = ssl ? 443 : 80
    server.listen(PORT, () => {
      Logger.info(`[server] Server is listening on port ${PORT}`)
    })
  }

  private loadSSL() {
    if (fs.existsSync(path.join(__dirname, '../ssl/server.key')) && fs.existsSync(path.join(__dirname, '../ssl/server.crt'))) {
      return {
        key: fs.readFileSync(path.join(__dirname, '../ssl/server.key')),
        cert: fs.readFileSync(path.join(__dirname, '../ssl/server.crt'))
      }
    }
  }

  private createServer(app: express.Express) {
    const ssl = this.loadSSL()
    if (ssl) {
      return https.createServer(ssl, app)
    }
    return http.createServer(app)
  }
}

const args = process.argv.slice(2)
new App(args)

process.on('SIGINT', () => {
  Logger.info('[server] Server is shutting down')
  process.exit(0)
})

process.on('uncaughtException', (err) => {
  Logger.error('[server] Uncaught exception', err)
  process.exit(1)
})

process.on('unhandledRejection', (err) => {
  Logger.error('[server] Unhandled rejection', err)
  process.exit(1)
})