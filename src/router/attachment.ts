import { Functions } from '../helper/functions.js';
import { Router } from 'express';

const router = Router();

router.get('/:id', async (req, res) => {
  const id = req.params.id
  let result = await Functions.download(id)
  if (!result) return res.send('Not found')
  const data = await Functions.b2b(result)
  res.writeHead(200, {
    'Content-Type': data.mime || 'image/png',
    'Content-Length': data.buffer.length || 0
  })
  return res.end(data.buffer)
})

router.get('/:id/blur', async (req, res) => {
  const id = req.params.id
  let result = await Functions.download(id)
  if (!result) return res.send('Not found')
  const blur = await Functions.blur(result, 60)
  res.writeHead(200, {
    'Content-Type': blur.mime || 'image/png',
    'Content-Length': blur.buffer.length || 0
  })
  return res.end(blur.buffer)
})

export const AttachmentRouter = router