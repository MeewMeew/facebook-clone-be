import { AttachmentLocal } from './localdb.js'
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';

export async function fromBase64ToBuffer(id: string) {
  const attachment = await AttachmentLocal.read(id)
  if (!attachment) return {} as unknown as any
  const base64Data = attachment.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64')
  const type = await fileTypeFromBuffer(buffer)
  if (!type) return {} as unknown as any
  return {
    mime: type.mime,
    buffer: buffer
  }
}

export async function blurImage(id: string, sigma: number = 60) {
  const result = await fromBase64ToBuffer(id)
  if (!result) return {} as unknown as any
  const image = await sharp(result.buffer).blur(sigma).toBuffer();
  return {
    mime: result.mime,
    buffer: image
  }
}