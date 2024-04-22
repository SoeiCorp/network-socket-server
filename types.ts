export type toServerTextMessage = {
  text: string
}

export type toServerImageMessage = {
  type: string
  size: number
  buffer: Buffer
}

export type toClientMessage = {
  id: number
  chatroomId: number
  userId: number
  content: string
  type: "text" | "image"
  createdAt: string
  userName: string
}

export type toClientChatroom = {
  id: number
  name: string
  type: 'group' | 'private'
  createdAt: string
  numUsers: number
}

export type toClientPrivateChatroom = {
  id: number
  userId1: number
  userId2: number
}
