import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const contactMessagesTable = sqliteTable("contact_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});