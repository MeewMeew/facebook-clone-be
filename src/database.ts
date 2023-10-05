import { getDocs, collection, query, where, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, addDoc } from "firebase/firestore";
import { v4 as uuidv4, validate } from 'uuid'
import { db } from "./firebase.js";
import { IFriend, NotificationType, INotification } from "./types.js";


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
}