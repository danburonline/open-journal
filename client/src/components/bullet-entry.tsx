import { Heart, Trash2 } from "lucide-react";
import type { JournalEntry } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Link } from "wouter";

interface BulletEntryProps {
  entry: JournalEntry;
  showDate?: boolean;
  showDaysAgo?: boolean;
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDateShort(date: string): string {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getDaysAgo(date: string): string {
  const d = new Date(date + "T12:00:00");
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

function renderContentWithLinks(content: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  const regex = /(#\w+|@\w+)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    const token = match[0];
    const value = token.slice(1).toLowerCase();
    if (token.startsWith("#")) {
      parts.push(
        <Link
          key={key++}
          href="/tags"
          className="font-medium"
          style={{ color: "hsl(230, 60%, 55%)" }}
          data-testid={`link-tag-${value}`}
        >
          {token}
        </Link>
      );
    } else {
      parts.push(
        <Link
          key={key++}
          href="/people"
          className="font-medium"
          style={{ color: "hsl(140, 50%, 40%)" }}
          data-testid={`link-person-${value}`}
        >
          {token}
        </Link>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  return parts;
}

export function BulletEntry({ entry, showDate, showDaysAgo }: BulletEntryProps) {
  const [showDelete, setShowDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/entries/${entry.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/entries/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/entries/highlights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/entries/dreams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/entries/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/entries/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
    },
  });

  const renderedContent = useMemo(() => renderContentWithLinks(entry.content), [entry.content]);

  return (
    <div
      className="group flex gap-3 items-start"
      data-testid={`entry-bullet-${entry.id}`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="mt-1.5 flex-shrink-0">
        {entry.isHighlight ? (
          <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" data-testid={`icon-highlight-${entry.id}`} />
        ) : (
          <div className="h-2 w-2 rounded-full bg-foreground/40" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-serif text-sm leading-relaxed" data-testid={`text-content-${entry.id}`}>
          {renderedContent}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {showDate ? (
            <span className="text-xs text-muted-foreground" data-testid={`text-date-${entry.id}`}>
              {formatDateShort(entry.date)}
              {showDaysAgo && ` \u00B7 ${getDaysAgo(entry.date)}`}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground" data-testid={`text-time-${entry.id}`}>
              {formatTime(entry.createdAt)}
            </span>
          )}
          {entry.isDream && (
            <span className="text-xs" style={{ color: "hsl(35, 85%, 45%)" }} data-testid={`badge-dream-${entry.id}`}>
              dream
            </span>
          )}
        </div>
      </div>
      <div style={{ visibility: showDelete ? "visible" : "hidden" }} className="flex-shrink-0 mt-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          data-testid={`button-delete-${entry.id}`}
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
