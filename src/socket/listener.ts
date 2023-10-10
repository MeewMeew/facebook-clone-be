import _ from 'lodash';
import { Friend, Notification } from '../database/database.js';
import { Functions } from '../helper/functions.js';
import {
  IComment,
  IFriendEvent,
  IReaction,
  NotificationType,
  SEvent
  } from '../types/index.js';
import { Logger } from '../helper/logger.js';
import { Socket } from 'socket.io';
import { SocketNamespace } from '../types/socket.js';
import 'dotenv/config';

export class Listener {
  public static onOnline(socket: Socket, io: SocketNamespace) {
    return async (userID: number) => {
      try {
        if (!userID) return
        if (socket.rooms.has(userID.toString())) return
        socket.join(userID.toString())
        const fs = await Friend.getByUID(userID)
        if (!fs) return
        for (const f of fs.friends) {
          io.to(f).emit(SEvent.FRIEND_ONLINE, userID)
        }
        Logger.info(`[${SEvent.USER_ONLINE}] ID`, userID)
      } catch (error) {
        Logger.error(error)
      }
    }
  }

  public static onDisconnect(socket: Socket, io: SocketNamespace) {
    return async (userID: number) => {
      try {
        if (!userID) return
        if (!socket.rooms.has(userID.toString())) return
        socket.leave(userID.toString())
        const fs = await Friend.getByUID(userID)
        if (!fs) return
        for (const f of fs.friends) {
          io.to(f).emit(SEvent.FRIEND_OFFLINE, userID)
        }
        Logger.info(`[${SEvent.USER_OFFLINE}] ID`, userID)
      } catch (error) {
        Logger.error(error)
      }
    }
  }

  public static onPostCommentAdd(io: SocketNamespace) {
    return async (comment: IComment) => {
      try {
        if (!comment) return
        if (comment.aid === comment.uid) return
        const notiData = await Notification.create(comment, NotificationType.POST_COMMENT)
        io.to(comment.aid.toString()).emit(SEvent.NOTIFICATION_CREATE, notiData)
        Logger.success(`[${SEvent.POST_COMMENT_ADD}] ${comment.uid} comment to ${comment.aid}`)
      } catch (error) {
        Logger.error(error)
      }
    }
  }

  public static onPostCommentRemove(io: SocketNamespace) {
    return async (comment: IComment) => {
      try {
        if (!comment) return
        if (comment.aid === comment.uid) return
        const notiData = await Notification.getByDataID(comment.id)
        if (!notiData) return
        await Notification.remove(notiData.nid)
        io.to(comment.aid.toString()).emit(SEvent.NOTIFICATION_REMOVE, notiData)
        Logger.success(`[${SEvent.POST_COMMENT_REMOVE}] ${comment.uid} remove comment to ${comment.aid}`)
      } catch (error) {
        Logger.error(error)
      }
    }
  }

  public static onPostReactionAdd(io: SocketNamespace) {
    return async (reaction: IReaction) => {
      try {
        if (!reaction) return
        if (reaction.aid === reaction.uid) return
        const notiData = await Notification.create(reaction, NotificationType.POST_REACTION)
        io.to(reaction.aid.toString()).emit(SEvent.NOTIFICATION_CREATE, notiData)
        Logger.success(`[${SEvent.POST_REACTION_ADD}] ${reaction.uid} react to ${reaction.aid}`)
      } catch (error) {
        Logger.error(error)
      }
    }
  }

  public static onPostReactionUpdate(io: SocketNamespace) {
    return async (reaction: IReaction) => {
      try {
        if (!reaction) return
        if (reaction.aid === reaction.uid) return
        const notiData = await Notification.getByDataID(reaction.id)
        if (!notiData) return
        notiData.data = reaction
        await Notification.update(notiData.nid, { data: reaction })
        io.to(reaction.aid.toString()).emit(SEvent.NOTIFICATION_UPDATE, notiData)
        Logger.success(`[${SEvent.POST_REACTION_UPDATE}] ${reaction.uid} update react to ${reaction.aid}`)
      } catch (error) {
        Logger.error(error)
      }
    }
  }

