import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { JournalEntry, WisdomEntry } from "@shared/schema";
import { useMemo, useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Heart, Hash, Users, BookOpen, Moon, Lightbulb } from "lucide-react";

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type InsightTab = "journal" | "dreams" | "highlights" | "tags" | "people" | "wisdom";

const tabs: { id: InsightTab; label: string; icon: typeof BookOpen; color: string }[] = [
  { id: "journal", label: "Journal", icon: BookOpen, color: "hsl(30, 10%, 30%)" },
  { id: "dreams", label: "Dreams", icon: Moon, color: "hsl(35, 85%, 45%)" },
  { id: "highlights", label: "Highlights", icon: Heart, color: "hsl(0, 75%, 50%)" },
  { id: "tags", label: "Tags", icon: Hash, color: "hsl(230, 60%, 55%)" },
  { id: "people", label: "People", icon: Users, color: "hsl(140, 50%, 40%)" },
  { id: "wisdom", label: "Wisdom", icon: Lightbulb, color: "hsl(270, 55%, 50%)" },
];

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState<InsightTab>("journal");

  const { data: allEntries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/entries/all"],
  });

  const { data: wisdomEntries } = useQuery<WisdomEntry[]>({
    queryKey: ["/api/wisdom"],
  });

  const filteredEntries = useMemo(() => {
    if (!allEntries) return [];
    switch (activeTab) {
      case "dreams":
        return allEntries.filter((e) => e.isDream);
      case "highlights":
        return allEntries.filter((e) => e.isHighlight);
      case "tags":
        return allEntries.filter((e) => e.tags && e.tags.length > 0);
      case "people":
        return allEntries.filter((e) => e.mentions && e.mentions.length > 0);
      default:
        return allEntries;
    }
  }, [allEntries, activeTab]);

  const stats = useMemo(() => {
    if (!allEntries || allEntries.length === 0) {
      return { journalAge: 0, totalWords: 0, wordsPerDay: 0, highlightCount: 0, tagCount: 0, mentionCount: 0 };
    }
    const dates = Array.from(new Set(allEntries.map((e) => e.date))).sort();
    const firstDate = new Date(dates[0] + "T12:00:00");
    const now = new Date();
    const ageDays = Math.max(1, Math.floor((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    const totalWords = allEntries.reduce((sum, e) => sum + e.content.split(/\s+/).length, 0);
    const highlights = allEntries.filter((e) => e.isHighlight).length;
    const allTags = new Set(allEntries.flatMap((e) => e.tags || []));
    const allMentions = new Set(allEntries.flatMap((e) => e.mentions || []));

    return {
      journalAge: ageDays,
      totalWords,
      wordsPerDay: Math.round(totalWords / ageDays),
      highlightCount: highlights,
      tagCount: allTags.size,
      mentionCount: allMentions.size,
    };
  }, [allEntries]);

  const heatmapData = useMemo(() => {
    const entries = activeTab === "wisdom" ? [] : filteredEntries;
    const counts: Record<string, number> = {};
    for (const entry of entries) {
      counts[entry.date] = (counts[entry.date] || 0) + 1;
    }

    const weeks: { date: string; count: number; dayOfWeek: number }[][] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentWeek: { date: string; count: number; dayOfWeek: number }[] = [];
    const d = new Date(startDate);
    while (d <= today) {
      const dateStr = formatDate(d);
      currentWeek.push({ date: dateStr, count: counts[dateStr] || 0, dayOfWeek: d.getDay() });
      if (d.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      d.setDate(d.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);
    return weeks;
  }, [filteredEntries, activeTab]);

  const maxHeatCount = useMemo(() => {
    return Math.max(1, ...heatmapData.flat().map((d) => d.count));
  }, [heatmapData]);

  const heatColor = useMemo(() => {
    switch (activeTab) {
      case "dreams": return { h: 35, s: 85 };
      case "highlights": return { h: 0, s: 75 };
      case "tags": return { h: 230, s: 60 };
      case "people": return { h: 140, s: 50 };
      case "wisdom": return { h: 270, s: 55 };
      default: return { h: 35, s: 85 };
    }
  }, [activeTab]);

  function getHeatColor(count: number): string {
    if (count === 0) return "hsl(var(--muted))";
    const intensity = Math.min(count / maxHeatCount, 1);
    const lightness = 85 - intensity * 40;
    return `hsl(${heatColor.h}, ${heatColor.s}%, ${lightness}%)`;
  }

  const monthLabels = useMemo(() => {
    const labels: { label: string; index: number }[] = [];
    let lastMonth = -1;
    heatmapData.forEach((week, i) => {
      const firstDay = week[0];
      if (firstDay) {
        const month = new Date(firstDay.date + "T12:00:00").getMonth();
        if (month !== lastMonth) {
          labels.push({
            label: new Date(firstDay.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" }),
            index: i,
          });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [heatmapData]);

  const wordCountData = useMemo(() => {
    if (!allEntries) return [];
    const byDate: Record<string, number> = {};
    for (const entry of allEntries) {
      const words = entry.content.split(/\s+/).length;
      byDate[entry.date] = (byDate[entry.date] || 0) + words;
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, words]) => ({
        date: new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        words,
      }));
  }, [allEntries]);

  const daytimeData = useMemo(() => {
    if (!allEntries) return [];
    const hours = Array(24).fill(0);
    for (const entry of allEntries) {
      const h = new Date(entry.createdAt).getHours();
      hours[h]++;
    }
    return hours.map((count, hour) => ({
      hour: `${hour}:00`,
      label: hour === 0 ? "12a" : hour < 12 ? `${hour}a` : hour === 12 ? "12p" : `${hour - 12}p`,
      count,
    }));
  }, [allEntries]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-40 w-full mb-6" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="page-insights">
      <h1 className="text-3xl font-serif font-bold mb-6" data-testid="text-insights-title">Insights</h1>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2" data-testid="insights-tabs">
        {tabs.map((tab) => (
          <Badge
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            className="cursor-pointer toggle-elevate whitespace-nowrap"
            onClick={() => setActiveTab(tab.id)}
            data-testid={`tab-insight-${tab.id}`}
          >
            <tab.icon className="h-3 w-3 mr-1" />
            {tab.label}
          </Badge>
        ))}
      </div>

      {activeTab !== "wisdom" && (
        <div className="mb-8" data-testid="section-heatmap">
          <div className="overflow-x-auto">
            <div className="mb-1 flex gap-[3px]">
              {monthLabels.map((m) => (
                <span
                  key={m.label + m.index}
                  className="text-xs text-muted-foreground"
                  style={{ position: "relative", left: `${m.index * 13}px` }}
                >
                  {m.label}
                </span>
              ))}
            </div>
            <div className="flex gap-[3px]">
              {heatmapData.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      className="rounded-sm"
                      style={{ width: "10px", height: "10px", backgroundColor: getHeatColor(day.count) }}
                      title={`${day.date}: ${day.count} entries`}
                      data-testid={`heatmap-cell-${day.date}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
            <span>{filteredEntries.length} entries</span>
            <span>{new Set(filteredEntries.map((e) => e.date)).size} days</span>
          </div>
        </div>
      )}

      {activeTab === "wisdom" && wisdomEntries && (
        <div className="mb-8" data-testid="section-wisdom-stats">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {["thought", "quote", "fact", "excerpt", "lesson"].map((cat) => (
              <div key={cat}>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{cat}s</p>
                <p className="font-serif text-lg font-semibold">
                  {wisdomEntries.filter((e) => e.category === cat).length}
                </p>
              </div>
            ))}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
              <p className="font-serif text-lg font-semibold">{wisdomEntries.length}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-6 mb-8 flex-wrap" data-testid="section-quick-stats">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
          <span className="text-sm font-medium">{stats.highlightCount} highlights</span>
        </div>
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4" style={{ color: "hsl(230, 60%, 55%)" }} />
          <span className="text-sm font-medium">{stats.tagCount} tags</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" style={{ color: "hsl(140, 50%, 40%)" }} />
          <span className="text-sm font-medium">{stats.mentionCount} mentions</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-10" data-testid="section-stats">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Journal age</p>
          <p className="font-serif text-lg font-semibold" data-testid="stat-journal-age">{stats.journalAge} days</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Words</p>
          <p className="font-serif text-lg font-semibold" data-testid="stat-words">
            {stats.totalWords.toLocaleString()}{" "}
            <span className="text-sm text-muted-foreground font-normal">| {stats.wordsPerDay}/day</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total entries</p>
          <p className="font-serif text-lg font-semibold" data-testid="stat-total">{allEntries?.length ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Dreams</p>
          <p className="font-serif text-lg font-semibold">{allEntries?.filter((e) => e.isDream).length ?? 0}</p>
        </div>
      </div>

      {wordCountData.length > 0 && (activeTab === "journal" || activeTab === "dreams" || activeTab === "highlights") && (
        <div className="mb-10" data-testid="section-word-chart">
          <h2 className="font-serif font-semibold text-lg mb-3">Word count (all entries)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={wordCountData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
              <Tooltip />
              <Area type="monotone" dataKey="words" stroke="hsl(35, 85%, 45%)" fill="hsl(35, 85%, 45%)" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {daytimeData.length > 0 && (activeTab === "journal" || activeTab === "dreams" || activeTab === "highlights") && (
        <div data-testid="section-daytime-chart">
          <h2 className="font-serif font-semibold text-lg mb-3">Daytime distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={daytimeData.filter((_, i) => i % 2 === 0)}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={20} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(35, 85%, 45%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
