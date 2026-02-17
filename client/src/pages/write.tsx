import { useQuery, useMutation } from "@tanstack/react-query";
import { BulletEntry } from "@/components/bullet-entry";
import { EntryInput } from "@/components/entry-input";
import { Sparkles, Moon, FileText, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { JournalEntry, DailyPrompt, Note } from "@shared/schema";
import { useState } from "react";
import { Link } from "wouter";

function formatToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function WritePage() {
  const today = formatToday();
  const now = new Date();

  const { data: entries, isLoading: entriesLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/entries", `?date=${today}`],
  });

  const { data: prompt } = useQuery<DailyPrompt>({
    queryKey: ["/api/prompts/random"],
  });

  const { data: stats } = useQuery<{ totalEntries: number }>({
    queryKey: ["/api/entries/stats"],
  });

  const { data: allNotes } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  const [quickNoteTitle, setQuickNoteTitle] = useState("");
  const [quickNoteContent, setQuickNoteContent] = useState("");
  const [showQuickNote, setShowQuickNote] = useState(false);

  const createNoteMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/notes", {
        title: quickNoteTitle,
        content: quickNoteContent,
        labels: [],
      }),
    onSuccess: () => {
      setQuickNoteTitle("");
      setQuickNoteContent("");
      setShowQuickNote(false);
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
  });

  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const entryCount = stats?.totalEntries ?? 0;

  const todayDreams = entries?.filter((e) => e.isDream) || [];
  const todayRegular = entries?.filter((e) => !e.isDream) || [];

  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="page-write">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground" data-testid="text-date">{monthDay}</p>
        <h1 className="text-3xl font-serif font-bold" data-testid="text-day-name">{dayName}</h1>
        <p className="text-sm" data-testid="text-entry-count">
          <span className="text-muted-foreground">#{entryCount}</span>
          <span className="text-muted-foreground"> / </span>
          <span style={{ color: "hsl(25, 80%, 50%)" }}>Today</span>
        </p>
      </div>

      {todayDreams.length > 0 && (
        <div className="mb-8" data-testid="section-dreams-top">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Moon className="h-4 w-4" style={{ color: "hsl(35, 85%, 45%)" }} />
            <h2 className="font-serif font-semibold text-sm" style={{ color: "hsl(35, 85%, 45%)" }}>
              Dreams
            </h2>
          </div>
          <div className="space-y-3 pl-1">
            {todayDreams.map((entry) => (
              <BulletEntry key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {prompt && (
        <p className="text-sm italic mb-6" style={{ color: "hsl(35, 85%, 45%)" }} data-testid="text-daily-prompt">
          <Sparkles className="inline h-3.5 w-3.5 mr-1" />
          {prompt.text}
        </p>
      )}

      {entriesLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-2 w-2 rounded-full mt-2" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {todayRegular.map((entry) => (
            <BulletEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      <EntryInput date={today} prompt={prompt?.text} />

      <div className="mt-12 border-t border-border pt-8" data-testid="section-notes-bottom">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="h-4 w-4" style={{ color: "hsl(175, 50%, 40%)" }} />
            <h2 className="font-serif font-semibold text-sm">Notes</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowQuickNote(!showQuickNote)}
              data-testid="button-quick-note"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Link href="/notes">
              <Button size="sm" variant="ghost" data-testid="button-view-all-notes">
                View all
              </Button>
            </Link>
          </div>
        </div>

        {showQuickNote && (
          <div className="mb-4 space-y-2 p-3 rounded-md border border-border" data-testid="quick-note-form">
            <input
              type="text"
              value={quickNoteTitle}
              onChange={(e) => setQuickNoteTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/50"
              data-testid="input-quick-note-title"
            />
            <textarea
              value={quickNoteContent}
              onChange={(e) => setQuickNoteContent(e.target.value)}
              placeholder="Write a note..."
              className="w-full bg-transparent text-sm outline-none resize-none min-h-[60px] placeholder:text-muted-foreground/50"
              data-testid="input-quick-note-content"
            />
            <Button
              size="sm"
              onClick={() => createNoteMutation.mutate()}
              disabled={!quickNoteTitle.trim() || createNoteMutation.isPending}
              data-testid="button-save-quick-note"
            >
              Save
            </Button>
          </div>
        )}

        {allNotes && allNotes.length > 0 ? (
          <div className="space-y-3">
            {allNotes.slice(0, 3).map((note) => (
              <Link key={note.id} href="/notes">
                <div className="hover-elevate rounded-md p-2 -ml-2 cursor-pointer" data-testid={`write-note-${note.id}`}>
                  <p className="font-serif text-sm font-medium">{note.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{note.content}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        )}
      </div>
    </div>
  );
}
