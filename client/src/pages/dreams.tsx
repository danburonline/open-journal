import { useQuery } from "@tanstack/react-query";
import { BulletEntry } from "@/components/bullet-entry";
import { Skeleton } from "@/components/ui/skeleton";
import type { JournalEntry } from "@shared/schema";
import { useMemo } from "react";
import { Moon } from "lucide-react";

export default function DreamsPage() {
  const { data: entries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/entries/dreams"],
  });

  const monthlyData = useMemo(() => {
    if (!entries) return [];
    const counts: Record<string, number> = {};
    for (const entry of entries) {
      const month = entry.date.substring(0, 7);
      counts[month] = (counts[month] || 0) + 1;
    }
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        label: new Date(month + "-15T12:00:00").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        count,
      }));
  }, [entries]);

  const maxCount = useMemo(() => Math.max(1, ...monthlyData.map((d) => d.count)), [monthlyData]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="page-dreams">
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <Moon className="h-6 w-6" style={{ color: "hsl(35, 85%, 45%)" }} />
        <h1 className="text-3xl font-serif font-bold" data-testid="text-dreams-title">Dreams</h1>
        <span className="text-sm text-muted-foreground" data-testid="text-dreams-count">
          {entries?.length ?? 0} dreams
        </span>
      </div>

      {monthlyData.length > 0 && (
        <div className="mb-10" data-testid="section-dream-chart">
          <div className="flex items-end gap-2 h-16">
            {monthlyData.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex gap-[2px] flex-col items-center">
                  {Array.from({ length: d.count }).map((_, j) => (
                    <div
                      key={j}
                      className="rounded-full"
                      style={{
                        width: "6px",
                        height: "6px",
                        backgroundColor: "hsl(35, 85%, 45%)",
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">{d.label}</span>
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
          No dream entries yet. Mark an entry as a dream when writing to see it here.
        </p>
      )}
    </div>
  );
}
