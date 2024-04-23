import {
    validChatRoom,
    saveTextMessage,
    findPrivateChatroom,
    findNewGroupChatroom,
    findAllChatroom,
    findNewPrivateChatroom,
} from "./db.service";
import http from "http";
import { Server } from "socket.io";
import * as dotenv from "dotenv";
dotenv.config();

const server = http.createServer((req, res) => { });

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true,
    },
    maxHttpBufferSize: 5 * 1e6,
    pingTimeout: 600000,
});

type onlineUsersType = {
    [userId: number]: string;
};

const onlineUsers: onlineUsersType = {};

io.on("connection", async (socket) => {
    console.log("User connected:", socket.id);
    socket.on("login", async (userId) => {
        console.log("Logged-In User Id:", userId);
        onlineUsers[Number(userId)] = socket.id;
        io.emit("users online", [...Object.keys(onlineUsers)]);
        socket.join("general");
        // console.log([...Object.keys(onlineUsers)])
        const allGroupChatroom = await findAllChatroom(userId);
        for (let chatroom of allGroupChatroom) {
            console.log(`chatroom: ${chatroom.id}`)
            socket.join(`chatroom: ${chatroom.id}`);
            // console.log(chatroom.id)
        }
    });

    socket.on('update user', async (userId, name) => {
        io.to('general').emit(
            "update user",
            userId,
            name
        );

    })

    socket.on("private message", async (recipientId, message) => {
        // console.log(recipientId, message)
        const senderUserId = Object.keys(onlineUsers).find(
            (key) => onlineUsers[Number(key)] === socket.id
        );
        if (senderUserId == recipientId) {
            return;
        }
        const { success, chatroom } = await findPrivateChatroom(
            recipientId,
            senderUserId
        );
        if (!success) {
            return;
        }
        let messageToClient = message;
        if (typeof message === "string") {
            messageToClient = await saveTextMessage(chatroom.id, senderUserId, {
                text: message,
            });
        }
        const recipientSocketId = onlineUsers[recipientId];
        io.to(recipientSocketId).emit(
            "private message",
            senderUserId,
            messageToClient
        );
        socket.emit("private message sent", recipientId, messageToClient);
    });

    socket.on("group message", async (chatroomId, message, recipientId) => {
        console.log(chatroomId, message, recipientId)
        const senderUserId = Object.keys(onlineUsers).find(
            (key) => onlineUsers[Number(key)] === socket.id
        );
        const isValid = await validChatRoom(chatroomId, senderUserId);
        if (!isValid) {
            return;
        }
        let messageToClient = message;
        if (typeof message === "string") {
            messageToClient = await saveTextMessage(chatroomId, senderUserId, {
                text: message,
            });
            console.log("messageToClient", messageToClient)
        }
        const recipientSocketId = onlineUsers[recipientId];
        console.log(`chatroom: ${chatroomId}`)
        io.to(`chatroom: ${chatroomId}`).emit(
            "group message",
            chatroomId,
            messageToClient,
            senderUserId
        );
        // socket.emit('group message sent', chatroomId, message, recipientId)
    });

    socket.on("create group", async (chatroomId) => {
        // console.log(socket.id, chatroomId);
        let chatroomToClient = chatroomId;
        if (typeof chatroomId === "number") {
            chatroomToClient = await findNewGroupChatroom(chatroomId.toString());
        }
        io.to("general").emit("create group", chatroomToClient);
        socket.join(`chatroom: ${chatroomId}`);
    });

    socket.on("create private", async (chatroomId) => {
        if (typeof chatroomId === "string") {
            const chatroomToClient = await findNewPrivateChatroom(chatroomId);
            let socketId1 = onlineUsers[chatroomToClient.userId1];
            let socketId2 = onlineUsers[chatroomToClient.userId1];
            let recipientSocketId = socket.id === socketId1 ? socketId2 : socketId1;
            io.to(recipientSocketId).emit("create private", chatroomId);
        }
        socket.join(`chatroom: ${chatroomId}`);
        // console.log(socket.id, chatroomId);
    });

    socket.on("join group", async (chatroomId, recipientId) => {
        // console.log(chatroomId, recipientId);
        const joinUserId = Object.keys(onlineUsers).find(
            (key) => onlineUsers[Number(key)] === socket.id
        );
        io.to('general').emit("join group", chatroomId, joinUserId);
        socket.emit("join group sent", chatroomId, recipientId);
        socket.join(`chatroom: ${chatroomId}`);
    });

    socket.on("leave group", async (chatroomId, recipientId) => {
        // console.log(chatroomId, recipientId)
        const leaveUserId = Object.keys(onlineUsers).find(
            (key) => onlineUsers[Number(key)] === socket.id
        );
        io.to('general').emit(
            "join group",
            chatroomId,
            leaveUserId
        );
        socket.emit("join group sent", chatroomId, recipientId);
        socket.leave(`chatroom: ${chatroomId}`);
    });

    socket.on("disconnect", () => {
        // console.log("User disconnected:", socket.id);
        delete onlineUsers[
            Number(
                Object.keys(onlineUsers).find(
                    (key) => onlineUsers[Number(key)] === socket.id
                )
            )
        ];
        io.emit("users online", Object.keys(onlineUsers));
    });
});

server.listen(process.env.PORT || "3001", () => {
    console.log(`WebSocket server listening on port ${process.env.PORT}`);
});
