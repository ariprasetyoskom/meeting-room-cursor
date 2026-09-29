import { relations } from "drizzle-orm";
import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
} from "drizzle-orm/pg-core";

export const bookingStatusEnum = pgEnum("booking_status", [
  "confirmed",
  "cancelled",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalSub: text("external_sub").unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().$type<"employee" | "admin">(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  floor: text("floor"),
  capacity: integer("capacity").notNull(),
  amenities: jsonb("amenities").notNull().$type<string[]>().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id),
  organizerUserId: uuid("organizer_user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  status: bookingStatusEnum("status").notNull().default("confirmed"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancelledBy: uuid("cancelled_by").references(() => users.id),
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: text("action").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  organizedBookings: many(bookings, { relationName: "organizer" }),
  cancelledBookings: many(bookings, { relationName: "cancelledBy" }),
  auditLogs: many(auditLogs),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  room: one(rooms, {
    fields: [bookings.roomId],
    references: [rooms.id],
  }),
  organizer: one(users, {
    fields: [bookings.organizerUserId],
    references: [users.id],
    relationName: "organizer",
  }),
  cancelledByUser: one(users, {
    fields: [bookings.cancelledBy],
    references: [users.id],
    relationName: "cancelledBy",
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
