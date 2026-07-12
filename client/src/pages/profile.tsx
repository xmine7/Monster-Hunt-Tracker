import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { MONSTERS, WEAPONS, getRank, formatTime } from "@/lib/mh-data";
import { ArrowLeft, Medal, Skull, User, Link, SlidersHorizontal, Youtube } from "lucide-react";
import { getAvatar } from "@/lib/avatars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

const RANK_ORDER = { gold: 0, silver: 1, bronze: 2, skull: 3 } as const;

type ProfileHunt = {
  id: string;
  monsterId: string;
  weaponId: string;
  timeSeconds: number;
  isPb: boolean;
  mode: string;
  videoUrl?: string | null;
  buildUrl?: string | null;
  notes?: string | null;
};

type ModeFilter = "overall" | "solo" | "duo" | "squad";

function RankIcon({ rank, className }: { rank: string; className?: string }) {
  switch (rank) {
    case "gold": return <Medal className={cn("text-yellow-400 fill-yellow-400/30", className)} />;
    case "silver": return <Medal className={cn("text-slate-300 fill-slate-300/30", className)} />;
    case "bronze": return <Medal className={cn("text-amber-700 fill-amber-700/30", className)} />;
    case "skull": return <Skull className={cn("text-gray-500", className)} />;
    default: return null;
  }
}

