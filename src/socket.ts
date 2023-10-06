import 'dotenv/config'
import { Server, Socket as SocketConnect, Namespace } from "socket.io";
import * as _ from 'lodash-es'
import { Logger } from "./logger.js";
import { Friend, Notification } from "./database.js";
import { File, IComment, IReaction, NotificationType, SEvent } from "./types.js";
import FormData from "form-data";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid'
import { fileTypeFromBuffer } from 'file-type';
import { AttachmentLocal } from './localdb.js';

const telegramToken = process.env.TELEGRAM_TOKEN || ''
const telegramChatID = process.env.TELEGRAM_CHAT_ID || ''

export class Socket {
  private mewbook: Namespace
  private debug: boolean

  constructor(io: Server, debug: boolean) {
    this.debug = debug
    this.mewbook = io.of('/mewbook')
    this.mewbook.on('connection', (socket) => {
      Logger.info(`[${SEvent.SOCKET_CONNECT}] ID ${socket.id}`)


      // when user connect to socket
      socket.on(SEvent.USER_ONLINE, this.onOnline(socket))
      socket.on(SEvent.USER_OFFLINE, this.onDisconnect(socket))
      socket.on(SEvent.SOCKET_DISCONNECT, () => Logger.info(`[${SEvent.SOCKET_DISCONNECT}] ID ${socket.id}`))

      // when user do something
      // with post
      socket.on(SEvent.POST_COMMENT_ADD, this.onPostCommentAdd)
      socket.on(SEvent.POST_COMMENT_REMOVE, this.onPostCommentRemove)
      socket.on(SEvent.POST_REACTION_ADD, this.onPostReactionAdd)
      socket.on(SEvent.POST_REACTION_UPDATE, this.onPostReactionUpdate)
      socket.on(SEvent.POST_REACTION_REMOVE, this.onPostReactionRemove)

      // // with friend
      // socket.on(SEvent.FRIEND_REQUEST, this.onFriendRequest)
      // socket.on(SEvent.FRIEND_ACCEPT, this.onFriendAccept)
      // socket.on(SEvent.FRIEND_REMOVE, this.onFriendRemove)

      // // with notification
      // socket.on(SEvent.NOTIFICATION_READ, this.onNotificationRead)

      // with attachment
      socket.on(SEvent.ATTACHMENT_UPLOAD, this.onAttachmentUpload)
      socket.on(SEvent.ATTACHMENT_REMOVE, this.onAttachmentRemove)
      socket.on(SEvent.ATTACHMENT_GET, this.onAttachmentGet)
      socket.on(SEvent.ATTACHMENT_CACHE, this.onAttachmentCache)
    })


  }

  private onOnline(socket: SocketConnect) {
    return async (userID: number) => {
      Logger.debug(this.debug, `[${SEvent.USER_ONLINE}] ID ${userID}`)
      if (!userID) return
      if (socket.rooms.has(userID.toString())) return

      socket.join(userID.toString())

      const fs = await Friend.getByUID(userID)
      if (!fs) return
      for (const f of fs.friends) {
        this.mewbook.to(f).emit(SEvent.FRIEND_ONLINE, userID)
      }
      Logger.info(`[${SEvent.USER_ONLINE}] ID ${userID}`)
    }
  }

  private onDisconnect(socket: SocketConnect) {
    return async (userID: number) => {
      Logger.debug(this.debug, `[${SEvent.USER_OFFLINE}] ID ${userID}`)
      if (!userID) return
      if (!socket.rooms.has(userID.toString())) return

      socket.leave(userID.toString())

      const fs = await Friend.getByUID(userID)
      if (!fs) return
      for (const f of fs.friends) {
        this.mewbook.to(f).emit(SEvent.FRIEND_OFFLINE, userID)
      }
      Logger.info(`[${SEvent.USER_OFFLINE}] ID ${userID}`)
    }
  }

  private async onPostCommentAdd(comment: IComment) {
    Logger.debug(this.debug, `[${SEvent.POST_COMMENT_ADD}] ${comment.uid} comment to ${comment.aid}`)
    if (!comment) return
    if (comment.aid === comment.uid) return
    const notiData = await Notification.create(comment, NotificationType.POST_COMMENT)
    this.mewbook.to(comment.aid.toString()).emit(SEvent.NOTIFICATION_CREATE, notiData)
    Logger.success(`[${SEvent.POST_COMMENT_ADD}] ${comment.uid} comment to ${comment.aid}`)
  }

  private async onPostCommentRemove(comment: IComment) {
    Logger.debug(this.debug, `[${SEvent.POST_COMMENT_REMOVE}] ${comment.uid} remove comment to ${comment.aid}`)
    if (!comment) return
    if (comment.aid === comment.uid) return
    const notiData = await Notification.getByDataID(comment.id)
    if (!notiData) return
    await Notification.remove(notiData.nid)
    this.mewbook.to(comment.aid.toString()).emit(SEvent.NOTIFICATION_REMOVE, notiData)
    Logger.success(`[${SEvent.POST_COMMENT_REMOVE}] ${comment.uid} remove comment to ${comment.aid}`)
  }

  private async onPostReactionAdd(reaction: IReaction) {
    Logger.debug(this.debug, `[${SEvent.POST_REACTION_ADD}] ${reaction.uid} react to ${reaction.aid}`)
    if (!reaction) return
    if (reaction.aid === reaction.uid) return
    const notiData = await Notification.create(reaction, NotificationType.POST_REACTION)
    this.mewbook.to(reaction.aid.toString()).emit(SEvent.NOTIFICATION_CREATE, notiData)
    Logger.success(`[${SEvent.POST_REACTION_ADD}] ${reaction.uid} react to ${reaction.aid}`)
  }

