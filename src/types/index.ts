export type IUser = {
  id: number
  uid: string
  authid: string
  displayName: string
  email: string
  verified: boolean
  photoURL: string
  coverURL: string
  gender: number
  isOnline: boolean
  created_at: number
}

export enum Gender {
  MALE = 0,
  FEMALE = 1,
  OTHER = 2
}

export type IReaction = {
  id: number
  uid: number
  pid: number
  type: ReactionType
  rid: string
  aid: number
  created_at: number
}

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  CARE = 'care',
  HAHA = 'haha',
  WOW = 'wow',
  SAD = 'sad',
  ANGRY = 'angry'
}

export type IPost = {
  id: number
  uid: number
  pid: string
  privacy: Privacy
  content: string
  attachment: string | IAttachmentItem
  created_at: number
  isCoverPhoto: boolean
  isNormalPost: boolean
  isProfilePhoto: boolean
}

export enum Privacy {
  PUBLIC = 0,
  FRIENDS = 1,
  ONLY_ME = 2
}

export type IComment = {
  id: number
  uid: number
  pid: number
  cid: string
  aid: number
  content: string
  created_at: number
}

export type IFriend = {
  id: number
  uid: number
  fid: string
  friends: string[]
  received: string[]
  requested: string[]
  created_at: number
}

export type INotification = {
  id: number
  nid: string
  read: boolean
  type: NotificationType
  aid: number
  data: any
  created_at: number
}

export enum NotificationType {
  POST_COMMENT = 'post_comment',
  POST_REACTION = 'post_reaction',
  FRIEND_REQUEST = 'friend_request',
  FRIEND_ACCEPT = 'friend_accept',
  FRIEND_REMOVE = 'friend_remove',
  FRIEND_REJECT = 'friend_reject',
  FRIEND_CANCEL = 'friend_cancel',
  FRIEND_RECEIVE = 'friend_receive',
}

export type ICommentNUser = IComment & { user: IUser }

export type IAttachment = {
  id: number;
  realid: string;
  attachments: IAttachmentItem
  created_at: number;
}

export type IAttachmentItem = {
  large: string
  medium: string
  small: string
}

export type FileSize = 'large' | 'medium' | 'small'

export type IAttachmentStore = {
  id: string,
  attachment: string
}

export enum FriendEventType {
  FRIEND_REQUEST = 'friend_request',
  FRIEND_ACCEPT = 'friend_accept',
  FRIEND_REMOVE = 'friend_remove',
  FRIEND_REJECT = 'friend_reject',
  FRIEND_CANCEL = 'friend_cancel',
}

export type IFriendEvent = {
  id: number,
  aid: number,
  uid: number,
  fid: number,
  type: FriendEventType,
  created_at: number
}

export enum SEvent {
  SOCKET_CONNECT = 'connect',
  SOCKET_DISCONNECT = 'disconnect',

  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',

  POST_COMMENT_ADD = 'post:comment:add',
  POST_COMMENT_REMOVE = 'post:comment:remove',
  POST_REACTION_ADD = 'post:reaction:add',
  POST_REACTION_UPDATE = 'post:reaction:update',
  POST_REACTION_REMOVE = 'post:reaction:remove',

  FRIEND_REQUEST = 'friend:request',
  FRIEND_RECEIVE = 'friend:receive',
  FRIEND_ACCEPT = 'friend:accept',
  FRIEND_REMOVE = 'friend:remove',
  FRIEND_REJECT = 'friend:reject',
  FRIEND_CANCEL = 'friend:cancel',
  FRIEND_ONLINE = 'friend:online',
  FRIEND_OFFLINE = 'friend:offline',

  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_CREATE = 'notification:create',
  NOTIFICATION_REMOVE = 'notification:remove',
  NOTIFICATION_UPDATE = 'notification:update',

  ATTACHMENT_UPLOAD = 'attachment:upload',
  ATTACHMENT_REMOVE = 'attachment:remove',
  ATTACHMENT_GET = 'attachment:get',
}

export enum LTitle {
  ATTACHMENT_FILE_CREATE = 'attachment:file:create',
  ATTACHMENT_FILE_WRITE = 'attachment:file:write',
  ATTACHMENT_FILE_GET = 'attachment:file:get',
  ATTACHMENT_FILE_READ = 'attachment:file:read',
  ATTACHMENT_FILE_HAS_ID = 'attachment:file:has:id',
}