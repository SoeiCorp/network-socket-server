// import { prisma } from '../lib/prisma';
import { chatMessages, chatroomUsers, chatrooms, users } from "./drizzle/migrations/schema"
import { db } from "./drizzle/db"
import { toClientChatroom, toClientMessage, toClientPrivateChatroom, toServerImageMessage, toServerTextMessage } from "./types"
import { and, eq, sql } from "drizzle-orm"
import { pg } from "./lib/db"
// import { uploadImageToS3 } from './uploadImageToS3';
// import getS3URL from '../actions/public/S3/getS3URL';

export async function findAllChatroom(userId: string) {
  const result = await pg.query(`
  SELECT 
    c.*, 
    count(*) 
  FROM chatrooms c 
  LEFT JOIN chatroom_users cu 
  ON cu.chatroom_id = c.id 
  WHERE c.id IN ( 
      SELECT chatroom_id 
      FROM chatroom_users 
      WHERE user_id = '${userId}') 
  GROUP BY c.id`)
  // const result = await db.execute(sql`
  //           SELECT c.*, count(*) 
  //           FROM chatrooms c 
  //           LEFT JOIN chatroom_users cu 
  //           ON cu.chatroom_id = c.id 
  //           WHERE c.id IN ( 
  //               SELECT chatroom_id 
  //               FROM chatroom_users 
  //               WHERE user_id = ${userId}) 
  //           GROUP BY c.id`)
  return result.rows
}

export async function findNewGroupChatroom(chatroomId: string): Promise<toClientChatroom> {
  // const chatroom = await db.select().from(chatrooms).where(eq(chatrooms.id, Number(chatroomId)))
  const chatroom = await pg.query(`
    SELECT *
    FROM chatrooms
    WHERE id = ${chatroomId}
    `)

  console.log(chatroom.rows)
  return {
    id: chatroom.rows[0].id,
    name: chatroom.rows[0].name,
    type: chatroom.rows[0].chatroom_type,
    createdAt: chatroom.rows[0].created_at,
    numUsers: 1
  }
}

export async function findNewPrivateChatroom(chatroomId: string): Promise<toClientPrivateChatroom> {
  // const chatroomUser = await db.select().from(chatroomUsers).where(eq(chatroomUsers.chatroomId, parseInt(chatroomId)))
  const chatroomUser = await pg.query(`
    SELECT *
    FROM chatroom_users
    WHERE chatroom_id = ${chatroomId}`)
  return {
    id: chatroomUser.rows[0].chatroom_id,
    userId1: chatroomUser.rows[0].user_id,
    userId2: chatroomUser.rows[1].user_id
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
  // const chatRoom = await db
  //   .select({ chatroomid: chatroomUsers.chatroomId, userId: chatroomUsers.userId })
  //   .from(chatroomUsers)
  //   .where(
  //     and(
  //       eq(chatroomUsers.chatroomId, parseInt(chatRoomId)),
  //       eq(chatroomUsers.userId, parseInt(userId))
  //     )
  //   )
  //   .limit(1)
  const chatroom = await pg.query(`
    SELECT *
    FROM chatroom_users
    WHERE chatroom_id = ${chatRoomId}
      AND user_id = ${userId}`)
  // console.log(chatRoom)

  if (chatroom.rows.length === 0) {
    return false
  }

  return true
}

export async function saveTextMessage(
  chatRoomId: string,
  userId: string,
  message: toServerTextMessage
): Promise<toClientMessage> {
  // console.log(chatRoomId, userId, message.text)
  // const savedMessage = await db
  //   .insert(chatMessages)
  //   .values({
  //     chatroomId: parseInt(chatRoomId),
  //     userId: parseInt(userId),
  //     message: message.text,
  //     messageType: "text",
  //   })
  //   .returning()
  const savedMessage = await pg.query(`
    INSERT INTO chat_messages (chatroom_id, user_id, message, message_type)
    VALUES ('${chatRoomId}', '${userId}', '${message.text}', 'text')
    RETURNING *`)
  // const user = await db.select().from(users).where(eq(users.id, parseInt(userId)))
  const user = await pg.query(`
    SELECT *
    FROM users
    WHERE id = ${userId}`)
  const messageToClient: toClientMessage = {
    id: savedMessage.rows[0].id,
    chatroomId: parseInt(chatRoomId),
    userId: savedMessage.rows[0].user_id,
    content: savedMessage.rows[0].message,
    type: savedMessage.rows[0].message_type,
    createdAt: savedMessage.rows[0].created_at,
    userName: user.rows[0].name
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