  private async onPostReactionUpdate(reaction: IReaction) {
    Logger.debug(this.debug, `[${SEvent.POST_REACTION_UPDATE}] ${reaction.uid} update react to ${reaction.aid}`)
    if (!reaction) return
    if (reaction.aid === reaction.uid) return
    const notiData = await Notification.getByDataID(reaction.id)
    if (!notiData) return
    notiData.data = reaction
    await Notification.update(notiData.nid, { data: reaction })
    this.mewbook.to(reaction.aid.toString()).emit(SEvent.NOTIFICATION_UPDATE, notiData)
    Logger.success(`[${SEvent.POST_REACTION_UPDATE}] ${reaction.uid} update react to ${reaction.aid}`)
  }

  private async onPostReactionRemove(reaction: IReaction) {
    Logger.debug(this.debug, `[${SEvent.POST_REACTION_REMOVE}] ${reaction.uid} remove react to ${reaction.aid}`)
    if (!reaction) return
    if (reaction.aid === reaction.uid) return
    const notiData = await Notification.getByDataID(reaction.id)
    if (!notiData) return
    await Notification.remove(notiData.nid)
    this.mewbook.to(reaction.aid.toString()).emit(SEvent.NOTIFICATION_REMOVE, notiData)
    Logger.success(`[${SEvent.POST_REACTION_REMOVE}] ${reaction.uid} remove react to ${reaction.aid}`)
  }

  private async onAttachmentUpload(payload: Buffer, callback: Function) {
    const result = await fileTypeFromBuffer(payload)
    const fileName = uuidv4() + '.' + result?.ext || 'png'
    const form = new FormData()
    Logger.debug(this.debug, `[${SEvent.ATTACHMENT_UPLOAD}] ${fileName}`)

    form.append('chat_id', telegramChatID)
    form.append('photo', payload, { filename: fileName })

    try {
      const res = await axios({
        method: 'post',
        url: `https://api.telegram.org/bot${telegramToken}/sendPhoto`,
        data: form,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${form.getBoundary()}`
        }
      })

      if (res.data) {
        const photos = (res.data.result.photo as any[]).sort((a, b) => b.file_size - a.file_size).slice(0, 3)
        type FileSize = 'large' | 'medium' | 'small'
        const attachments = {} as Record<FileSize, string>
        photos.forEach((photo, index) => {
          const category = ["large", "medium", "small"][index] || "small" as FileSize;
          if (category === 'large') {
            attachments.large = photo.file_id
            Logger.info(`[${SEvent.ATTACHMENT_UPLOAD}:large] ${attachments.large}`)
          }
          if (category === 'medium') {
            attachments.medium = photo.file_id
            Logger.info(`[${SEvent.ATTACHMENT_UPLOAD}:medium] ${attachments.medium}`)
          }
          if (category === 'small') {
            attachments.small = photo.file_id
            Logger.info(`[${SEvent.ATTACHMENT_UPLOAD}:small] ${attachments.small}`)
          }
        })

        Logger.success(`[${SEvent.ATTACHMENT_UPLOAD}] ${attachments.large}`)
        callback({ attachments, error: null })
      }
    } catch (error) {
      Logger.error(`[${SEvent.ATTACHMENT_UPLOAD}] ${error}`)
      callback({ attachments: null, error: 'Cannot upload this image' })
    }
  }

  private async onAttachmentRemove(attachment: string) {
    Logger.info(`[${SEvent.ATTACHMENT_REMOVE}] ${attachment}`)
  }

  private async onAttachmentGet(attachment_id: string, callback: Function) {
    try {
      Logger.debug(this.debug, `[${SEvent.ATTACHMENT_GET}] ${attachment_id}`)
      const res = await axios({
        method: 'GET',
        url: `https://api.telegram.org/bot${telegramToken}/getFile`,
        params: {
          file_id: attachment_id
        }
      })
      if (res.data?.ok) {
        const file_path = res.data.result.file_path
        const file = await axios({
          method: 'GET',
          url: `https://api.telegram.org/file/bot${telegramToken}/${file_path}`,
          responseType: 'arraybuffer'
        })
        const base64 = Buffer.from(file.data, 'binary').toString('base64')
        Logger.success(`[${SEvent.ATTACHMENT_GET}] ${attachment_id}`)
        const dataURL = `data:image/${res.data.result.file_path.split('.')[1]};base64,${base64}`
        await AttachmentLocal.write(attachment_id, dataURL)
        return callback({ attachment: dataURL, error: null })
      } else {
        Logger.error(`[${SEvent.ATTACHMENT_GET}] ${res.data}`)
        return callback({ attachment: null, error: 'Cannot get image' })
      }
    } catch (error) {
      Logger.error(`[${SEvent.ATTACHMENT_GET}] ${error}`)
      return callback({ attachment: null, error: 'Failed to get image' })
    }
  }

  private async onAttachmentCache(attachment_id: string, callback: Function) {
    try {
      const has = await AttachmentLocal.has(attachment_id)
      Logger.debug(this.debug, `[${SEvent.ATTACHMENT_CACHE}] ${attachment_id}`)
      return callback({ cache: has, error: null })
      
    } catch (error) {
      Logger.error(`[${SEvent.ATTACHMENT_CACHE}] ${error}`)
      return callback({ attachment: null, error: 'Failed to get image' })
    }
  }
}