import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { MONSTERS, WEAPONS, getRank, formatTime } from "@/lib/mh-data";
import { ArrowLeft, Skull, Medal, Star, User, Swords, Link } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfileHunt = {
  id: string;
  monsterId: string;
  weaponId: string;
  timeSeconds: number;
  isPb: boolean;
  mode: string;
  videoUrl?: string | null;
};

function RankIcon({ rank, className }: { rank: string; className?: string }) {
  switch (rank) {
    case "gold": return <Medal className={cn("text-yellow-400 fill-yellow-400/30", className)} />;
    case "silver": return <Medal className={cn("text-slate-300 fill-slate-300/30", className)} />;
    case "bronze": return <Medal className={cn("text-amber-700 fill-amber-700/30", className)} />;
    case "skull": return <Skull className={cn("text-gray-500", className)} />;
    default: return null;
  }
}

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const [, setLocation] = useLocation();
  const username = params.username;

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error("Hunter not found");
      return res.json() as Promise<{ username: string; hunterId: string | null; hunts: ProfileHunt[] }>;
    },
  });

  const modes = ["solo", "duo", "squad"] as const;

  const statsByMode = (mode: string) => {
    const modeHunts = profile?.hunts.filter(h => h.mode === mode) ?? [];
    let gold = 0, silver = 0, bronze = 0, skull = 0, stars = 0;
    const globalBest: Record<string, { time: number; huntId: string }> = {};
    modeHunts.forEach(h => {
      if (!globalBest[h.monsterId] || h.timeSeconds < globalBest[h.monsterId].time) {
        globalBest[h.monsterId] = { time: h.timeSeconds, huntId: h.id };
      }
      const rank = getRank(h.timeSeconds);
      if (rank === "gold") gold++;
      else if (rank === "silver") silver++;
      else if (rank === "bronze") bronze++;
      else if (rank === "skull") skull++;
    });
    return { modeHunts, gold, silver, bronze, skull, stars: Object.keys(globalBest).length };
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans max-w-2xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => setLocation("/leaderboard")}
        className="mb-6 text-muted-foreground hover:text-white -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Leaderboard
      </Button>

      {isLoading && (
        <div className="text-center text-muted-foreground py-20">Loading hunter...</div>
      )}

      {error && (
        <Card className="bg-card/40 border-white/5">
          <CardContent className="py-12 text-center text-muted-foreground">
            Hunter not found.
          </CardContent>
        </Card>
      )}

      {profile && (
        <div className="space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-br from-card/60 to-primary/10 border-primary/20">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-white">{profile.username}</h1>
                {profile.hunterId && (
                  <p className="text-sm text-muted-foreground font-mono">Hunter ID: {profile.hunterId}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hunts by mode */}
          {modes.map(mode => {
            const { modeHunts, gold, silver, bronze, skull } = statsByMode(mode);
            if (modeHunts.length === 0) return null;

            return (
              <Card key={mode} className="bg-card/40 border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-lg flex items-center gap-2 capitalize">
                    <Swords className="w-4 h-4 text-primary" /> {mode} Runs
                    <span className="ml-auto flex items-center gap-3 text-sm font-normal">
                      <span className="flex items-center gap-1 text-yellow-400"><Medal className="w-3.5 h-3.5" />{gold}</span>
                      <span className="flex items-center gap-1 text-slate-300"><Medal className="w-3.5 h-3.5" />{silver}</span>
                      <span className="flex items-center gap-1 text-amber-700"><Medal className="w-3.5 h-3.5" />{bronze}</span>
                      <span className="flex items-center gap-1 text-gray-500"><Skull className="w-3.5 h-3.5" />{skull}</span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-1">
                  {modeHunts.map(hunt => {
                    const monster = MONSTERS.find(m => m.id === hunt.monsterId);
                    const weapon = WEAPONS.find(w => w.id === hunt.weaponId);
                    const rank = getRank(hunt.timeSeconds);
                    return (
                      <div key={hunt.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          {monster && <monster.icon className={cn("w-4 h-4 shrink-0", monster.color)} />}
                          <span className="text-slate-300 truncate">{monster?.name}</span>
                          <span className="text-muted-foreground/50 text-xs shrink-0">· {weapon?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-slate-200">{formatTime(hunt.timeSeconds)}</span>
                          <RankIcon rank={rank} className="w-4 h-4" />
                          {hunt.videoUrl && (
                            <a
                              href={hunt.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary/60 hover:text-primary transition-colors"
                              title="Watch proof"
                            >
                              <Link className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}

          {profile.hunts.length === 0 && (
            <Card className="bg-card/40 border-white/5">
              <CardContent className="py-12 text-center text-muted-foreground">
                This hunter hasn't logged any hunts yet.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
