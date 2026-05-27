import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
