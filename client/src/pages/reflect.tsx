import { useQuery } from "@tanstack/react-query";
import { BulletEntry } from "@/components/bullet-entry";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";
import type { JournalEntry } from "@shared/schema";
import { useMemo, useState, useCallback } from "react";

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ReflectPage() {
  const [shuffleKey, setShuffleKey] = useState(0);

  const { data: allEntries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/entries/all"],
  });

  const oneYearAgoEntries = useMemo(() => {
    if (!allEntries) return [];
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const targetDate = formatDate(oneYearAgo);
    return allEntries.filter((e) => e.date === targetDate);
  }, [allEntries]);

  const memoryLaneEntries = useMemo(() => {
    if (!allEntries || allEntries.length === 0) return [];
    const today = formatDate(new Date());
    const pastEntries = allEntries.filter((e) => e.date !== today);
    const shuffled = [...pastEntries].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }, [allEntries, shuffleKey]);

  const thisWeekEntries = useMemo(() => {
    if (!allEntries) return [];
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const weekAgoStr = formatDate(weekAgo);
    return allEntries.filter((e) => e.date >= weekAgoStr);
  }, [allEntries]);

  const weekData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const dayEntries = allEntries?.filter((e) => e.date === dateStr) || [];
      data.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        count: dayEntries.length,
      });
    }
    return data;
  }, [allEntries]);

  const handleShuffle = useCallback(() => {
    setShuffleKey((k) => k + 1);
  }, []);

  const maxCount = Math.max(...weekData.map((d) => d.count), 1);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="page-reflect">
      <h1 className="text-3xl font-serif font-bold mb-8" data-testid="text-reflect-title">Reflect</h1>

      <div className="mb-10" data-testid="section-week-chart">
        <h2 className="font-serif font-semibold text-lg mb-4">This week</h2>
        <div className="flex items-end gap-2 h-20">
          {weekData.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div
                className="w-full rounded-sm"
                style={{
                  height: `${Math.max((d.count / maxCount) * 60, 4)}px`,
                  backgroundColor: d.count > 0 ? "hsl(35, 85%, 45%)" : "hsl(var(--muted))",
                }}
              />
              <span className="text-xs text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2" data-testid="text-week-summary">
          {thisWeekEntries.length} entries this week
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-10" data-testid="section-one-year-ago">
            <h2 className="font-serif font-semibold text-lg mb-4">One year ago</h2>
            {oneYearAgoEntries.length > 0 ? (
              <div className="space-y-4">
                {oneYearAgoEntries.map((entry) => (
                  <BulletEntry key={entry.id} entry={entry} showDate showDaysAgo />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No entries from one year ago.</p>
            )}
          </div>

          <div data-testid="section-memory-lane">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <h2 className="font-serif font-semibold text-lg">Memory lane</h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleShuffle}
                data-testid="button-shuffle-memories"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
            {memoryLaneEntries.length > 0 ? (
              <div className="space-y-4">
                {memoryLaneEntries.map((entry) => (
                  <BulletEntry key={entry.id} entry={entry} showDate showDaysAgo />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Write more entries to see memories here.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
