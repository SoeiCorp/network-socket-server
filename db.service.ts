// import { prisma } from '../lib/prisma';
import { chatMessages, chatroomUsers, chatrooms, users } from "./drizzle/migrations/schema"
import { db } from "./drizzle/db"
import { toClientChatroom, toClientMessage, toClientPrivateChatroom, toServerImageMessage, toServerTextMessage } from "./types"
import { and, eq, sql } from "drizzle-orm"
// import { uploadImageToS3 } from './uploadImageToS3';
// import getS3URL from '../actions/public/S3/getS3URL';

export async function findAllChatroom(userId: string) {
  const result = await db.execute(sql`
            SELECT c.*, count(*) 
            FROM chatrooms c 
            LEFT JOIN chatroom_users cu 
            ON cu.chatroom_id = c.id 
            WHERE c.id IN ( 
                SELECT chatroom_id 
                FROM chatroom_users 
                WHERE user_id = ${userId}) 
            GROUP BY c.id`)
  return result.rows
}

export async function findNewGroupChatroom(chatroomId: string): Promise<toClientChatroom> {
  const chatroom = await db.select().from(chatrooms).where(eq(chatrooms.id, Number(chatroomId)))
  console.log(chatroom)
  return {
    id: chatroom[0].id,
    name: chatroom[0].name,
    type: chatroom[0].chatroomType,
    createdAt: chatroom[0].createdAt,
    numUsers: 1
  }
}

export async function findNewPrivateChatroom(chatroomId: string): Promise<toClientPrivateChatroom> {
  const chatroomUser = await db.select().from(chatroomUsers).where(eq(chatroomUsers.chatroomId, parseInt(chatroomId)))
  return {
    id: chatroomUser[0].chatroomId,
    userId1: chatroomUser[0].userId,
    userId2: chatroomUser[1].userId
  }
}

export async function findPrivateChatroom(userId: string, opponentUserId: string): Promise<{ success: boolean, chatroom: any }> {
  const chatroom = await db.execute(sql`
                SELECT * FROM chatrooms c
                LEFT JOIN chatroom_users cu
                ON c.id = cu.chatroom_id
                WHERE c.chatroom_type = 'private' AND c.id IN (
                SELECT cu.chatroom_id FROM chatroom_users cu
                WHERE cu.chatroom_id IN (
                SELECT cu.chatroom_id FROM chatroom_users cu
                WHERE cu.user_id = ${userId}) AND user_id = ${opponentUserId})`);
  if (!chatroom.rows.length) {
    return {
      success: false,
      chatroom: []
    }
  }
  return {
    success: true,
    chatroom: chatroom.rows[0]
  }
}

export async function validChatRoom(chatRoomId: string, userId: string): Promise<boolean> {
  // check if such chatRoom exists and if the userId is in the chatRoom
  const chatRoom = await db
    .select({ chatroomid: chatroomUsers.chatroomId, userId: chatroomUsers.userId })
    .from(chatroomUsers)
    .where(
      and(
        eq(chatroomUsers.chatroomId, parseInt(chatRoomId)),
        eq(chatroomUsers.userId, parseInt(userId))
      )
    )
    .limit(1)
  console.log(chatRoom)

  if (chatRoom.length === 0) {
    return false
  }

  return true
}

export async function saveTextMessage(
  chatRoomId: string,
  userId: string,
  message: toServerTextMessage
): Promise<toClientMessage> {
  console.log(chatRoomId, userId, message.text)
  const savedMessage = await db
    .insert(chatMessages)
    .values({
      chatroomId: parseInt(chatRoomId),
      userId: parseInt(userId),
      message: message.text,
      messageType: "text",
    })
    .returning()
  const user = await db.select().from(users).where(eq(users.id, parseInt(userId)))

  const messageToClient: toClientMessage = {
    id: savedMessage[0].id,
    chatroomId: parseInt(chatRoomId),
    userId: savedMessage[0].userId,
    content: savedMessage[0].message,
    type: savedMessage[0].messageType,
    createdAt: savedMessage[0].createdAt,
    userName: user[0].name
  }
  return messageToClient
}

// export async function saveImageMessage(
//   chatRoomId: string,
//   userId: string,
//   message: toServerImageMessage
// ): Promise<toClientMessage> {
//   const imageName = await uploadImageToS3(message)

//   // save message into db
//   const savedMessage = await prisma.message.create({
//     data: {
//       chatroomId: chatRoomId,
//       userId: userId,
//       content: imageName,
//       isImage: true,
//     },
//   })

//   // construct a message to emits back to clients
//   const getS3URLResponse = await getS3URL(imageName)

//   // throw error if failed to getS3URL
//   if (!getS3URLResponse.success) {
//     throw {
//       success: getS3URLResponse.success,
//       message: getS3URLResponse.message,
//     }
//   }

//   console.log(getS3URLResponse)

//   const imageURL = getS3URLResponse.data

//   const messageToClient: toClientMessage = {
//     id: savedMessage.id,
//     userId: savedMessage.userId,
//     createdAt: savedMessage.createdAt.toISOString(),
//     content: imageURL,
//     isImage: savedMessage.isImage,
//   }

//   return messageToClient
// }