function ModeCard({ mode, hunts }: { mode: string; hunts: ProfileHunt[] }) {
  const bestPerMonster: Record<string, ProfileHunt> = {};
  hunts.forEach(h => {
    if (!bestPerMonster[h.monsterId] || h.timeSeconds < bestPerMonster[h.monsterId].timeSeconds) {
      bestPerMonster[h.monsterId] = h;
    }
  });

  return (
    <Card className="bg-card/40 border-white/5 flex-1 min-w-0">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-display uppercase tracking-widest text-primary">{mode}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {MONSTERS.map(monster => {
          const best = bestPerMonster[monster.id];
          const weapon = best ? WEAPONS.find(w => w.id === best.weaponId) : null;
          const rank = best ? getRank(best.timeSeconds) : null;
          return (
            <div key={monster.id} className="flex items-center justify-between gap-1 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <monster.icon className={cn("w-3.5 h-3.5 shrink-0", monster.color)} />
                {best ? (
                  <span className="font-mono text-slate-200 font-medium">{formatTime(best.timeSeconds)}</span>
                ) : (
                  <span className="text-muted-foreground/30">—</span>
                )}
              </div>
              {best && rank ? (
                <div className="flex items-center gap-1 shrink-0">
                  <RankIcon rank={rank} className="w-3.5 h-3.5" />
                  {best.videoUrl && (
                    <a href={best.videoUrl} target="_blank" rel="noopener noreferrer"
                      className="text-primary/50 hover:text-primary transition-colors"
                      onClick={e => e.stopPropagation()}>
                      <Link className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser } = useUser();
  const username = params.username;
  const isOwnProfile = currentUser?.username === username;

  const [modeFilter, setModeFilter] = useState<ModeFilter>("overall");
  const [weaponFilter, setWeaponFilter] = useState<string>("all");
  const [monsterFilter, setMonsterFilter] = useState<string>("all");
  const [allHuntsMode, setAllHuntsMode] = useState<string>("all");

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error("Hunter not found");
      return res.json() as Promise<{ username: string; hunterId: string | null; avatar: string | null; youtubeUrl: string | null; discordTag: string | null; hunts: ProfileHunt[] }>;
    },
  });

  const huntsBySolo = useMemo(() => profile?.hunts.filter(h => h.mode === "solo") ?? [], [profile]);
  const huntsByDuo = useMemo(() => profile?.hunts.filter(h => h.mode === "duo") ?? [], [profile]);
  const huntsBySquad = useMemo(() => profile?.hunts.filter(h => h.mode === "squad") ?? [], [profile]);

  const visibleModeCards = useMemo(() => {
    if (modeFilter === "overall") {
      return ([
        huntsBySolo.length > 0 ? { mode: "solo", hunts: huntsBySolo } : null,
        huntsByDuo.length > 0 ? { mode: "duo", hunts: huntsByDuo } : null,
        huntsBySquad.length > 0 ? { mode: "squad", hunts: huntsBySquad } : null,
      ]).filter(Boolean) as { mode: string; hunts: ProfileHunt[] }[];
    }
    const modeHunts = profile?.hunts.filter(h => h.mode === modeFilter) ?? [];
    return modeHunts.length > 0 ? [{ mode: modeFilter, hunts: modeHunts }] : [];
  }, [modeFilter, huntsBySolo, huntsByDuo, huntsBySquad, profile]);

  const allHuntsSorted = useMemo(() => {
    let hunts = profile?.hunts ?? [];
    if (allHuntsMode !== "all") hunts = hunts.filter(h => h.mode === allHuntsMode);
    if (weaponFilter !== "all") hunts = hunts.filter(h => h.weaponId === weaponFilter);
    if (monsterFilter !== "all") hunts = hunts.filter(h => h.monsterId === monsterFilter);
    return [...hunts].sort((a, b) => {
      const ra = RANK_ORDER[getRank(a.timeSeconds)];
      const rb = RANK_ORDER[getRank(b.timeSeconds)];
      if (ra !== rb) return ra - rb;
      return a.timeSeconds - b.timeSeconds;
    });
  }, [profile, weaponFilter, monsterFilter]);

  const modeButtons: { value: ModeFilter; label: string }[] = [
    { value: "overall", label: "Overall" },
    { value: "solo", label: "Solo" },
    { value: "duo", label: "Duo" },
    { value: "squad", label: "Squad" },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans max-w-2xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => setLocation("/leaderboard")}
        className="text-muted-foreground hover:text-white -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Leaderboard
      </Button>

      {isLoading && (
        <div className="text-center text-muted-foreground py-20">Loading hunter...</div>
      )}
      {error && (
        <Card className="bg-card/40 border-white/5">
          <CardContent className="py-12 text-center text-muted-foreground">Hunter not found.</CardContent>
        </Card>
      )}

      {profile && (
        <>
          {/* Header */}
          {(() => {
            const av = getAvatar(profile.avatar);
            return (
              <Card className="bg-gradient-to-br from-card/60 to-primary/10 border-primary/20">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0 border-2", av.bg, av.border)}>
                    {av.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-display font-bold text-white">{profile.username}</h1>
                    {isOwnProfile && profile.hunterId && (
                      <p className="text-sm text-muted-foreground font-mono mt-0.5">Hunter ID: {profile.hunterId}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{profile.hunts.length} hunt{profile.hunts.length !== 1 ? "s" : ""} logged</p>
                    {(profile.youtubeUrl || profile.discordTag) && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {profile.youtubeUrl && (
                          <a href={profile.youtubeUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/20 rounded-full px-2.5 py-1 transition-colors">
                            <Youtube className="w-3.5 h-3.5" /> YouTube
                          </a>
                        )}
                        {profile.discordTag && (
                          <span className="flex items-center gap-1.5 text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 rounded-full px-2.5 py-1">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.04.035.05a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                            </svg>
                            {profile.discordTag}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Mode filter tabs */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs font-bold">
            {modeButtons.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setModeFilter(value)}
                className={cn(
                  "flex-1 py-2.5 transition-colors",
                  modeFilter === value
                    ? "bg-primary text-background"
                    : "bg-background/30 text-muted-foreground hover:text-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Mode cards */}
          {visibleModeCards.length === 0 ? (
            <Card className="bg-card/40 border-white/5">
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No {modeFilter === "overall" ? "" : modeFilter + " "}hunts logged yet.
              </CardContent>
            </Card>
          ) : (
            <div className="flex gap-3">
              {visibleModeCards.map(({ mode, hunts }) => (
                <ModeCard key={mode} mode={mode} hunts={hunts} />
              ))}
            </div>
          )}

          {/* All Hunts */}
          {profile.hunts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> All Hunts
                </h2>
                <div className="flex items-center gap-2">
                  <Select value={allHuntsMode} onValueChange={setAllHuntsMode}>
                    <SelectTrigger className="h-7 text-xs bg-card/50 border-white/10 w-[90px]">
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10 text-slate-200">
                      <SelectItem value="all">All Modes</SelectItem>
                      <SelectItem value="solo">Solo</SelectItem>
                      <SelectItem value="duo">Duo</SelectItem>
                      <SelectItem value="squad">Squad</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={monsterFilter} onValueChange={setMonsterFilter}>
                    <SelectTrigger className="h-7 text-xs bg-card/50 border-white/10 w-[130px]">
                      <SelectValue placeholder="Monster" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10 text-slate-200">
                      <SelectItem value="all">All Monsters</SelectItem>
                      {MONSTERS.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={weaponFilter} onValueChange={setWeaponFilter}>
                    <SelectTrigger className="h-7 text-xs bg-card/50 border-white/10 w-[120px]">
                      <SelectValue placeholder="Weapon" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10 text-slate-200 max-h-[40vh]">
                      <SelectItem value="all">All Weapons</SelectItem>
                      {WEAPONS.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="bg-card/40 border-white/5">
                <CardContent className="p-0">
                  {allHuntsSorted.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      No hunts match the selected filters.
                    </div>
                  ) : (
                    allHuntsSorted.map((hunt) => {
                      const monster = MONSTERS.find(m => m.id === hunt.monsterId);
                      const weapon = WEAPONS.find(w => w.id === hunt.weaponId);
                      const rank = getRank(hunt.timeSeconds);
                      return (
                        <div key={hunt.id} className="px-4 py-3 border-b border-white/5 last:border-0">
                          <div className="flex items-center gap-3 text-sm">
                            <RankIcon rank={rank} className="w-4 h-4 shrink-0" />
                            {monster && <monster.icon className={cn("w-4 h-4 shrink-0", monster.color)} />}
                            <div className="flex-1 min-w-0">
                              <span className="text-slate-300 text-xs">{monster?.name}</span>
                              <span className="text-muted-foreground/50 text-xs"> · {weapon?.name}</span>
                              <span className="text-muted-foreground/40 text-xs ml-1 capitalize">({hunt.mode})</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-slate-200 font-medium">{formatTime(hunt.timeSeconds)}</span>
                              {hunt.videoUrl && (
                                <a href={hunt.videoUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-primary/60 hover:text-primary transition-colors" title="Watch proof">
                                  <Link className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {hunt.buildUrl && (
                                <a href={hunt.buildUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-yellow-500/60 hover:text-yellow-400 transition-colors" title="View build">
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                          {hunt.notes && (
                            <p className="mt-1.5 ml-11 text-xs text-muted-foreground/70 italic">{hunt.notes}</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