  public static onPostReactionRemove(io: SocketNamespace) {
    return async (reaction: IReaction) => {
      try {
        if (!reaction) return
        if (reaction.aid === reaction.uid) return
        const notiData = await Notification.getByDataID(reaction.id)
        if (!notiData) return
        await Notification.remove(notiData.nid)
        io.to(reaction.aid.toString()).emit(SEvent.NOTIFICATION_REMOVE, notiData)
        Logger.success(`[${SEvent.POST_REACTION_REMOVE}] ${reaction.uid} remove react to ${reaction.aid}`)
      }
      catch (error) {
        Logger.error(error)
      }
    }
  }

  public static onFriendRequest(io: SocketNamespace) {
    return async (event: IFriendEvent) => {
      try {
        if (!event) return
        event.aid = event.fid
        const notiData = await Notification.create(event, NotificationType.FRIEND_RECEIVE)
        io.to(event.fid.toString()).emit(SEvent.NOTIFICATION_CREATE, notiData)
        Logger.success(`[${SEvent.FRIEND_REQUEST}] ${event.uid} request to ${event.fid}`)
      }
      catch (error) {
        Logger.error(error)
      }
    }
  }

  public static onFriendAccept(io: SocketNamespace) {
    return async (event: IFriendEvent) => {
      try {
        if (!event) return
        event.aid = event.fid
        const notiData = await Notification.create(event, NotificationType.FRIEND_ACCEPT)
        io.to(event.fid.toString()).emit(SEvent.NOTIFICATION_CREATE, notiData)
        Logger.success(`[${SEvent.FRIEND_ACCEPT}] ${event.uid} accept to ${event.fid}`)
      }
      catch (error) {
        Logger.error(error)
      }
    }
  }

  public static onFriendRemove(io: SocketNamespace) {
    return async (event: IFriendEvent) => {
      try {
        if (!event) return
        event.aid = event.fid
        const notiData = await Notification.create(event, NotificationType.FRIEND_REMOVE)
        io.to(event.fid.toString()).emit(SEvent.NOTIFICATION_CREATE, notiData)
        Logger.success(`[${SEvent.FRIEND_REMOVE}] ${event.uid} remove to ${event.fid}`)
      }
      catch (error) {
        Logger.error(error)
      }
    }
  }

  public static onFriendReject(io: SocketNamespace) {
    return async (event: IFriendEvent) => {
      try {
        if (!event) return
        event.aid = event.fid
        const notiData = await Notification.create(event, NotificationType.FRIEND_REJECT)
        io.to(event.fid.toString()).emit(SEvent.NOTIFICATION_CREATE, notiData)
        Logger.success(`[${SEvent.FRIEND_REJECT}] ${event.uid} reject to ${event.fid}`)
      }
      catch (error) {
        Logger.error(error)
      }
    }
  }

  public static onFriendCancel(io: SocketNamespace) {
    return async (event: IFriendEvent) => {
      try {
        if (!event) return
        event.aid = event.fid
        const notiData = await Notification.getByData(['uid', event.uid], ['fid', event.fid], ['type', NotificationType.FRIEND_REQUEST])
        if (!notiData) return
        await Notification.remove(notiData.nid)
        io.to(event.fid.toString()).emit(SEvent.NOTIFICATION_REMOVE, notiData)
        Logger.success(`[${SEvent.FRIEND_CANCEL}] ${event.uid} cancel to ${event.fid}`)
      } catch (error) {
        Logger.error(error)
      }
    }
  }

  public static async onAttachmentUpload(payload: Buffer, callback: Function) {
    const attachments = await Functions.upload(payload)
    if (!attachments) return callback({ attachment: null, error: 'Cannot upload image' })
    return callback({ attachments, error: null })
  }

  public static onAttachmentRemove(attachment: string) {
    Logger.info(`[${SEvent.ATTACHMENT_REMOVE}] ${attachment}`)
  }

  public static async onAttachmentGet(id: string, callback: Function) {
    const attachment = await Functions.download(id)
    if (attachment) return callback()
    else return callback('Cannot get attachment')
  }
}
