import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJournalEntrySchema, insertWisdomEntrySchema, insertNoteSchema, insertTagSettingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await storage.seedPrompts();
  await storage.seedSampleEntries();
  await storage.seedWisdomEntries();

  app.post("/api/entries", async (req, res) => {
    try {
      const parsed = insertJournalEntrySchema.parse(req.body);
      const tagMatches = parsed.content.match(/#(\w+)/g);
      const mentionMatches = parsed.content.match(/@(\w+)/g);
      const tags = tagMatches ? [...new Set(tagMatches.map((t) => t.slice(1).toLowerCase()))] : [];
      const mentions = mentionMatches ? [...new Set(mentionMatches.map((m) => m.slice(1).toLowerCase()))] : [];
      const entryData = {
        ...parsed,
        tags: tags.length > 0 ? tags : parsed.tags || [],
        mentions: mentions.length > 0 ? mentions : parsed.mentions || [],
      };
      const entry = await storage.createEntry(entryData);
      res.json(entry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/entries/recent", async (req, res) => {
    try {
      const entries = await storage.getRecentEntries();
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/entries/stats", async (req, res) => {
    try {
      const stats = await storage.getEntryStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/entries/calendar", async (req, res) => {
    try {
      const month = req.query.month as string;
      if (!month) return res.status(400).json({ message: "month query parameter required" });
      const [year, m] = month.split("-").map(Number);
      const data = await storage.getCalendarData(year, m);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/entries/highlights", async (req, res) => {
    try {
      const entries = await storage.getHighlightEntries();
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/entries/dreams", async (req, res) => {
    try {
      const entries = await storage.getDreamEntries();
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/entries/all", async (req, res) => {
    try {
      const entries = await storage.getAllEntries();
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tags", async (req, res) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/people", async (req, res) => {
    try {
      const people = await storage.getAllPeople();
      res.json(people);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/entries/by-tag/:tag", async (req, res) => {
    try {
      const entries = await storage.getEntriesByTag(req.params.tag);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/entries/by-person/:person", async (req, res) => {
    try {
      const entries = await storage.getEntriesByPerson(req.params.person);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/entries", async (req, res) => {
    try {
      const date = req.query.date as string;
      if (!date) return res.status(400).json({ message: "date query parameter required" });
      const entries = await storage.getEntriesByDate(date);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/entries/:id", async (req, res) => {
    try {
      await storage.deleteEntry(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/prompts/random", async (req, res) => {
    try {
      const prompt = await storage.getRandomPrompt();
      res.json(prompt || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings || { theme: "light", dailyGoal: 1, reminderTime: null });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const settings = await storage.updateSettings(req.body);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Wisdom
  app.get("/api/wisdom", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      if (category && category !== "all") {
        const entries = await storage.getWisdomByCategory(category);
        res.json(entries);
      } else {
        const entries = await storage.getAllWisdomEntries();
        res.json(entries);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/wisdom/random", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 3;
      const entries = await storage.getRandomWisdom(limit);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/wisdom", async (req, res) => {
    try {
      const parsed = insertWisdomEntrySchema.parse(req.body);
      const entry = await storage.createWisdomEntry(parsed);
      res.json(entry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/wisdom/:id", async (req, res) => {
    try {
      await storage.deleteWisdomEntry(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notes
  app.get("/api/notes", async (req, res) => {
    try {
      const allNotes = await storage.getAllNotes();
      res.json(allNotes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) return res.status(404).json({ message: "Note not found" });
      res.json(note);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const parsed = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(parsed);
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.updateNote(req.params.id, req.body);
      res.json(note);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      await storage.deleteNote(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Tag Settings
  app.get("/api/tag-settings", async (req, res) => {
    try {
      const settings = await storage.getAllTagSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tag-settings/:tagName", async (req, res) => {
    try {
      const setting = await storage.getTagSetting(req.params.tagName);
      res.json(setting || { tagName: req.params.tagName, goal: "none" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tag-settings", async (req, res) => {
    try {
      const parsed = insertTagSettingSchema.parse(req.body);
      const setting = await storage.upsertTagSetting(parsed);
      res.json(setting);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  return httpServer;
}
