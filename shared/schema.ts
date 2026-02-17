import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  mood: integer("mood"),
  prompt: text("prompt"),
  isHighlight: boolean("is_highlight").default(false),
  isDream: boolean("is_dream").default(false),
  tags: text("tags").array(),
  mentions: text("mentions").array(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

export const dailyPrompts = pgTable("daily_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  category: text("category").notNull(),
});

export const insertDailyPromptSchema = createInsertSchema(dailyPrompts).omit({
  id: true,
});

export type InsertDailyPrompt = z.infer<typeof insertDailyPromptSchema>;
export type DailyPrompt = typeof dailyPrompts.$inferSelect;

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`'default'`),
  reminderTime: text("reminder_time"),
  dailyGoal: integer("daily_goal").default(1),
  theme: text("theme").default("light"),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
});

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

export const wisdomEntries = pgTable("wisdom_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  category: text("category").notNull(),
  source: text("source"),
  author: text("author"),
  lastShownAt: timestamp("last_shown_at"),
  showCount: integer("show_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWisdomEntrySchema = createInsertSchema(wisdomEntries).omit({
  id: true,
  createdAt: true,
  lastShownAt: true,
  showCount: true,
});

export type InsertWisdomEntry = z.infer<typeof insertWisdomEntrySchema>;
export type WisdomEntry = typeof wisdomEntries.$inferSelect;

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  labels: text("labels").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

export const tagSettings = pgTable("tag_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tagName: text("tag_name").notNull().unique(),
  goal: text("goal").default("none"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTagSettingSchema = createInsertSchema(tagSettings).omit({
  id: true,
  createdAt: true,
});

export type InsertTagSetting = z.infer<typeof insertTagSettingSchema>;
export type TagSetting = typeof tagSettings.$inferSelect;
