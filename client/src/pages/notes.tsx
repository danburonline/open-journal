import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash2, ChevronLeft, Tag } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { Note } from "@shared/schema";

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function NotesPage() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newLabels, setNewLabels] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "labels">("list");

  const { data: allNotes, isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/notes", {
        title: newTitle,
        content: newContent,
        labels: newLabels ? newLabels.split(",").map((l) => l.trim()).filter(Boolean) : [],
      }),
    onSuccess: () => {
      setNewTitle("");
      setNewContent("");
      setNewLabels("");
      setShowNew(false);
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/notes/${selectedNote?.id}`, {
        title: editTitle,
        content: editContent,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/notes/${id}`),
    onSuccess: () => {
      setSelectedNote(null);
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
  });

  const allLabels = Array.from(new Set((allNotes || []).flatMap((n) => n.labels || []))).sort();

  if (selectedNote) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10" data-testid="page-note-detail">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              if (editTitle !== selectedNote.title || editContent !== selectedNote.content) {
                updateMutation.mutate();
              }
              setSelectedNote(null);
            }}
            data-testid="button-back-notes"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => deleteMutation.mutate(selectedNote.id)}
            data-testid="button-delete-note"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => updateMutation.mutate()}
          className="w-full bg-transparent text-xl font-serif font-bold outline-none mb-4"
          data-testid="input-note-title"
        />
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={() => updateMutation.mutate()}
          className="w-full bg-transparent font-serif text-sm leading-relaxed outline-none resize-none min-h-[300px]"
          data-testid="input-note-content"
        />
        {selectedNote.labels && selectedNote.labels.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {selectedNote.labels.map((label) => (
              <Badge key={label} variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="page-notes">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <FileText className="h-6 w-6" style={{ color: "hsl(175, 50%, 40%)" }} />
          <h1 className="text-3xl font-serif font-bold" data-testid="text-notes-title">Notes</h1>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setShowNew(!showNew)}
          data-testid="button-add-note"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("list")}
          className={`text-sm font-medium pb-1 ${activeTab === "list" ? "border-b-2 border-foreground" : "text-muted-foreground"}`}
          data-testid="tab-notes-list"
        >
          List
        </button>
        <button
          onClick={() => setActiveTab("labels")}
          className={`text-sm font-medium pb-1 ${activeTab === "labels" ? "border-b-2 border-foreground" : "text-muted-foreground"}`}
          data-testid="tab-notes-labels"
        >
          Labels
        </button>
      </div>

      {showNew && (
        <div className="mb-8 space-y-3 p-4 rounded-md border border-border" data-testid="notes-add-form">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full bg-transparent font-serif text-base font-medium outline-none placeholder:text-muted-foreground/50"
            data-testid="input-new-note-title"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write your note..."
            className="w-full bg-transparent font-serif text-sm outline-none resize-none min-h-[80px] placeholder:text-muted-foreground/50"
            data-testid="input-new-note-content"
          />
          <input
            type="text"
            value={newLabels}
            onChange={(e) => setNewLabels(e.target.value)}
            placeholder="Labels (comma-separated, optional)"
            className="w-full bg-transparent text-sm outline-none border-b border-border pb-1 placeholder:text-muted-foreground/50"
            data-testid="input-new-note-labels"
          />
          <Button
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={!newTitle.trim() || createMutation.isPending}
            data-testid="button-save-note"
          >
            Save
          </Button>
        </div>
      )}

      {activeTab === "labels" && allLabels.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6" data-testid="notes-labels-list">
          {allLabels.map((label) => (
            <Badge key={label} variant="outline" data-testid={`badge-label-${label}`}>
              <Tag className="h-3 w-3 mr-1" />
              {label}
            </Badge>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : allNotes && allNotes.length > 0 ? (
        <div className="space-y-6">
          {allNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => {
                setSelectedNote(note);
                setEditTitle(note.title);
                setEditContent(note.content);
              }}
              className="block w-full text-left hover-elevate rounded-md p-3 -ml-3"
              data-testid={`note-item-${note.id}`}
            >
              <p className="text-xs text-muted-foreground mb-1">{formatDate(note.createdAt)}</p>
              <h3 className="font-serif font-bold text-base mb-1" data-testid={`text-note-title-${note.id}`}>{note.title}</h3>
              <p className="font-serif text-sm text-muted-foreground line-clamp-2">{note.content}</p>
              {note.labels && note.labels.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {note.labels.map((label) => (
                    <Badge key={label} variant="outline" className="text-xs">
                      <Tag className="h-2.5 w-2.5 mr-0.5" />
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No notes yet. Create your first note.
        </p>
      )}
    </div>
  );
}
