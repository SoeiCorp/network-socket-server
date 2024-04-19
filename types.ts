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
  userId: number
  createdAt: string
  content: string
  type: "text" | "image"
}
