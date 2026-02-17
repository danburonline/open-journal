import { useQuery } from "@tanstack/react-query";
import { BulletEntry } from "@/components/bullet-entry";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { JournalEntry } from "@shared/schema";
import { useState } from "react";

interface PersonInfo {
  name: string;
  count: number;
}

export default function PeoplePage() {
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  const { data: people, isLoading: peopleLoading } = useQuery<PersonInfo[]>({
    queryKey: ["/api/people"],
  });

  const { data: personEntries, isLoading: entriesLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/entries/by-person", selectedPerson],
    enabled: !!selectedPerson,
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-10" data-testid="page-people">
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <Users className="h-6 w-6" style={{ color: "hsl(140, 50%, 40%)" }} />
        <h1 className="text-3xl font-serif font-bold" data-testid="text-people-title">People</h1>
        <span className="text-sm text-muted-foreground" data-testid="text-people-count">
          {people?.length ?? 0} people
        </span>
      </div>

      {peopleLoading ? (
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-7 w-20" />
          ))}
        </div>
      ) : people && people.length > 0 ? (
        <>
          <div className="flex gap-2 flex-wrap mb-8" data-testid="people-list">
            {people.map((person) => (
              <Badge
                key={person.name}
                variant={selectedPerson === person.name ? "default" : "outline"}
                className="cursor-pointer toggle-elevate"
                onClick={() => setSelectedPerson(selectedPerson === person.name ? null : person.name)}
                data-testid={`badge-person-${person.name}`}
              >
                @{person.name}
                <span className="ml-1 text-xs opacity-70">{person.count}</span>
              </Badge>
            ))}
          </div>

          {selectedPerson && (
            <div data-testid="person-entries-section">
              <h2 className="font-serif font-semibold text-lg mb-4" data-testid="text-selected-person">
                @{selectedPerson}
              </h2>
              {entriesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : personEntries && personEntries.length > 0 ? (
                <div className="space-y-4">
                  {personEntries.map((entry) => (
                    <BulletEntry key={entry.id} entry={entry} showDate showDaysAgo />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No entries mentioning this person.</p>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No people yet. Use @mentions in your entries to add people.
        </p>
      )}
    </div>
  );
}
