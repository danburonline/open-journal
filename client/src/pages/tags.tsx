import { useQuery, useMutation } from "@tanstack/react-query";
import { BulletEntry } from "@/components/bullet-entry";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hash, ChevronLeft, TrendingUp, TrendingDown, Settings } from "lucide-react";
import type { JournalEntry, TagSetting } from "@shared/schema";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface TagInfo {
  name: string;
  count: number;
}

export default function TagsPage() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const { data: tags, isLoading: tagsLoading } = useQuery<TagInfo[]>({
    queryKey: ["/api/tags"],
  });

  const { data: tagEntries, isLoading: entriesLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/entries/by-tag", selectedTag],
    enabled: !!selectedTag,
  });

  const { data: tagSetting } = useQuery<TagSetting>({
    queryKey: ["/api/tag-settings", selectedTag],
    enabled: !!selectedTag,
  });

  const { data: allTagSettings } = useQuery<TagSetting[]>({
    queryKey: ["/api/tag-settings"],
  });

  const setGoalMutation = useMutation({
    mutationFn: (goal: string) =>
      apiRequest("POST", "/api/tag-settings", { tagName: selectedTag, goal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tag-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tag-settings", selectedTag] });
    },
  });

  const currentGoal = tagSetting?.goal || "none";

  const getGoalIndicator = (tagName: string) => {
    const setting = allTagSettings?.find((s) => s.tagName === tagName);
    if (!setting || setting.goal === "none") return null;
    if (setting.goal === "more") return <TrendingUp className="h-3 w-3" style={{ color: "hsl(140, 50%, 40%)" }} />;
    return <TrendingDown className="h-3 w-3" style={{ color: "hsl(0, 65%, 50%)" }} />;
  };

  if (selectedTag) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10" data-testid="page-tag-detail">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => { setSelectedTag(null); setShowSettings(false); }}
            data-testid="button-back-tags"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-serif font-bold" data-testid="text-selected-tag">
            <span style={{ color: "hsl(230, 60%, 55%)" }}>#</span>{selectedTag}
          </h1>
          <div className="flex-1" />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            data-testid="button-tag-settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {showSettings && (
          <div className="mb-8 p-4 rounded-md border border-border" data-testid="tag-settings-panel">
            <h3 className="font-serif font-semibold text-sm mb-3">Do more / less</h3>
            <div className="flex gap-2 mb-3 flex-wrap">
              <Badge
                variant={currentGoal === "more" ? "default" : "outline"}
                className="cursor-pointer toggle-elevate"
                onClick={() => setGoalMutation.mutate(currentGoal === "more" ? "none" : "more")}
                data-testid="badge-goal-more"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                more
              </Badge>
              <Badge
                variant={currentGoal === "less" ? "default" : "outline"}
                className="cursor-pointer toggle-elevate"
                onClick={() => setGoalMutation.mutate(currentGoal === "less" ? "none" : "less")}
                data-testid="badge-goal-less"
              >
                <TrendingDown className="h-3 w-3 mr-1" />
                less
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Set whether you want to do more or less of #{selectedTag} in your daily routine.
            </p>
          </div>
        )}

        <div data-testid="tag-entries-section">
          {entriesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : tagEntries && tagEntries.length > 0 ? (
            <div className="space-y-4">
              {tagEntries.map((entry) => (
                <BulletEntry key={entry.id} entry={entry} showDate showDaysAgo />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No entries with this tag.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="page-tags">
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <Hash className="h-6 w-6" style={{ color: "hsl(230, 60%, 55%)" }} />
        <h1 className="text-3xl font-serif font-bold" data-testid="text-tags-title">Tags</h1>
        <span className="text-sm text-muted-foreground" data-testid="text-tags-count">
          {tags?.length ?? 0} tags
        </span>
      </div>

      {tagsLoading ? (
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-7 w-20" />
          ))}
        </div>
      ) : tags && tags.length > 0 ? (
        <div className="flex gap-2 flex-wrap" data-testid="tags-list">
          {tags.map((tag) => (
            <Badge
              key={tag.name}
              variant="outline"
              className="cursor-pointer toggle-elevate"
              onClick={() => setSelectedTag(tag.name)}
              data-testid={`badge-tag-${tag.name}`}
            >
              {getGoalIndicator(tag.name)}
              <Hash className="h-3 w-3 mr-0.5" />
              {tag.name}
              <span className="ml-1 text-xs opacity-70">{tag.count}</span>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No tags yet. Use #hashtags in your entries to create tags.
        </p>
      )}
    </div>
  );
}
