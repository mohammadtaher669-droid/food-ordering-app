import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const categoriesTable = pgTable("categories", {
  id: text("id").primaryKey(),
  restaurant_id: text("restaurant_id").notNull(),
  name_en: text("name_en").notNull(),
  name_ar: text("name_ar").notNull(),
  sort_order: integer("sort_order").notNull().default(0),
  hidden: boolean("hidden").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Category = typeof categoriesTable.$inferSelect;
