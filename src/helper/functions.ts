import axios from 'axios';
import FormData from 'form-data';
import sharp from 'sharp';
import { AttachmentLocal } from '../database/localdb.js';
import { FileSize } from '../types/index.js';
import { fileTypeFromBuffer } from 'file-type';
import { Logger } from './logger.js';
import { v4 as uuidv4 } from 'uuid';

type IBuffer = {
  mime: string
  buffer: Buffer
}

export class Functions {
  public static async upload(buffer: Buffer, debug: boolean = false) {
    const id = uuidv4()
    const type = await fileTypeFromBuffer(buffer)
    const form = new FormData()

    form.append('chat_id', process.env.TELEGRAM_CHAT_ID!)
    form.append('photo', buffer, { filename: `${id}.${type!.ext}` })

    Logger.debug(debug, `[upload] Uploading ${id}.${type!.ext} to Telegram...`)

    try {
      const res = await axios({
        method: 'post',
        url: `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN!}/sendPhoto`,
        data: form,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${form.getBoundary()}`
        }
      })

      if (!res.data.ok) {
        Logger.error(`[upload] ${res.data.description}`)
        return null
      }

      Logger.debug(debug, `[upload] Uploaded ${id}.${type!.ext} to Telegram`)

      const photos = (res.data.result.photo as any[]).sort((a, b) => b.file_size - a.file_size).slice(0, 3)
      const attachments = {} as Record<FileSize, any>
      photos.forEach((photo, index) => {
        const category = ["large", "medium", "small"][index] || "small" as FileSize;
        if (category === 'large') {
          attachments.large = photo.file_id
          Logger.info(`[upload:large] ${attachments.large}`)
        }
        if (category === 'medium') {
          attachments.medium = photo.file_id
          Logger.info(`[upload:medium] ${attachments.medium}`)
        }
        if (category === 'small') {
          attachments.small = photo.file_id
          Logger.info(`[upload:small] ${attachments.small}`)
        }
      })

      Logger.success(`[upload] Uploaded ${id}.${type!.ext} to Telegram`)

      return attachments
    } catch (err) {
      Logger.error(`[upload] ${err}`)
      return null
    }
  }

  public static async download(id: string) {
    try {
      const has = await AttachmentLocal.has(id)
      if (!has) {
        Logger.error(`[download] Attachment ${id} not found`)
        Logger.info(`[download] Trying to download ${id} from Telegram...`)
        const res = await axios({
          method: 'get',
          url: `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN!}/getFile`,
          params: {
            file_id: id
          }
        })
        if (!res.data.ok) {
          Logger.error(`[download] ${res.data.description}`)
          return null
        }
        const file_path = res.data.result.file_path
        const file_url = `https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN!}/${file_path}`
        const file = await axios({
          method: 'get',
          url: file_url,
          responseType: 'arraybuffer'
        })
        const buffer = Buffer.from(file.data, 'binary')
        await AttachmentLocal.write(id, buffer.toString('base64'))
        Logger.success(`[download] Downloaded ${id} from Telegram`)
      }
      const attachment = await AttachmentLocal.read(id)
      return attachment
    } catch (err) {
      Logger.error(`[download] ${err}`)
      return null
    }
  }

  public static buffer(base64: string): Buffer {
    return Buffer.from(base64, 'base64')
  }

  public static async metatdata(buffer: Buffer): Promise<sharp.Metadata> {
    const image = sharp(buffer).withMetadata()
    return image.metadata()
  }

  public static compress(buffer: Buffer, quality: number = 50): sharp.Sharp {
    const image = sharp(buffer).withMetadata()
    const compress = image.webp({ quality })
    return compress
  }

  public static blur(buffer: Buffer, sigma: number = 60): sharp.Sharp {
    const compress = this.compress(buffer)
    const blur = compress.blur(sigma)
    return blur
  }
}