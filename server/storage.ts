import { db } from "./db";
import { journalEntries, dailyPrompts, userSettings, wisdomEntries, notes, tagSettings } from "@shared/schema";
import type {
  JournalEntry, InsertJournalEntry, DailyPrompt, InsertDailyPrompt,
  UserSettings, InsertUserSettings, WisdomEntry, InsertWisdomEntry,
  Note, InsertNote, TagSetting, InsertTagSetting
} from "@shared/schema";
import { eq, desc, sql, and, gte, lte, count, asc } from "drizzle-orm";

export interface IStorage {
  createEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  getEntriesByDate(date: string): Promise<JournalEntry[]>;
  getRecentEntries(limit?: number): Promise<JournalEntry[]>;
  getEntryStats(): Promise<{ streak: number; totalEntries: number; weeklyEntries: number }>;
  getCalendarData(year: number, month: number): Promise<Record<string, number>>;
  deleteEntry(id: string): Promise<void>;
  getHighlightEntries(): Promise<JournalEntry[]>;
  getDreamEntries(): Promise<JournalEntry[]>;
  getAllEntries(): Promise<JournalEntry[]>;
  getAllTags(): Promise<{ name: string; count: number }[]>;
  getAllPeople(): Promise<{ name: string; count: number }[]>;
  getEntriesByTag(tag: string): Promise<JournalEntry[]>;
  getEntriesByPerson(person: string): Promise<JournalEntry[]>;
  getRandomPrompt(): Promise<DailyPrompt | undefined>;
  seedPrompts(): Promise<void>;
  getSettings(): Promise<UserSettings | undefined>;
  updateSettings(settings: InsertUserSettings): Promise<UserSettings>;
  seedSampleEntries(): Promise<void>;

  createWisdomEntry(entry: InsertWisdomEntry): Promise<WisdomEntry>;
  getAllWisdomEntries(): Promise<WisdomEntry[]>;
  getWisdomByCategory(category: string): Promise<WisdomEntry[]>;
  getRandomWisdom(limit?: number): Promise<WisdomEntry[]>;
  deleteWisdomEntry(id: string): Promise<void>;
  seedWisdomEntries(): Promise<void>;

  createNote(note: InsertNote): Promise<Note>;
  getAllNotes(): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note>;
  deleteNote(id: string): Promise<void>;

  getTagSetting(tagName: string): Promise<TagSetting | undefined>;
  upsertTagSetting(setting: InsertTagSetting): Promise<TagSetting>;
  getAllTagSettings(): Promise<TagSetting[]>;
}

