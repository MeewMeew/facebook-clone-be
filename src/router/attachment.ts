import { Functions } from '../helper/functions.js';
import { Router } from 'express';
import { Logger } from '../helper/logger.js';

const router = Router();

router.get('/:id', async (req, res) => {
  const id = req.params.id
  let result = await Functions.download(id)
  if (!result) return res.send('Not found')
  const buffer = Functions.buffer(result)
  const compress = await Functions.compress(buffer, 70).toBuffer()
  const metadata = await Functions.metatdata(compress)
  res.writeHead(200, {
    'Content-Type': `image/${metadata.format}`,
    'Content-Length': compress.length
  })
  Logger.info('[image:compression]', metadata.format, compress.length, 'bytes')
  return res.end(compress)
})

router.get('/:id/compress/:rate', async (req, res) => {
  const id = req.params.id
  const rate = +req.params.rate || 50
  let result = await Functions.download(id)
  if (!result) return res.send('Not found')
  const buffer = Functions.buffer(result)
  const compress = await Functions.compress(buffer, rate).toBuffer()
  const metadata = await Functions.metatdata(compress)
  res.writeHead(200, {
    'Content-Type': `image/${metadata.format}`,
    'Content-Length': compress.length
  })
  Logger.info('[image:compression]', metadata.format, compress.length, 'bytes')
  return res.end(compress)
})

router.get('/:id/blur', async (req, res) => {
  const id = req.params.id
  let result = await Functions.download(id)
  if (!result) return res.send('Not found')
  const buffer = Functions.buffer(result)
  const compress = await Functions.compress(buffer, 30).toBuffer()
  const blur = await Functions.blur(compress, 60).toBuffer()
  const metadata = await Functions.metatdata(blur)
  res.writeHead(200, {
    'Content-Type': `image/${metadata.format}`,
    'Content-Length': blur.length
  })
  Logger.info('[image:compression]', metadata.format, blur.length, 'bytes')
  return res.end(blur)
})

export const AttachmentRouter = router