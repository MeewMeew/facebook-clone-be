import _ from 'lodash';
import { Listener } from './listener.js';
import { SEvent } from '../types/index.js';
import { SocketServer } from '../types/socket.js';
import 'dotenv/config';


export class Socket {
  constructor(io: SocketServer, debug: boolean) {
    const mewbook = io.of('/mewbook')
  
    mewbook.on('connection', (socket) => {

      // when user connect to socket
      socket.on(SEvent.USER_ONLINE, Listener.onOnline(socket, mewbook))
      socket.on(SEvent.USER_OFFLINE, Listener.onDisconnect(socket, mewbook))

      // with post
      socket.on(SEvent.POST_COMMENT_ADD, Listener.onPostCommentAdd(mewbook))
      socket.on(SEvent.POST_COMMENT_REMOVE, Listener.onPostCommentRemove(mewbook))
      socket.on(SEvent.POST_REACTION_ADD, Listener.onPostReactionAdd(mewbook))
      socket.on(SEvent.POST_REACTION_UPDATE, Listener.onPostReactionUpdate(mewbook))
      socket.on(SEvent.POST_REACTION_REMOVE, Listener.onPostReactionRemove(mewbook))

      // // with friend
      socket.on(SEvent.FRIEND_REQUEST, Listener.onFriendRequest(mewbook))
      socket.on(SEvent.FRIEND_ACCEPT, Listener.onFriendAccept(mewbook))
      socket.on(SEvent.FRIEND_REMOVE, Listener.onFriendRemove(mewbook))
      socket.on(SEvent.FRIEND_REJECT, Listener.onFriendReject(mewbook))
      socket.on(SEvent.FRIEND_CANCEL, Listener.onFriendCancel(mewbook))

      // with attachment
      socket.on(SEvent.ATTACHMENT_UPLOAD, Listener.onAttachmentUpload)
      socket.on(SEvent.ATTACHMENT_REMOVE, Listener.onAttachmentRemove)
      socket.on(SEvent.ATTACHMENT_GET, Listener.onAttachmentGet)
    })
  }
}