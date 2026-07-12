import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MONSTERS, WEAPONS, getRank, getPoints, formatTime } from "@/lib/mh-data";
import { Trophy, ArrowLeft, Medal, Star, Skull, Crown, Swords, Clock, Search, UserRound, Users, Link } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type HuntWithUser = {
  id: string;
  userId: string | null;
  username: string;
  monsterId: string;
  weaponId: string;
  timeSeconds: number;
  isPb: boolean;
  date: string;
  attempts: number;
  mode: string;
  videoUrl: string | null;
};

type LeaderboardMode = "all" | "solo" | "duo" | "squad";

function RankBadge({ position }: { position: number }) {
  if (position === 1) return <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400/30" />;
  if (position === 2) return <Medal className="w-5 h-5 text-slate-300 fill-slate-300/30" />;
  if (position === 3) return <Medal className="w-5 h-5 text-amber-700 fill-amber-700/30" />;
  return <span className="text-muted-foreground font-mono text-sm w-5 text-center">{position}</span>;
}

export default function Leaderboard() {
  const [, setLocation] = useLocation();
  const [selectedMonster, setSelectedMonster] = useState(MONSTERS[0].id);
  const [selectedWeapon, setSelectedWeapon] = useState(WEAPONS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboardMode, setLeaderboardMode] = useState<LeaderboardMode>("all");

  const { data: allHunts = [], isLoading } = useQuery<HuntWithUser[]>({
    queryKey: ["/api/leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
  });

  const filteredHunts = useMemo(() =>
    leaderboardMode === "all" ? allHunts : allHunts.filter(h => h.mode === leaderboardMode),
    [allHunts, leaderboardMode]
  );

  // --- Overall Rankings ---
  const overallRankings = useMemo(() => {
    const globalBestPerMonster: Record<string, { timeSeconds: number; huntId: string }> = {};
    filteredHunts.forEach((hunt) => {
      const existing = globalBestPerMonster[hunt.monsterId];
      if (!existing || hunt.timeSeconds < existing.timeSeconds) {
        globalBestPerMonster[hunt.monsterId] = { timeSeconds: hunt.timeSeconds, huntId: hunt.id };
      }
    });

    const userStats: Record<string, {
      username: string;
      points: number;
      gold: number; silver: number; bronze: number; skull: number;
      stars: number; hunts: number;
    }> = {};

    filteredHunts.forEach((hunt) => {
      if (!hunt.userId) return;
      if (!userStats[hunt.userId]) {
        userStats[hunt.userId] = { username: hunt.username, points: 0, gold: 0, silver: 0, bronze: 0, skull: 0, stars: 0, hunts: 0 };
      }
      const rank = getRank(hunt.timeSeconds);
      const isGlobalBest = globalBestPerMonster[hunt.monsterId]?.huntId === hunt.id;
      const pts = getPoints(rank, isGlobalBest);
      const s = userStats[hunt.userId];
      s.points += pts;
      s[rank]++;
      s.hunts++;
      if (isGlobalBest) s.stars++;
    });

    return Object.values(userStats).sort((a, b) => b.points - a.points);
  }, [filteredHunts]);

  // --- Monster Records ---
  const monsterRecords = useMemo(() => {
    const filtered = filteredHunts.filter((h) => h.monsterId === selectedMonster);
    const perUser: Record<string, HuntWithUser> = {};
    filtered.forEach((hunt) => {
      const key = hunt.userId ?? hunt.username;
      if (!perUser[key] || hunt.timeSeconds < perUser[key].timeSeconds) {
        perUser[key] = hunt;
      }
    });
    return Object.values(perUser).sort((a, b) => a.timeSeconds - b.timeSeconds);
  }, [filteredHunts, selectedMonster]);

  // --- Weapon Records ---
  const weaponRecords = useMemo(() => {
    const filtered = filteredHunts.filter(
      (h) => h.monsterId === selectedMonster && h.weaponId === selectedWeapon
    );
    const perUser: Record<string, HuntWithUser> = {};
    filtered.forEach((hunt) => {
      const key = hunt.userId ?? hunt.username;
      if (!perUser[key] || hunt.timeSeconds < perUser[key].timeSeconds) {
        perUser[key] = hunt;
      }
    });
    return Object.values(perUser).sort((a, b) => a.timeSeconds - b.timeSeconds);
  }, [filteredHunts, selectedMonster, selectedWeapon]);

  const selectedMonsterData = MONSTERS.find((m) => m.id === selectedMonster);
  const selectedWeaponData = WEAPONS.find((w) => w.id === selectedWeapon);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white font-display text-xl">
        Loading leaderboard...
      </div>
    );
  }

  const modeButtons: { value: LeaderboardMode; label: string }[] = [
    { value: "all", label: "All" },
    { value: "solo", label: "Solo" },
    { value: "duo", label: "Duo" },
    { value: "squad", label: "Squad" },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-6 font-sans text-slate-200">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/50 backdrop-blur-md p-6 rounded-xl border border-white/5">
        <div className="flex items-center gap-4">
          <Button
            data-testid="button-back"
            variant="outline"
            size="icon"
            onClick={() => setLocation("/")}
            className="bg-background/50 border-white/10 hover:bg-white/10 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-display font-bold text-white tracking-wide uppercase">
              Hunter's <span className="text-primary">Guild</span>
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Global Leaderboard
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground uppercase tracking-wider">Hunters Ranked</div>
          <div className="text-3xl font-display font-bold text-primary">{overallRankings.length}</div>
        </div>
      </header>

      {/* Search + Mode Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search hunter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card/50 border-white/10 text-white placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs font-bold shrink-0">
          {modeButtons.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setLeaderboardMode(value)}
              className={cn(
                "px-3 py-2 transition-colors",
                leaderboardMode === value ? "bg-primary text-background" : "bg-background/30 text-muted-foreground hover:text-white"
              )}
            >
              {value === "solo" ? <UserRound className="w-3.5 h-3.5 inline mr-1" /> :
               value !== "all" ? <Users className="w-3.5 h-3.5 inline mr-1" /> : null}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overall">
        <TabsList className="bg-card/50 border border-white/10 w-full flex">
          <TabsTrigger value="overall" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-background font-bold gap-1.5 py-2.5 text-xs">
            <Trophy className="w-3.5 h-3.5 shrink-0" /> Overall
          </TabsTrigger>
          <TabsTrigger value="monster" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-background font-bold gap-1.5 py-2.5 text-xs">
            <Skull className="w-3.5 h-3.5 shrink-0" /> Monster
          </TabsTrigger>
          <TabsTrigger value="weapon" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-background font-bold gap-1.5 py-2.5 text-xs">
            <Swords className="w-3.5 h-3.5 shrink-0" /> Weapon
          </TabsTrigger>
        </TabsList>

        {/* --- OVERALL --- */}
        <TabsContent value="overall" className="mt-6">
          {overallRankings.length === 0 ? (
            <Card className="bg-card/40 border-white/5">
              <CardContent className="py-12 text-center text-muted-foreground">
                No hunters have logged any hunts yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {overallRankings
                .filter(h => h.username.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((hunter, i) => (
                  <Card
                    key={hunter.username}
                    data-testid={`row-overall-${i}`}
                    onClick={() => setLocation(`/profile/${hunter.username}`)}
                    className={cn(
                      "bg-card/40 border-white/5 backdrop-blur-sm transition-all hover:bg-card/60 cursor-pointer",
                      i === 0 && "border-yellow-400/30 bg-gradient-to-r from-card/60 to-yellow-400/5"
                    )}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex items-center justify-center w-8 shrink-0">
                        <RankBadge position={i + 1} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-white text-lg leading-tight truncate">
                          {hunter.username}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-yellow-400">
                            <Medal className="w-3 h-3 fill-yellow-400/30" /> {hunter.gold}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-300">
                            <Medal className="w-3 h-3 fill-slate-300/30" /> {hunter.silver}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-amber-700">
                            <Medal className="w-3 h-3 fill-amber-700/30" /> {hunter.bronze}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Skull className="w-3 h-3" /> {hunter.skull}
                          </span>
                          {hunter.stars > 0 && (
                            <span className="flex items-center gap-1 text-xs text-primary">
                              <Star className="w-3 h-3 fill-primary/30" /> {hunter.stars} record{hunter.stars > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-display font-bold text-primary">{hunter.points}</div>
                        <div className="text-xs text-muted-foreground">pts • {hunter.hunts} hunt{hunter.hunts !== 1 ? "s" : ""}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* --- MONSTER RECORDS --- */}
        <TabsContent value="monster" className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <Select value={selectedMonster} onValueChange={setSelectedMonster}>
              <SelectTrigger data-testid="select-monster" className="w-[220px] bg-card/50 border-white/10 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 text-slate-200">
                {MONSTERS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <m.icon className={cn("w-4 h-4", m.color)} /> {m.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMonsterData && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <selectedMonsterData.icon className={cn("w-4 h-4", selectedMonsterData.color)} />
                Best times for {selectedMonsterData.name}
              </div>
            )}
          </div>

          {monsterRecords.length === 0 ? (
            <Card className="bg-card/40 border-white/5">
              <CardContent className="py-12 text-center text-muted-foreground">
                No one has hunted {selectedMonsterData?.name} yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {monsterRecords.map((hunt, i) => {
                const weapon = WEAPONS.find((w) => w.id === hunt.weaponId);
                return (
                  <Card
                    key={hunt.id}
                    data-testid={`row-monster-${i}`}
                    onClick={() => setLocation(`/profile/${hunt.username}`)}
                    className={cn(
                      "bg-card/40 border-white/5 backdrop-blur-sm transition-all hover:bg-card/60 cursor-pointer",
                      i === 0 && "border-yellow-400/30 bg-gradient-to-r from-card/60 to-yellow-400/5"
                    )}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex items-center justify-center w-8 shrink-0">
                        <RankBadge position={i + 1} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-white text-lg leading-tight">
                          {hunt.username}
                        </div>
                        <div className="text-sm text-muted-foreground">{weapon?.name ?? hunt.weaponId}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hunt.videoUrl && (
                          <a href={hunt.videoUrl} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-primary/60 hover:text-primary transition-colors" title="Watch proof">
                            <Link className="w-4 h-4" />
                          </a>
                        )}
                        <div className="text-right">
                          <div className="text-2xl font-display font-bold text-primary font-mono">
                            {formatTime(hunt.timeSeconds)}
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-xs border",
                            getRank(hunt.timeSeconds) === "gold" && "border-yellow-400/50 text-yellow-400",
                            getRank(hunt.timeSeconds) === "silver" && "border-slate-300/50 text-slate-300",
                            getRank(hunt.timeSeconds) === "bronze" && "border-amber-700/50 text-amber-700",
                            getRank(hunt.timeSeconds) === "skull" && "border-gray-500/50 text-gray-500",
                          )}>
                            {getRank(hunt.timeSeconds).toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* --- WEAPON RECORDS --- */}
        <TabsContent value="weapon" className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Select value={selectedMonster} onValueChange={setSelectedMonster}>
              <SelectTrigger data-testid="select-weapon-monster" className="w-[220px] bg-card/50 border-white/10 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 text-slate-200">
                {MONSTERS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <m.icon className={cn("w-4 h-4", m.color)} /> {m.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedWeapon} onValueChange={setSelectedWeapon}>
              <SelectTrigger data-testid="select-weapon" className="w-[200px] bg-card/50 border-white/10 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 text-slate-200 max-h-[40vh] overflow-y-auto">
                {WEAPONS.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMonsterData && selectedWeaponData && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Best {selectedWeaponData.name} times on {selectedMonsterData.name}
            </p>
          )}

          {weaponRecords.length === 0 ? (
            <Card className="bg-card/40 border-white/5">
              <CardContent className="py-12 text-center text-muted-foreground">
                No one has logged a {selectedWeaponData?.name} run on {selectedMonsterData?.name} yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {weaponRecords.map((hunt, i) => (
                <Card
                  key={hunt.id}
                  data-testid={`row-weapon-${i}`}
                  onClick={() => setLocation(`/profile/${hunt.username}`)}
                  className={cn(
                    "bg-card/40 border-white/5 backdrop-blur-sm transition-all hover:bg-card/60 cursor-pointer",
                    i === 0 && "border-yellow-400/30 bg-gradient-to-r from-card/60 to-yellow-400/5"
                  )}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex items-center justify-center w-8 shrink-0">
                      <RankBadge position={i + 1} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-white text-lg leading-tight">
                        {hunt.username}
                      </div>
                      <div className="text-xs text-muted-foreground">{hunt.attempts} attempt{hunt.attempts !== 1 ? "s" : ""} logged</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hunt.videoUrl && (
                        <a href={hunt.videoUrl} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-primary/60 hover:text-primary transition-colors" title="Watch proof">
                          <Link className="w-4 h-4" />
                        </a>
                      )}
                      <div className="text-right">
                        <div className="text-2xl font-display font-bold text-primary font-mono">
                          {formatTime(hunt.timeSeconds)}
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-xs border",
                          getRank(hunt.timeSeconds) === "gold" && "border-yellow-400/50 text-yellow-400",
                          getRank(hunt.timeSeconds) === "silver" && "border-slate-300/50 text-slate-300",
                          getRank(hunt.timeSeconds) === "bronze" && "border-amber-700/50 text-amber-700",
                          getRank(hunt.timeSeconds) === "skull" && "border-gray-500/50 text-gray-500",
                        )}>
                          {getRank(hunt.timeSeconds).toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
