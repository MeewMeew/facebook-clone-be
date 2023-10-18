import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../helper/logger.js';
import { LTitle } from '../types/index.js';
import { uniqBy } from 'lodash-es';


type Data = {
  attachment: string
  id: string
}

export class AttachmentLocal {
  private static async create() {
    const dir = path.join(process.cwd(), 'attachments.json')
    if (!fs.existsSync(dir)) {
      fs.writeFileSync(dir, '[]')
      Logger.success(`[${LTitle.ATTACHMENT_FILE_CREATE}] ${dir}`)
    }
    return dir
  }

  public static async write(id: string, attachment: string) {
    const dir = await this.create()
    let data = JSON.parse(fs.readFileSync(dir, 'utf-8')) as Data[]
    data = uniqBy([...data, { id, attachment }], 'id')
    fs.writeFileSync(dir, JSON.stringify(data, null, 2))
    Logger.info(`[${LTitle.ATTACHMENT_FILE_WRITE}]`, id)
  }

  public static async read(id: string) {
    const dir = await this.create()
    const data = JSON.parse(fs.readFileSync(dir, 'utf-8')) as Data[]
    const { attachment } = data.find((e: { id: string }) => e.id === id)!
    if (!attachment) return null
    Logger.info(`[${LTitle.ATTACHMENT_FILE_READ}]`, id)
    return attachment
  }

  public static async has(id: string) {
    const dir = await this.create()
    const data = JSON.parse(fs.readFileSync(dir, 'utf-8')) as Data[]
    const attachment = data.find((e: { id: string }) => e.id === id)!
    Logger.info(`[${LTitle.ATTACHMENT_FILE_HAS_ID}]`, id)
    return !!attachment
  }

  public static async clean() {
    const dir = await this.create()
    fs.writeFileSync(dir, '[]')
    Logger.info(`[${LTitle.ATTACHMENT_FILE_CREATE}]`, dir)
  }
}