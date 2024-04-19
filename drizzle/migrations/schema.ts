import { pgTable, pgEnum, serial, text, timestamp, foreignKey, integer, uniqueIndex, unique, primaryKey } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const messageType = pgEnum("message_type", ['image', 'text'])
export const chatroomType = pgEnum("chatroom_type", ['group', 'private'])


export const chatrooms = pgTable("chatrooms", {
	id: serial("id").primaryKey().notNull(),
	name: text("name"),
	chatroomType: chatroomType("chatroom_type").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
	id: serial("id").primaryKey().notNull(),
	chatroomId: integer("chatroom_id").notNull().references(() => chatrooms.id),
	userId: integer("user_id").notNull().references(() => users.id),
	message: text("message").notNull(),
	messageType: messageType("message_type").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const users = pgTable("users", {
	id: serial("id").primaryKey().notNull(),
	name: text("name"),
	email: text("email").notNull(),
	password: text("password").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		uniqueIdx: uniqueIndex("unique_idx").on(table.email),
		usersEmailUnique: unique("users_email_unique").on(table.email),
	}
});

export const chatroomUsers = pgTable("chatroom_users", {
	chatroomId: integer("chatroom_id").notNull().references(() => chatrooms.id),
	userId: integer("user_id").notNull().references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		chatroomUsersChatroomIdUserIdPk: primaryKey({ columns: [table.chatroomId, table.userId], name: "chatroom_users_chatroom_id_user_id_pk"})
	}
});