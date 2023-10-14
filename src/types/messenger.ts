import { ReactionType } from "./index.js";

export enum MessengerEvent {
  SEND_MESSAGE = 'send:message',
  RECEIVE_MESSAGE = 'receive:message',
  BOARDCAST = 'boardcast',
}

export interface InComingMessage {
  id: string;
  sid: number;
  cid: string;
  content: string;
  replyTo?: string;
  attachment?: {
    name: string;
    size: number;
    url: string;
  };
  timestamp: number;
  type: "text" | "emoji" | "image" | "attachment" | "sticker" | "unsend" | "replied" | "boardcast";
  reactions: {
    [key in ReactionType]: number;
  };
}

export interface Conversation {
  id: string;
  participants: number[];
  notification: boolean;
  seen: boolean;
  timestamp: number;
}

export type Messages = InComingMessage[]