export class DatabaseStorage implements IStorage {
  async createEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [created] = await db.insert(journalEntries).values(entry).returning();
    return created;
  }

  async getEntriesByDate(date: string): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.date, date))
      .orderBy(journalEntries.createdAt);
  }

  async getRecentEntries(limit: number = 50): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .orderBy(desc(journalEntries.date), desc(journalEntries.createdAt))
      .limit(limit);
  }

  async getEntryStats(): Promise<{ streak: number; totalEntries: number; weeklyEntries: number }> {
    const totalResult = await db.select({ count: count() }).from(journalEntries);
    const totalEntries = totalResult[0]?.count ?? 0;

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weekStart = sevenDaysAgo.toISOString().split("T")[0];

    const weeklyResult = await db
      .select({ count: count() })
      .from(journalEntries)
      .where(gte(journalEntries.date, weekStart));
    const weeklyEntries = weeklyResult[0]?.count ?? 0;

    const distinctDates = await db
      .selectDistinct({ date: journalEntries.date })
      .from(journalEntries)
      .orderBy(desc(journalEntries.date));

    let streak = 0;
    const todayStr = today.toISOString().split("T")[0];
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

    if (distinctDates.length > 0) {
      const firstDate = distinctDates[0].date;
      let expectedDate: Date;

      if (firstDate === todayStr) {
        expectedDate = new Date(todayStr);
      } else if (firstDate === yesterdayStr) {
        expectedDate = new Date(yesterdayStr);
      } else {
        return { streak: 0, totalEntries, weeklyEntries };
      }

      for (const row of distinctDates) {
        const expectedStr = expectedDate.toISOString().split("T")[0];
        if (row.date === expectedStr) {
          streak++;
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return { streak, totalEntries, weeklyEntries };
  }

  async getCalendarData(year: number, month: number): Promise<Record<string, number>> {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    const results = await db
      .select({ date: journalEntries.date, count: count() })
      .from(journalEntries)
      .where(and(gte(journalEntries.date, startDate), lte(journalEntries.date, endDate)))
      .groupBy(journalEntries.date);

    const data: Record<string, number> = {};
    for (const row of results) {
      data[row.date] = row.count;
    }
    return data;
  }

  async deleteEntry(id: string): Promise<void> {
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
  }

  async getRandomPrompt(): Promise<DailyPrompt | undefined> {
    const [prompt] = await db.select().from(dailyPrompts).orderBy(sql`random()`).limit(1);
    return prompt;
  }

  async seedPrompts(): Promise<void> {
    const existing = await db.select({ count: count() }).from(dailyPrompts);
    if (existing[0].count > 0) return;

    const prompts: InsertDailyPrompt[] = [
      { text: "What are three things you're grateful for today?", category: "Gratitude" },
      { text: "Who made a positive impact on your life recently?", category: "Gratitude" },
      { text: "What small moment brought you joy today?", category: "Gratitude" },
      { text: "What challenged you today and how did you handle it?", category: "Reflection" },
      { text: "What would you tell your younger self?", category: "Reflection" },
      { text: "What's something you learned recently that changed your perspective?", category: "Reflection" },
      { text: "What habit would you like to build or break?", category: "Growth" },
      { text: "What's one step you can take today toward a goal?", category: "Growth" },
      { text: "How have you grown in the last year?", category: "Growth" },
      { text: "How are you feeling right now, without judgment?", category: "Mindfulness" },
      { text: "What does your ideal day look like?", category: "Mindfulness" },
      { text: "What sounds, smells, or textures did you notice today?", category: "Mindfulness" },
      { text: "If you could live anywhere for a year, where and why?", category: "Creativity" },
      { text: "Describe a memory that always makes you smile.", category: "Creativity" },
      { text: "What would you create if you had unlimited resources?", category: "Creativity" },
    ];

    await db.insert(dailyPrompts).values(prompts);
  }

  async getSettings(): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).limit(1);
    return settings;
  }

  async updateSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const existing = await this.getSettings();
    if (existing) {
      const [updated] = await db.update(userSettings).set(settings).where(eq(userSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(userSettings).values({ ...settings, id: "default" }).returning();
    return created;
  }

  async getHighlightEntries(): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries).where(eq(journalEntries.isHighlight, true)).orderBy(desc(journalEntries.date), desc(journalEntries.createdAt));
  }

  async getDreamEntries(): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries).where(eq(journalEntries.isDream, true)).orderBy(desc(journalEntries.date), desc(journalEntries.createdAt));
  }

  async getAllEntries(): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries).orderBy(desc(journalEntries.date), desc(journalEntries.createdAt));
  }

  async getAllTags(): Promise<{ name: string; count: number }[]> {
    const entries = await db.select({ tags: journalEntries.tags }).from(journalEntries);
    const tagCounts: Record<string, number> = {};
    for (const entry of entries) {
      if (entry.tags) {
        for (const tag of entry.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }
    return Object.entries(tagCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }

  async getAllPeople(): Promise<{ name: string; count: number }[]> {
    const entries = await db.select({ mentions: journalEntries.mentions }).from(journalEntries);
    const peopleCounts: Record<string, number> = {};
    for (const entry of entries) {
      if (entry.mentions) {
        for (const person of entry.mentions) {
          peopleCounts[person] = (peopleCounts[person] || 0) + 1;
        }
      }
    }
    return Object.entries(peopleCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }

  async getEntriesByTag(tag: string): Promise<JournalEntry[]> {
    const allEntries = await db.select().from(journalEntries).orderBy(desc(journalEntries.date), desc(journalEntries.createdAt));
    return allEntries.filter((e) => e.tags && e.tags.includes(tag));
  }

  async getEntriesByPerson(person: string): Promise<JournalEntry[]> {
    const allEntries = await db.select().from(journalEntries).orderBy(desc(journalEntries.date), desc(journalEntries.createdAt));
    return allEntries.filter((e) => e.mentions && e.mentions.includes(person));
  }

  // Wisdom
  async createWisdomEntry(entry: InsertWisdomEntry): Promise<WisdomEntry> {
    const [created] = await db.insert(wisdomEntries).values(entry).returning();
    return created;
  }

  async getAllWisdomEntries(): Promise<WisdomEntry[]> {
    return await db.select().from(wisdomEntries).orderBy(desc(wisdomEntries.createdAt));
  }

  async getWisdomByCategory(category: string): Promise<WisdomEntry[]> {
    return await db.select().from(wisdomEntries).where(eq(wisdomEntries.category, category)).orderBy(desc(wisdomEntries.createdAt));
  }

  async getRandomWisdom(limit: number = 3): Promise<WisdomEntry[]> {
    return await db.select().from(wisdomEntries).orderBy(sql`random() * (1.0 / (COALESCE(show_count, 0) + 1))`).limit(limit);
  }

  async deleteWisdomEntry(id: string): Promise<void> {
    await db.delete(wisdomEntries).where(eq(wisdomEntries.id, id));
  }

  async seedWisdomEntries(): Promise<void> {
    const existing = await db.select({ count: count() }).from(wisdomEntries);
    if (existing[0].count > 0) return;

    const entries: InsertWisdomEntry[] = [
      { content: "money is power", category: "fact", source: "rich dad, poor dad", author: null },
      { content: "liking the idea of having business is not the same as liking to actually run it", category: "quote", source: null, author: "wiktoria pawlak" },
      { content: "i didn't go this far to only get this far", category: "quote", source: null, author: "wiktoria pawlak" },
      { content: "be as diverse in everything in your life as possible", category: "thought", source: null, author: null },
      { content: "there is some part of you that needs to die for your idea to be born as solo founder", category: "quote", source: null, author: "wiktoria pawlak" },
      { content: "shipping fast beats every strategy", category: "quote", source: null, author: "elon musk" },
      { content: "a startup is an mri for the soul", category: "quote", source: null, author: "max hodak" },
      { content: "being fast beats the best strategy", category: "fact", source: "twitter", author: null },
      { content: "the best time to plant a tree was 20 years ago. the second best time is now", category: "quote", source: null, author: "chinese proverb" },
      { content: "done is better than perfect", category: "thought", source: null, author: null },
      { content: "consistency compounds faster than intensity", category: "lesson", source: null, author: null },
      { content: "your network is your net worth", category: "fact", source: null, author: null },
      { content: "read more books than tweets", category: "thought", source: null, author: null },
      { content: "the obstacle is the way", category: "excerpt", source: "The Obstacle Is The Way", author: "ryan holiday" },
    ];

    await db.insert(wisdomEntries).values(entries);
  }

  // Notes
  async createNote(note: InsertNote): Promise<Note> {
    const [created] = await db.insert(notes).values(note).returning();
    return created;
  }

  async getAllNotes(): Promise<Note[]> {
    return await db.select().from(notes).orderBy(desc(notes.updatedAt));
  }

  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async updateNote(id: string, note: Partial<InsertNote>): Promise<Note> {
    const [updated] = await db.update(notes).set({ ...note, updatedAt: new Date() }).where(eq(notes.id, id)).returning();
    return updated;
  }

  async deleteNote(id: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  // Tag Settings
  async getTagSetting(tagName: string): Promise<TagSetting | undefined> {
    const [setting] = await db.select().from(tagSettings).where(eq(tagSettings.tagName, tagName));
    return setting;
  }

  async upsertTagSetting(setting: InsertTagSetting): Promise<TagSetting> {
    const existing = await this.getTagSetting(setting.tagName);
    if (existing) {
      const [updated] = await db.update(tagSettings).set(setting).where(eq(tagSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(tagSettings).values(setting).returning();
    return created;
  }

  async getAllTagSettings(): Promise<TagSetting[]> {
    return await db.select().from(tagSettings);
  }

  async seedSampleEntries(): Promise<void> {
    const existing = await db.select({ count: count() }).from(journalEntries);
    if (existing[0].count > 0) return;

    const today = new Date();
    const formatDate = (daysAgo: number): string => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split("T")[0];
    };

    const entries: InsertJournalEntry[] = [
      { content: "Had a wonderful morning walk today. The air was crisp and the sky was painted in shades of orange and pink.", mood: 5, date: formatDate(0), prompt: null, tags: ["walking", "morning"], mentions: [] },
      { content: "Meeting with @sarah about the #productivity framework. Really helpful session.", mood: 4, date: formatDate(0), prompt: null, tags: ["productivity"], mentions: ["sarah"] },
      { content: "Started reading a new book on #mindfulness. Tried being more aware during commute.", mood: 4, date: formatDate(1), prompt: "What sounds, smells, or textures did you notice today?", tags: ["mindfulness", "reading"], mentions: [] },
      { content: "Feeling overwhelmed with #work deadlines. Made a to-do list which helped.", mood: 2, date: formatDate(3), prompt: null, tags: ["work"], mentions: [] },
      { content: "Tried a new #cooking recipe - homemade pasta with pesto. Worth the messy kitchen.", mood: 4, date: formatDate(4), prompt: null, tags: ["cooking"], mentions: [], isHighlight: true },
      { content: "Long phone call with @emma. We picked up right where we left off. Grateful for lasting friendships.", mood: 5, date: formatDate(5), prompt: "Who made a positive impact on your life recently?", tags: ["gratitude"], mentions: ["emma"], isHighlight: true },
      { content: "Spent afternoon organizing workspace. Found old notes from last year.", mood: 3, date: formatDate(7), prompt: null, tags: [], mentions: [] },
      { content: "Rainy day. Stayed in with tea and watched droplets race down the window.", mood: 4, date: formatDate(9), prompt: null, tags: [], mentions: [] },
      { content: "Set a personal #goal to write in this journal every day.", mood: 4, date: formatDate(10), prompt: "What habit would you like to build or break?", tags: ["goal"], mentions: [] },
      { content: "Went for a #hiking trip in the nearby trail. Beautiful autumn leaves.", mood: 5, date: formatDate(12), prompt: null, tags: ["hiking", "nature"], mentions: [], isHighlight: true },
      { content: "Tough day at #work but solved a problem I was stuck on for days.", mood: 3, date: formatDate(13), prompt: null, tags: ["work"], mentions: [] },
      { content: "Dreamed about flying over a mountain range. The colors were incredibly vivid.", mood: 4, date: formatDate(2), prompt: null, tags: [], mentions: [], isDream: true },
      { content: "Had a dream about visiting a library with infinite floors.", mood: 3, date: formatDate(8), prompt: null, tags: [], mentions: [], isDream: true },
      { content: "First day at the new #job. Everyone was welcoming. @david showed me around.", mood: 5, date: formatDate(365), prompt: null, tags: ["job"], mentions: ["david"], isHighlight: true },
      { content: "Nervous but excited. This feels like the start of something great.", mood: 4, date: formatDate(365), prompt: null, tags: [], mentions: [] },
      { content: "Celebrated @emma's birthday. We went to that rooftop restaurant downtown.", mood: 5, date: formatDate(364), prompt: null, tags: ["celebration"], mentions: ["emma"], isHighlight: true },
      { content: "Morning #yoga session. Finally nailed the crow pose.", mood: 4, date: formatDate(363), prompt: null, tags: ["yoga", "fitness"], mentions: [] },
      { content: "Dreamed about swimming in a glowing ocean. Everything was turquoise.", mood: 3, date: formatDate(362), prompt: null, tags: [], mentions: [], isDream: true },
      { content: "Coffee with @marcus discussing #startup ideas. His energy is infectious.", mood: 4, date: formatDate(360), prompt: null, tags: ["startup"], mentions: ["marcus"] },
      { content: "Finished the #reading challenge - 52 books this year. Proud of sticking with it.", mood: 5, date: formatDate(358), prompt: null, tags: ["reading", "goal"], mentions: [], isHighlight: true },
      { content: "Quiet Sunday. Made sourdough bread from scratch. #cooking", mood: 4, date: formatDate(355), prompt: null, tags: ["cooking"], mentions: [] },
      { content: "Launched the first version of the #project. @sarah and @david stayed late to help.", mood: 5, date: formatDate(180), prompt: null, tags: ["project", "work"], mentions: ["sarah", "david"], isHighlight: true },
      { content: "Team dinner to celebrate the launch. Feeling grateful for this crew.", mood: 5, date: formatDate(180), prompt: null, tags: ["celebration", "gratitude"], mentions: [], isHighlight: true },
      { content: "Started a new #meditation practice. Just 10 minutes a day.", mood: 3, date: formatDate(178), prompt: null, tags: ["meditation", "mindfulness"], mentions: [] },
      { content: "Dreamed about a city made entirely of glass. Everything reflected the sunset.", mood: 4, date: formatDate(175), prompt: null, tags: [], mentions: [], isDream: true },
      { content: "@emma recommended a #podcast about deep work. Listened to 3 episodes today.", mood: 4, date: formatDate(170), prompt: null, tags: ["podcast"], mentions: ["emma"] },
      { content: "Ran my first 10K #running race. Finished in 52 minutes.", mood: 5, date: formatDate(165), prompt: null, tags: ["running", "fitness"], mentions: [], isHighlight: true },
      { content: "Quarterly review at #work went really well. Got positive feedback on the #project.", mood: 5, date: formatDate(90), prompt: null, tags: ["work", "project"], mentions: [] },
      { content: "Spent the weekend #hiking with @marcus. Found an amazing waterfall trail.", mood: 5, date: formatDate(88), prompt: null, tags: ["hiking", "nature"], mentions: ["marcus"], isHighlight: true },
      { content: "Dreamed I was in a bookstore that kept changing its layout.", mood: 3, date: formatDate(85), prompt: null, tags: [], mentions: [], isDream: true },
      { content: "Started learning #piano. My fingers hurt but it's rewarding.", mood: 3, date: formatDate(80), prompt: null, tags: ["piano", "learning"], mentions: [] },
      { content: "Deep conversation with @david about life goals. We both want to travel more.", mood: 4, date: formatDate(75), prompt: null, tags: ["travel"], mentions: ["david"] },
      { content: "Morning #yoga and then worked on the #writing project all day.", mood: 4, date: formatDate(30), prompt: null, tags: ["yoga", "writing"], mentions: [] },
      { content: "@sarah shared a great #productivity tip: time-blocking with 90-minute deep work sessions.", mood: 4, date: formatDate(28), prompt: null, tags: ["productivity"], mentions: ["sarah"] },
      { content: "Cooked dinner for friends. Tried a Thai curry recipe. #cooking", mood: 5, date: formatDate(25), prompt: null, tags: ["cooking"], mentions: [], isHighlight: true },
      { content: "Dreamed about a forest where all the trees were made of light.", mood: 4, date: formatDate(22), prompt: null, tags: [], mentions: [], isDream: true },
      { content: "Finished a #book that changed how I think about #creativity.", mood: 5, date: formatDate(20), prompt: null, tags: ["book", "creativity", "reading"], mentions: [], isHighlight: true },
      { content: "Quick lunch with @emma. She's planning a trip to Japan.", mood: 4, date: formatDate(18), prompt: null, tags: ["travel"], mentions: ["emma"] },
      { content: "Hit a personal best on #running - 5K in under 24 minutes.", mood: 5, date: formatDate(15), prompt: null, tags: ["running", "fitness"], mentions: [], isHighlight: true },
    ];

    await db.insert(journalEntries).values(entries);
  }
}

export const storage = new DatabaseStorage();
