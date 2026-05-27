import { pgTable, text, real, timestamp, jsonb } from "drizzle-orm/pg-core";

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  customer_id: text("customer_id").notNull(),
  restaurant_id: text("restaurant_id").notNull(),
  restaurant_name: text("restaurant_name").notNull(),
  branch_id: text("branch_id").notNull(),
  branch_name: text("branch_name").notNull(),
  items: jsonb("items").notNull(),
  total: real("total").notNull().default(0),
  type: text("type").notNull().default("delivery"),
  status: text("status").notNull().default("pending"),
  delivery_address: text("delivery_address"),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Order = typeof ordersTable.$inferSelect;
