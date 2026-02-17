import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Heart, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface EntryInputProps {
  date: string;
  prompt?: string | null;
}

export function EntryInput({ date, prompt }: EntryInputProps) {
  const [content, setContent] = useState("");
  const [isHighlight, setIsHighlight] = useState(false);
  const [isDream, setIsDream] = useState(false);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/entries", {
        content,
        date,
        mood: null,
        prompt: prompt || null,
        isHighlight,
        isDream,
        tags: [],
      });
    },
    onSuccess: () => {
      setContent("");
      setIsHighlight(false);
      setIsDream(false);
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/entries/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/entries/highlights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/entries/dreams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/entries/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/entries/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      queryClient.invalidateQueries({ queryKey: ["/api/entries/by-tag"] });
      queryClient.invalidateQueries({ queryKey: ["/api/entries/by-person"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && content.trim()) {
      e.preventDefault();
      createMutation.mutate();
    }
  };

  return (
    <div className="mt-6 flex gap-3 items-start" data-testid="entry-input-container">
      <div className="mt-2.5 flex-shrink-0">
        <div className="h-2 w-2 rounded-full bg-foreground/20" />
      </div>
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New bullet..."
          className="w-full bg-transparent font-serif text-sm outline-none placeholder:text-muted-foreground/50"
          disabled={createMutation.isPending}
          data-testid="input-new-entry"
        />
        {content.trim() && (
          <div className="flex items-center gap-1 mt-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsHighlight(!isHighlight)}
              className={isHighlight ? "text-red-500" : "text-muted-foreground"}
              data-testid="button-toggle-highlight"
            >
              <Heart className={`h-3.5 w-3.5 ${isHighlight ? "fill-red-500" : ""}`} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsDream(!isDream)}
              className={isDream ? "" : "text-muted-foreground"}
              style={isDream ? { color: "hsl(35, 85%, 45%)" } : undefined}
              data-testid="button-toggle-dream"
            >
              <Moon className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
