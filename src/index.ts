import cors from 'cors';
import express from 'express';
import fs from 'fs-extra';
import http from 'http';
import https from 'https';
import { AttachmentRouter } from './router/attachment.js';
import { ClientToServerCommonEvents, ServerToClientCommonEvents } from './types/socket.js';
import { Logger } from './helper/logger.js';
import { Server } from 'socket.io';
import { Socket } from './socket/socket.js';
import packageJson from '../package.json' assert { type: 'json' };
import 'dotenv/config';


export class App {
  private debug: boolean = false
  constructor(args: string[]) {
    this.clearScreen()
    
    const app = express()
    const corsOrigin = process.env.CORS ? JSON.parse(process.env.CORS) : '*'
    const corsOptions: cors.CorsOptions = {
      origin: corsOrigin,
      methods: ['GET', 'POST']
    }
    
    
    app.use(cors(corsOptions))
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.set('json spaces', 2)
    app.get('/', (req, res) => res.json({ message: 'Hello World', version: packageJson.version }))
    app.use('/a', AttachmentRouter)
    
    
    if (args.includes('--debug') || args.includes('-d')) {
      this.debug = true
      Logger.warn(`[server] Debug mode is enabled`)
    }
    
    const ssl = this.loadSSL()
    const server = this.createServer(app)
    this.createSocket(server, corsOptions)

    const PORT = ssl ? 443 : 80
    server.listen(PORT, () => {
      Logger.info(`[server] Server is listening on port ${PORT}`)
    })
  }

  private createSocket(server: http.Server | https.Server, corsOptions: cors.CorsOptions = {}) {
    const io = new Server<ServerToClientCommonEvents, ClientToServerCommonEvents>(server, {
      cors: corsOptions,
      maxHttpBufferSize: 1e7
    })

    new Socket(io, this.debug)
  }

  private loadSSL() {
    if (fs.existsSync('./ssl/server.key') && fs.existsSync('./ssl/server.crt')) {
      return {
        key: fs.readFileSync('./ssl/server.key'),
        cert: fs.readFileSync('./ssl/server.crt')
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

  private clearScreen() {
    console.log('\x1Bc');    
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