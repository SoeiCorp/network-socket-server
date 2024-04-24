import { db } from "./drizzle/db"
import { toClientChatroom, toClientMessage, toClientPrivateChatroom, toServerImageMessage, toServerTextMessage } from "./types"
import { sql } from "drizzle-orm"
import { pg } from "./lib/db"

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
  return result.rows
}

export async function findNewGroupChatroom(chatroomId: string): Promise<toClientChatroom> {
  const chatroom = await pg.query(`
    SELECT *
    FROM chatrooms
    WHERE id = ${chatroomId}
    `)

  return {
    id: chatroom.rows[0].id,
    name: chatroom.rows[0].name,
    type: chatroom.rows[0].chatroom_type,
    createdAt: chatroom.rows[0].created_at,
    numUsers: 1
  }
}

export async function findNewPrivateChatroom(chatroomId: string): Promise<toClientPrivateChatroom> {
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
  const chatroom = await pg.query(`
    SELECT *
    FROM chatroom_users
    WHERE chatroom_id = ${chatRoomId}
      AND user_id = ${userId}`)

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
  const savedMessage = await pg.query(`
    INSERT INTO chat_messages (chatroom_id, user_id, message, message_type)
    VALUES ('${chatRoomId}', '${userId}', '${message.text}', 'text')
    RETURNING *`)
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