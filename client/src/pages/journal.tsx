import { useQuery } from "@tanstack/react-query";
import { BulletEntry } from "@/components/bullet-entry";
import { EntryInput } from "@/components/entry-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import type { JournalEntry } from "@shared/schema";
import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatToday(): string {
  return formatDate(new Date());
}

function groupByDate(entries: JournalEntry[]): Record<string, JournalEntry[]> {
  const groups: Record<string, JournalEntry[]> = {};
  for (const entry of entries) {
    if (!groups[entry.date]) groups[entry.date] = [];
    groups[entry.date].push(entry);
  }
  return groups;
}

function getDaysAgoLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}

function getWeekDates(centerDate: Date) {
  const dayOfWeek = centerDate.getDay();
  const startOfWeek = new Date(centerDate);
  startOfWeek.setDate(centerDate.getDate() - dayOfWeek);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }
  return days;
}

function CalendarPicker({ selectedDate, onSelectDate, onClose }: { selectedDate: Date; onSelectDate: (d: Date) => void; onClose: () => void }) {
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  const today = formatDate(new Date());

  const monthName = viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="p-3" data-testid="calendar-picker">
      <div className="flex items-center justify-between gap-2 mb-3">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          data-testid="button-cal-prev-month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{monthName}</span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
          data-testid="button-cal-next-month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-xs text-muted-foreground text-center py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1);
          const dayStr = formatDate(dayDate);
          const isSelected = dayStr === formatDate(selectedDate);
          const isToday = dayStr === today;
          return (
            <button
              key={i}
              onClick={() => { onSelectDate(dayDate); onClose(); }}
              className={`text-xs rounded-md p-1.5 text-center ${
                isSelected
                  ? "bg-foreground text-background font-medium"
                  : isToday
                  ? "font-medium border border-border"
                  : "hover-elevate"
              }`}
              data-testid={`cal-day-${dayStr}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const todayStr = formatToday();

  const { data: entries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/entries/recent"],
  });

  const { data: dateEntries, isLoading: dateLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/entries", `?date=${selectedDate ? formatDate(selectedDate) : ""}`],
    enabled: !!selectedDate,
  });

  const { data: stats } = useQuery<{ totalEntries: number }>({
    queryKey: ["/api/entries/stats"],
  });

  const totalEntries = stats?.totalEntries ?? 0;

  if (selectedDate) {
    const dateStr = formatDate(selectedDate);
    const dateLabel = selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const daysAgo = getDaysAgoLabel(dateStr);
    const isToday = dateStr === todayStr;

    return (
      <div className="max-w-2xl mx-auto px-6 py-10" data-testid="page-journal-date">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSelectedDate(null)}
            data-testid="button-back-journal"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-serif font-bold" data-testid="text-date-detail-header">{dateLabel}</h1>
            <p className="text-sm text-muted-foreground">{daysAgo}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }}
              data-testid="button-prev-day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }}
              data-testid="button-next-day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {dateLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-2 w-2 rounded-full mt-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : dateEntries && dateEntries.length > 0 ? (
          <div className="space-y-4">
            {dateEntries.map((entry) => (
              <BulletEntry key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No entries on this date.</p>
        )}

        {isToday && <EntryInput date={dateStr} />}
      </div>
    );
  }

  const weekDays = getWeekDates(new Date());
  const grouped = entries ? groupByDate(entries) : {};
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="page-journal">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <h1 className="text-3xl font-serif font-bold" data-testid="text-journal-title">Journal</h1>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" data-testid="button-open-calendar">
              <Calendar className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarPicker
              selectedDate={new Date()}
              onSelectDate={(d) => setSelectedDate(d)}
              onClose={() => setCalendarOpen(false)}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-3 mb-8 justify-center" data-testid="week-day-circles">
        {weekDays.map((day) => {
          const dayStr = formatDate(day);
          const isToday = dayStr === todayStr;
          const hasEntries = !!grouped[dayStr];
          return (
            <button
              key={dayStr}
              onClick={() => setSelectedDate(day)}
              className="flex flex-col items-center gap-1"
              data-testid={`circle-day-${dayStr}`}
            >
              <span className="text-xs text-muted-foreground">
                {day.toLocaleDateString("en-US", { weekday: "short" }).charAt(0)}
              </span>
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs ${
                  isToday
                    ? "bg-foreground text-background font-medium"
                    : hasEntries
                    ? "bg-muted text-foreground"
                    : "border border-border text-muted-foreground"
                }`}
              >
                {day.getDate()}
              </div>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((dateStr, idx) => {
            const dateObj = new Date(dateStr + "T12:00:00");
            const dateLabel = dateObj.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const daysAgo = getDaysAgoLabel(dateStr);

            return (
              <div key={dateStr} data-testid={`journal-group-${dateStr}`}>
                <button
                  className="flex items-baseline gap-3 mb-3 flex-wrap hover-elevate rounded-md px-2 py-1 -ml-2"
                  onClick={() => setSelectedDate(new Date(dateStr + "T12:00:00"))}
                  data-testid={`button-date-${dateStr}`}
                >
                  <h2 className="font-serif font-semibold text-base" data-testid={`text-date-header-${dateStr}`}>
                    {dateLabel}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    <span style={{ color: "hsl(25, 80%, 50%)" }}>{daysAgo}</span>
                  </span>
                </button>
                <div className="space-y-4 ml-1">
                  {grouped[dateStr].map((entry) => (
                    <BulletEntry key={entry.id} entry={entry} />
                  ))}
                </div>
                {daysAgo === "Today" && <EntryInput date={dateStr} />}
              </div>
            );
          })}

          {sortedDates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No entries yet. Start writing to see your journal here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
