import { pgTable, text, real, integer, timestamp } from "drizzle-orm/pg-core";

export const customersTable = pgTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  location: text("location"),
  notes: text("notes"),
  total_orders: integer("total_orders").notNull().default(0),
  total_spent: real("total_spent").notNull().default(0),
  last_order_date: text("last_order_date").notNull().default(""),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Customer = typeof customersTable.$inferSelect;
