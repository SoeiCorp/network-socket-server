// import { prisma } from '../lib/prisma';
import { chatMessages, chatroomUsers } from "./drizzle/migrations/schema"
import { db } from "./drizzle/db"
import { toClientMessage, toServerImageMessage, toServerTextMessage } from "./types"
import { and, eq } from "drizzle-orm"
// import { uploadImageToS3 } from './uploadImageToS3';
// import getS3URL from '../actions/public/S3/getS3URL';

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
  const savedMessage = await db
    .insert(chatMessages)
    .values({
      chatroomId: parseInt(chatRoomId),
      userId: parseInt(userId),
      message: message.text,
      messageType: "text",
    })
    .returning()

  const messageToClient: toClientMessage = {
    id: savedMessage[0].id,
    userId: savedMessage[0].userId,
    createdAt: savedMessage[0].createdAt,
    content: savedMessage[0].message,
    type: savedMessage[0].messageType,
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
