import { useQuery } from "@tanstack/react-query";
import { BulletEntry } from "@/components/bullet-entry";
import { Skeleton } from "@/components/ui/skeleton";
import type { JournalEntry, WisdomEntry } from "@shared/schema";
import { useMemo } from "react";
import { Heart, Lightbulb, Zap, Quote, Snowflake, BookOpen, GraduationCap } from "lucide-react";

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getCategoryIcon(category: string) {
  const iconMap: Record<string, typeof Zap> = {
    thought: Zap,
    quote: Quote,
    fact: Snowflake,
    excerpt: BookOpen,
    lesson: GraduationCap,
  };
  const colorMap: Record<string, string> = {
    thought: "hsl(45, 85%, 45%)",
    quote: "hsl(25, 70%, 50%)",
    fact: "hsl(200, 70%, 50%)",
    excerpt: "hsl(0, 65%, 50%)",
    lesson: "hsl(150, 55%, 40%)",
  };
  const Icon = iconMap[category] || Lightbulb;
  return <Icon className="h-4 w-4 flex-shrink-0" style={{ color: colorMap[category] || "hsl(270, 55%, 50%)" }} />;
}

export default function HighlightsPage() {
  const { data: entries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/entries/highlights"],
  });

  const { data: randomWisdom } = useQuery<WisdomEntry[]>({
    queryKey: ["/api/wisdom/random"],
  });

  const heatmapWeeks = useMemo(() => {
    if (!entries) return [];
    const counts: Record<string, number> = {};
    for (const entry of entries) {
      counts[entry.date] = (counts[entry.date] || 0) + 1;
    }

    const weeks: { date: string; count: number }[][] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 90);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentWeek: { date: string; count: number }[] = [];
    const d = new Date(startDate);
    while (d <= today) {
      const dateStr = formatDate(d);
      currentWeek.push({ date: dateStr, count: counts[dateStr] || 0 });
      if (d.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      d.setDate(d.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);
    return weeks;
  }, [entries]);

  const maxCount = useMemo(() => {
    return Math.max(1, ...heatmapWeeks.flat().map((d) => d.count));
  }, [heatmapWeeks]);

  function getColor(count: number): string {
    if (count === 0) return "hsl(var(--muted))";
    const intensity = Math.min(count / maxCount, 1);
    const lightness = 80 - intensity * 35;
    return `hsl(0, 75%, ${lightness}%)`;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="page-highlights">
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <Heart className="h-6 w-6 fill-red-500 text-red-500" />
        <h1 className="text-3xl font-serif font-bold" data-testid="text-highlights-title">Highlights</h1>
        <span className="text-sm text-muted-foreground" data-testid="text-highlights-count">
          {entries?.length ?? 0} highlights
        </span>
      </div>

      {randomWisdom && randomWisdom.length > 0 && (
        <div className="mb-10" data-testid="section-wisdom-spotlight">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Lightbulb className="h-4 w-4" style={{ color: "hsl(270, 55%, 50%)" }} />
            <h2 className="font-serif font-semibold text-sm">Wisdom</h2>
          </div>
          <div className="space-y-4">
            {randomWisdom.map((w) => (
              <div key={w.id} className="flex gap-3 items-start">
                <div className="mt-1 flex-shrink-0">{getCategoryIcon(w.category)}</div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-serif text-sm leading-relaxed"
                    style={w.category === "quote" || w.category === "excerpt" ? { fontStyle: "italic" } : undefined}
                  >
                    {w.content}
                  </p>
                  {(w.author || w.source) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {w.author && <span>&#8212; {w.author}</span>}
                      {w.source && !w.author && <span>Source: {w.source}</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {heatmapWeeks.length > 0 && (
        <div className="mb-10 overflow-x-auto" data-testid="section-highlight-heatmap">
          <div className="flex gap-[3px]">
            {heatmapWeeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <div
                    key={day.date}
                    className="rounded-sm"
                    style={{ width: "10px", height: "10px", backgroundColor: getColor(day.count) }}
                    title={`${day.date}: ${day.count} highlights`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : entries && entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map((entry) => (
            <BulletEntry key={entry.id} entry={entry} showDate showDaysAgo />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No highlights yet. Mark an entry as a highlight when writing to see it here.
        </p>
      )}
    </div>
  );
}
