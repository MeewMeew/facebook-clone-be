import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  or,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from './firebase.js';
import { IFriend, INotification, NotificationType } from '../types/index.js';
import { Conversation, InComingMessage } from '../types/messenger.js';
import { v4 as uuidv4, validate } from 'uuid';
import { Logger } from '../helper/logger.js';

export class Friend {
  public static async getByUID(uid: number) {
    const friendRef = collection(db, 'friends')
    const firendQuery = query(friendRef, where('uid', '==', uid))
    const friendDocs = await getDocs(firendQuery)
    const friendData = friendDocs.docs[0].data() as IFriend
    return friendData
  }
}

export class Notification {
  public static async create(data: any, type: NotificationType) {
    const notificationRef = collection(db, 'notifications')
    const notificationData: INotification = {
      id: Date.now(),
      nid: uuidv4(),
      aid: data.aid,
      read: false,
      type: type,
      data: data,
      created_at: Date.now()
    }

    await setDoc(doc(notificationRef, notificationData.nid), notificationData)
    return notificationData
  }

  public static async read(nid: string) {
    const notificationRef = doc(db, 'notifications', nid)
    await updateDoc(notificationRef, { read: true })
  }

  public static async remove(nid: string) {
    const notificationRef = doc(db, 'notifications', nid)
    await deleteDoc(notificationRef)
  }

  public static async update(nid: string, data: any) {
    const notificationRef = doc(db, 'notifications', nid)
    await updateDoc(notificationRef, data)
  }

  public static async get(nid: string) {
    if (!validate(nid)) return null
    return await getDoc(doc(db, 'notifications', nid))
  }

  public static async getByDataID(id: number) {
    const notificationRef = collection(db, 'notifications')
    const notificationQuery = query(notificationRef, where('data.id', '==', id))
    const notificationDocs = await getDocs(notificationQuery)
    if (notificationDocs.empty) return null
    const notificationData = notificationDocs.docs[0].data() as INotification
    return notificationData
  }

  public static async getByData(...data: [key: string, value: any][]) {
    const notificationRef = collection(db, 'notifications')
    const conditions = data.map(([key, value]) => where(`data.${key}`, '==', value))
    const notificationQuery = query(notificationRef, ...conditions)
    const notificationDocs = await getDocs(notificationQuery)
    if (notificationDocs.empty) return null
    const notificationData = notificationDocs.docs[0].data() as INotification
    return notificationData
  }
}

export class Attachment {
  public static async get(id: string) {
    if (!validate(id)) return null
    return await getDoc(doc(db, 'dev_attachments', id))
  }

  public static async getBySizeID(id: string) {
    const attachmentRef = collection(db, 'attachments')
    const attachmentQuery = query(attachmentRef, or(where('attachments.large', '==', id), where('attachments.medium', '==', id), where('attachments.small', '==', id)))
    const attachmentDocs = await getDocs(attachmentQuery)
    if (attachmentDocs.empty) return null
    const attachmentData = attachmentDocs.docs[0].data()
    return attachmentData
  }
}

export class User {
  public static async toggleState(id: number, state: boolean) {
    const userRef = collection(db, 'users')
    const userQuery = query(userRef, where('id', '==', id))
    const userDocs = await getDocs(userQuery)
    const userDoc = userDocs.docs[0]
    await updateDoc(userDoc.ref, { isOnline: state || !userDoc.data().isOnline })
  }
}

export class Messenger {
  public static async get(id: string): Promise<Conversation | false> {
    try {
      if (validate(id)) {
        const conversationRef = doc(db, 'conversations', id)
        const conversationSnap = await getDoc(conversationRef)
        const conversation = conversationSnap.data()
        return conversation as Conversation
      } else throw new Error('Invalid type')
    } catch (error) {
      Logger.error('Messenger', error)
      return false
    }
  }

  public static async insert(cid: string, message: InComingMessage) {
    try {
      const messageRef = doc(db, 'conversations', cid, 'messages', message.id)
      const conversationRef = doc(db, 'conversations', cid)
      await setDoc(messageRef, message)
      await updateDoc(conversationRef, { timestamp: message.timestamp, seen: false })
      return message
    } catch (error) {
      Logger.error('Messenger insert', error)
    }
  }

  public static async update(cid: string, mid: string, data: Partial<InComingMessage>) {
    try {
      const messageRef = doc(db, 'conversations', cid, 'messages', mid)
      const conversationRef = doc(db, 'conversations', cid)
      await updateDoc(conversationRef, { timestamp: Date.now() })
      await updateDoc(messageRef, data)
      return true
    } catch (error) {
      Logger.error('Messenger update', error)
      return false
    }
  }
}