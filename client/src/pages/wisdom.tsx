import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Plus, Trash2, Zap, Quote, Snowflake, BookOpen, GraduationCap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { WisdomEntry } from "@shared/schema";

const categories = [
  { name: "all", label: "All", icon: null },
  { name: "thought", label: "Thought", icon: Zap, color: "hsl(45, 85%, 45%)" },
  { name: "quote", label: "Quote", icon: Quote, color: "hsl(25, 70%, 50%)" },
  { name: "fact", label: "Fact", icon: Snowflake, color: "hsl(200, 70%, 50%)" },
  { name: "excerpt", label: "Excerpt", icon: BookOpen, color: "hsl(0, 65%, 50%)" },
  { name: "lesson", label: "Lesson", icon: GraduationCap, color: "hsl(150, 55%, 40%)" },
];

function getCategoryIcon(category: string) {
  const cat = categories.find((c) => c.name === category);
  if (!cat || !cat.icon) return null;
  const Icon = cat.icon;
  return <Icon className="h-4 w-4 flex-shrink-0" style={{ color: cat.color }} />;
}

function getCategoryColor(category: string) {
  const cat = categories.find((c) => c.name === category);
  return cat?.color || "hsl(var(--muted-foreground))";
}

export default function WisdomPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("thought");
  const [newSource, setNewSource] = useState("");
  const [newAuthor, setNewAuthor] = useState("");

  const { data: entries, isLoading } = useQuery<WisdomEntry[]>({
    queryKey: ["/api/wisdom", `?category=${activeCategory}`],
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/wisdom", {
        content: newContent,
        category: newCategory,
        source: newSource || null,
        author: newAuthor || null,
      }),
    onSuccess: () => {
      setNewContent("");
      setNewSource("");
      setNewAuthor("");
      setShowAdd(false);
      queryClient.invalidateQueries({ queryKey: ["/api/wisdom"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/wisdom/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wisdom"] });
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="page-wisdom">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <Lightbulb className="h-6 w-6" style={{ color: "hsl(270, 55%, 50%)" }} />
          <h1 className="text-3xl font-serif font-bold" data-testid="text-wisdom-title">Wisdom</h1>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setShowAdd(!showAdd)}
          data-testid="button-add-wisdom"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap" data-testid="wisdom-category-tabs">
        {categories.map((cat) => (
          <Badge
            key={cat.name}
            variant={activeCategory === cat.name ? "default" : "outline"}
            className="cursor-pointer toggle-elevate"
            onClick={() => setActiveCategory(cat.name)}
            data-testid={`badge-wisdom-${cat.name}`}
          >
            {cat.icon && <cat.icon className="h-3 w-3 mr-1" />}
            {cat.label}
          </Badge>
        ))}
      </div>

      {showAdd && (
        <div className="mb-8 space-y-3 p-4 rounded-md border border-border" data-testid="wisdom-add-form">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Enter your wisdom..."
            className="w-full bg-transparent font-serif text-sm outline-none resize-none min-h-[60px] placeholder:text-muted-foreground/50"
            data-testid="input-wisdom-content"
          />
          <div className="flex gap-2 flex-wrap">
            {categories.filter((c) => c.name !== "all").map((cat) => (
              <Badge
                key={cat.name}
                variant={newCategory === cat.name ? "default" : "outline"}
                className="cursor-pointer toggle-elevate"
                onClick={() => setNewCategory(cat.name)}
                data-testid={`badge-new-wisdom-${cat.name}`}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="Author (optional)"
              className="flex-1 min-w-[120px] bg-transparent text-sm outline-none border-b border-border pb-1 placeholder:text-muted-foreground/50"
              data-testid="input-wisdom-author"
            />
            <input
              type="text"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="Source (optional)"
              className="flex-1 min-w-[120px] bg-transparent text-sm outline-none border-b border-border pb-1 placeholder:text-muted-foreground/50"
              data-testid="input-wisdom-source"
            />
          </div>
          <Button
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={!newContent.trim() || createMutation.isPending}
            data-testid="button-save-wisdom"
          >
            Save
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : entries && entries.length > 0 ? (
        <div className="space-y-6">
          {entries.map((entry) => (
            <div key={entry.id} className="group flex gap-3 items-start" data-testid={`wisdom-entry-${entry.id}`}>
              <div className="mt-1 flex-shrink-0">
                {getCategoryIcon(entry.category)}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-serif text-sm leading-relaxed"
                  style={entry.category === "quote" || entry.category === "excerpt" ? { fontStyle: "italic" } : undefined}
                >
                  {entry.content}
                </p>
                {(entry.author || entry.source) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {entry.author && <span>&#8212; {entry.author}</span>}
                    {entry.source && !entry.author && <span>Source: {entry.source}</span>}
                    {entry.source && entry.author && <span> ({entry.source})</span>}
                  </p>
                )}
              </div>
              <div style={{ visibility: "hidden" }} className="group-hover:!visible flex-shrink-0 mt-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(entry.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-wisdom-${entry.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No wisdom entries yet. Add thoughts, quotes, facts, excerpts, and lessons.
        </p>
      )}
    </div>
  );
}
