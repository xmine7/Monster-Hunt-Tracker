import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  MONSTERS, WEAPONS, INITIAL_HUNTS, 
  getRank, getPoints, formatTime, parseTime,
  type HuntRecord, type Rank 
} from "@/lib/mh-data";
import { 
  Skull, Medal, Star, Diamond, 
  Plus, Trophy, Swords,
  TrendingUp, TrendingDown, RotateCcw, Trash2, Undo2, Shuffle, Dices,
  LogOut, User, Link, Users, UserRound, Settings
} from "lucide-react";
import { useUser, useLogout } from "@/hooks/use-user";
import { useSettings } from "@/hooks/use-settings";
import { AVATARS, getAvatar } from "@/lib/avatars";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function RankIcon({ rank, className }: { rank: Rank, className?: string }) {
  switch (rank) {
    case "gold": return <Medal className={cn("text-yellow-500 fill-yellow-500/20", className)} />;
    case "silver": return <Medal className={cn("text-slate-300 fill-slate-300/20", className)} />;
    case "bronze": return <Medal className={cn("text-amber-700 fill-amber-700/20", className)} />;
    case "skull": return <Skull className={cn("text-gray-500", className)} />;
  }
}

type HuntMode = "solo" | "duo" | "squad";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const logout = useLogout();
  const [, setLocation] = useLocation();

  const [mode, setMode] = useState<HuntMode>("solo");

  // Fetch hunts from API by mode
  const { data: hunts = [], isLoading } = useQuery({
    queryKey: ["hunts", mode],
    queryFn: async () => {
      const response = await fetch(`/api/hunts?mode=${mode}`);
      if (!response.ok) throw new Error("Failed to fetch hunts");
      const data = await response.json();
      // Parse dates
      return data.map((hunt: any) => ({
        ...hunt,
        date: new Date(hunt.date),
      }));
    },
  });

  const { settings, set: setSetting } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameMsg, setUsernameMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialDiscord, setSocialDiscord] = useState("");
  const [socialMsg, setSocialMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { avatar?: string; youtubeUrl?: string; discordTag?: string }) => {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setSocialMsg({ ok: true, text: "Saved!" });
    },
    onError: () => setSocialMsg({ ok: false, text: "Failed to save" }),
  });

  const changeUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch("/api/me/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setUsernameMsg({ ok: true, text: "Name updated!" });
      setNewUsername("");
    },
    onError: (e: Error) => setUsernameMsg({ ok: false, text: e.message }),
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [huntToDelete, setHuntToDelete] = useState<HuntRecord | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [buildUrl, setBuildUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [dashBuildModal, setDashBuildModal] = useState<string | null>(null);

  // History for Undo functionality
  const [history, setHistory] = useState<HuntRecord[][]>([]);

  // Form State
  const [selectedMonster, setSelectedMonster] = useState(MONSTERS[0].id);
  const [selectedWeapon, setSelectedWeapon] = useState(WEAPONS[0].id);
  const [timeInput, setTimeInput] = useState("");
  const [timeWarning, setTimeWarning] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "points" | "hunts">("default");

  // Random Challenge State - persist selections in localStorage
  const [isRandomOpen, setIsRandomOpen] = useState(false);
  const [selectedRandomMonsters, setSelectedRandomMonsters] = useState<string[]>(() => {
    const saved = localStorage.getItem("mhw-random-monsters");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedRandomWeapons, setSelectedRandomWeapons] = useState<string[]>(() => {
    const saved = localStorage.getItem("mhw-random-weapons");
    return saved ? JSON.parse(saved) : [];
  });
  const [randomResult, setRandomResult] = useState<{ monster: string, weapon: string } | null>(null);

  // Persist random selections
  useEffect(() => {
    localStorage.setItem("mhw-random-monsters", JSON.stringify(selectedRandomMonsters));
  }, [selectedRandomMonsters]);

  useEffect(() => {
    localStorage.setItem("mhw-random-weapons", JSON.stringify(selectedRandomWeapons));
  }, [selectedRandomWeapons]);

  const handleRandomChallenge = () => {
    if (selectedRandomMonsters.length === 0 || selectedRandomWeapons.length === 0) return;
    
    const randomMonster = selectedRandomMonsters[Math.floor(Math.random() * selectedRandomMonsters.length)];
    const randomWeapon = selectedRandomWeapons[Math.floor(Math.random() * selectedRandomWeapons.length)];
    
    setRandomResult({ monster: randomMonster, weapon: randomWeapon });
  };

  const toggleRandomMonster = (monsterId: string) => {
    setSelectedRandomMonsters(prev => 
      prev.includes(monsterId) 
        ? prev.filter(id => id !== monsterId)
        : [...prev, monsterId]
    );
  };

  const toggleRandomWeapon = (weaponId: string) => {
    setSelectedRandomWeapons(prev => 
      prev.includes(weaponId) 
        ? prev.filter(id => id !== weaponId)
        : [...prev, weaponId]
    );
  };

  // Mutations
  const addHuntMutation = useMutation({
    mutationFn: async (hunt: Omit<HuntRecord, "id" | "date"> & { mode: HuntMode }) => {
      const response = await fetch("/api/hunts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hunt),
      });
      if (!response.ok) throw new Error("Failed to add hunt");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hunts", mode] });
    },
  });

  const resetHuntsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/hunts?mode=${mode}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to reset hunts");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hunts", mode] });
    },
  });

  const stats = useMemo(() => {
    const weaponStats: Record<string, { points: number, hunts: number, attempts: number, gold: number, silver: number, bronze: number, skull: number, star: number, lastHuntDate: number }> = {};
    let totalPoints = 0;
    
    // Initialize
    WEAPONS.forEach(w => {
      weaponStats[w.id] = { points: 0, hunts: 0, attempts: 0, gold: 0, silver: 0, bronze: 0, skull: 0, star: 0, lastHuntDate: 0 };
    });

    // Calculate Best Time per Monster (across ALL weapons)
    // We store the ID of the hunt that holds the record.
    // Logic: Lowest time wins. Tie-breaker: Newest date wins.
    const bestHuntPerMonster: Record<string, string> = {}; // monsterId -> huntId
    const bestStatsPerMonster: Record<string, { time: number, date: number }> = {};

    hunts.forEach((hunt: HuntRecord) => {
      const currentStats = bestStatsPerMonster[hunt.monsterId];
      const huntDate = new Date(hunt.date).getTime();

      if (!currentStats) {
        // First record seen for this monster
        bestStatsPerMonster[hunt.monsterId] = { time: hunt.timeSeconds, date: huntDate };
        bestHuntPerMonster[hunt.monsterId] = hunt.id;
      } else {
        if (hunt.timeSeconds < currentStats.time) {
          // Strictly better time
          bestStatsPerMonster[hunt.monsterId] = { time: hunt.timeSeconds, date: huntDate };
          bestHuntPerMonster[hunt.monsterId] = hunt.id;
        } else if (hunt.timeSeconds === currentStats.time) {
          // Tie: Check if this one is newer
          if (huntDate > currentStats.date) {
            bestStatsPerMonster[hunt.monsterId] = { time: hunt.timeSeconds, date: huntDate };
            bestHuntPerMonster[hunt.monsterId] = hunt.id;
          }
        }
      }
    });

    hunts.forEach((hunt: HuntRecord) => {
      const rank = getRank(hunt.timeSeconds);
      // It is a Global Best Time if this specific hunt ID is the recorded best for this monster
      const isGlobalBest = bestHuntPerMonster[hunt.monsterId] === hunt.id;
      
      const points = getPoints(rank, isGlobalBest);
      const ws = weaponStats[hunt.weaponId];
      
      if (ws) {
        ws.points += points;
        ws.hunts += 1;
        ws.attempts += (hunt.attempts || 1);
        ws[rank]++;
        if (isGlobalBest) ws.star++;
        
        // Track the most recent hunt time for this weapon
        const huntTime = new Date(hunt.date).getTime();
        if (huntTime > ws.lastHuntDate) {
          ws.lastHuntDate = huntTime;
        }
      }
      totalPoints += points;
    });

    const sortedWeapons = Object.entries(weaponStats)
      .map(([id, stat]) => ({ id, ...stat }))
      .sort((a, b) => {
        // First check: Are they active?
        const aActive = a.hunts > 0;
        const bActive = b.hunts > 0;

        // Sorting Logic
        if (sortBy === "points") {
          // Active first, then by points (desc)
          if (aActive && !bActive) return -1;
          if (!aActive && bActive) return 1;
          if (aActive && bActive) {
            if (b.points !== a.points) return b.points - a.points;
            // Tie-breaker: Last Hunt Date
            return b.lastHuntDate - a.lastHuntDate;
          }
          // Inactive: Base Order
          const aIndex = WEAPONS.findIndex(w => w.id === a.id);
          const bIndex = WEAPONS.findIndex(w => w.id === b.id);
          return aIndex - bIndex;
        }

        if (sortBy === "hunts") {
          // Active first, then by hunts (desc)
          if (aActive && !bActive) return -1;
          if (!aActive && bActive) return 1;
          if (aActive && bActive) {
            if (b.attempts !== a.attempts) return b.attempts - a.attempts;
             // Tie-breaker: Points
            return b.points - a.points;
          }
          // Inactive: Base Order
          const aIndex = WEAPONS.findIndex(w => w.id === a.id);
          const bIndex = WEAPONS.findIndex(w => w.id === b.id);
          return aIndex - bIndex;
        }

        // Default: Active weapons by Last Updated (desc), then Inactive weapons by base game order
        if (aActive && bActive) {
           return b.lastHuntDate - a.lastHuntDate;
        }

        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;

        const aIndex = WEAPONS.findIndex(w => w.id === a.id);
        const bIndex = WEAPONS.findIndex(w => w.id === b.id);
        return aIndex - bIndex;
      });

    // Get Best and Worst (only considering weapons with > 0 hunts)
    const activeWeapons = sortedWeapons.filter(w => w.hunts > 0);
    
    // Sort active weapons by points (descending) for Best/Worst calculation
    const pointsSortedWeapons = [...activeWeapons].sort((a, b) => b.points - a.points);
    
    // Handle ties for best weapons
    const bestWeapons = [];
    if (pointsSortedWeapons.length > 0) {
      const maxPoints = pointsSortedWeapons[0].points;
      // Get all weapons that have the max points
      bestWeapons.push(...pointsSortedWeapons.filter(w => w.points === maxPoints));
    }

    // Handle ties for worst weapons
    const worstWeapons = [];
    if (pointsSortedWeapons.length > 0) {
      const minPoints = pointsSortedWeapons[pointsSortedWeapons.length - 1].points;
      // Get all weapons that have the min points
      worstWeapons.push(...pointsSortedWeapons.filter(w => w.points === minPoints));
    }
    
    // Filter out cases where best and worst are the same set (e.g. only 1 active weapon or all have same points)
    // But keep them if they are distinct groups
    
    // Calculate Max Possible Points based on actual hunts logged
    // Each hunt can earn max 3 points (gold) + 1 star bonus per unique monster
    const totalHuntsLogged = hunts.length;
    const uniqueMonstersHunted = new Set(hunts.map((h: HuntRecord) => h.monsterId)).size;
    const maxPossiblePoints = (totalHuntsLogged * 3) + uniqueMonstersHunted;
    
    const totalAttempts = hunts.reduce((acc: number, hunt: HuntRecord) => acc + (hunt.attempts || 1), 0);

    // Build best time per monster with weapon info
    const bestTimePerMonster: Record<string, { timeSeconds: number, weaponId: string, huntId: string }> = {};
    hunts.forEach((hunt: HuntRecord) => {
      const existing = bestTimePerMonster[hunt.monsterId];
      if (!existing || hunt.timeSeconds < existing.timeSeconds) {
        bestTimePerMonster[hunt.monsterId] = { timeSeconds: hunt.timeSeconds, weaponId: hunt.weaponId, huntId: hunt.id };
      }
    });

    return { totalPoints, maxPossiblePoints, weaponStats: sortedWeapons, totalHunts: totalAttempts, bestWeapons, worstWeapons, bestHuntPerMonster, bestTimePerMonster };
  }, [hunts, sortBy]);

  const handleAddHunt = () => {
    const time = parseTime(timeInput);
    if (!time) return;

    // Check if a record already exists for this monster/weapon
    const existingHunt = hunts.find(
      (h: HuntRecord) => h.monsterId === selectedMonster && h.weaponId === selectedWeapon
    );

    // Don't save if new time is worse than existing PB
    if (existingHunt && time >= existingHunt.timeSeconds) {
      setTimeWarning(`Not saved — your current PB is ${formatTime(existingHunt.timeSeconds)}. Only better times are recorded.`);
      return;
    }

    setTimeWarning("");

    // Save to history before modifying
    setHistory((h: HuntRecord[][]) => [...h, hunts]);

    addHuntMutation.mutate({
      monsterId: selectedMonster,
      weaponId: selectedWeapon,
      timeSeconds: time,
      isPb: true,
      attempts: existingHunt ? (existingHunt.attempts || 1) + 1 : 1,
      mode: mode,
      videoUrl: videoUrl.trim() || null,
      buildUrl: buildUrl.trim() || null,
      notes: notes.trim() || null,
    });

    setIsAddOpen(false);
    setTimeInput("");
    setVideoUrl("");
    setBuildUrl("");
    setNotes("");
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    
    // Clear current database and restore previous state
    resetHuntsMutation.mutate(undefined, {
      onSuccess: async () => {
        // Re-add all previous hunts
        for (const hunt of previous) {
          await addHuntMutation.mutateAsync({
            monsterId: hunt.monsterId,
            weaponId: hunt.weaponId,
            timeSeconds: hunt.timeSeconds,
            isPb: hunt.isPb,
            attempts: hunt.attempts || 1,
            mode: mode,
          });
        }
        setHistory((h: HuntRecord[][]) => h.slice(0, -1));
      }
    });
  };

  const handleReset = () => {
    setHistory((h: HuntRecord[][]) => [...h, hunts]); // Save current state before reset
    resetHuntsMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading your hunts...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 font-sans text-slate-200">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden">
        {/* Title row — full width, centered */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10 text-center">
          <h1 className="text-4xl font-display font-bold text-white tracking-wide uppercase leading-tight">
            Hunter's <span className="text-primary">Log</span>
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2 mt-1 text-sm">
            <Trophy className="w-3.5 h-3.5" />
            World Speedrun Tracker
          </p>
        </div>

        {/* Bottom 2-col row */}
        <div className="grid grid-cols-2">
          {/* Left: score + leaderboard */}
          <div className="flex flex-col gap-4 p-5">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Points</div>
              <div className="text-3xl font-display font-bold text-primary flex items-center gap-2">
                <span className="flex items-baseline gap-1">
                  {stats.totalPoints}
                  <span className="text-base text-muted-foreground font-normal">/ {stats.maxPossiblePoints}</span>
                </span>
                <Diamond className="w-5 h-5 fill-primary/20" />
              </div>
            </div>
            <Button
              data-testid="button-leaderboard"
              variant="outline"
              onClick={() => setLocation("/leaderboard")}
              className="w-full bg-background/50 border-white/10 hover:bg-white/10 text-muted-foreground hover:text-white text-xs gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5" /> View Leaderboard
            </Button>
          </div>

          {/* Right: avatar + username + buttons */}
          <div className="flex flex-col items-center justify-between gap-3 p-5 border-l border-white/10">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2", getAvatar(user?.avatar).bg, getAvatar(user?.avatar).border)}>
                {getAvatar(user?.avatar).emoji}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <User className="w-3 h-3 text-muted-foreground" />
                <span className="font-bold text-slate-200">{user?.username}</span>
              </div>
              {user?.hunterId && (
                <div className="text-xs text-muted-foreground/70">
                  Hunter ID: <span className="font-mono text-primary/80">{user.hunterId}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => { setIsSettingsOpen(true); setNewUsername(""); setUsernameMsg(null); }}
                className="bg-background/50 border-white/10 hover:bg-white/10 text-muted-foreground hover:text-white text-xs gap-1.5"
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </Button>
              <Button
                data-testid="button-logout"
                variant="outline"
                onClick={logout}
                className="bg-background/50 border-white/10 hover:bg-white/10 text-muted-foreground hover:text-white text-xs gap-1.5"
              >
                <LogOut className="w-3 h-3" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Dialog — lives outside header so it doesn't become a 3rd grid cell */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="bg-card border-white/10 text-slate-200 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" /> Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">

            {/* Display toggles */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Display</p>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Show hunt dates</span>
                <button
                  onClick={() => setSetting("showDates", !settings.showDates)}
                  className={cn("relative w-10 h-5 rounded-full transition-colors", settings.showDates ? "bg-primary" : "bg-white/20")}
                >
                  <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", settings.showDates ? "left-5.5 translate-x-0.5" : "left-0.5")} />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Show medals</span>
                <button
                  onClick={() => setSetting("showMedals", !settings.showMedals)}
                  className={cn("relative w-10 h-5 rounded-full transition-colors", settings.showMedals ? "bg-primary" : "bg-white/20")}
                >
                  <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", settings.showMedals ? "left-5.5 translate-x-0.5" : "left-0.5")} />
                </button>
              </label>
            </div>

            {/* Avatar picker */}
            <div className="space-y-3 border-t border-white/10 pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Avatar</p>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map(av => (
                  <button
                    key={av.id}
                    title={av.label}
                    onClick={() => updateProfileMutation.mutate({ avatar: av.id })}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all",
                      av.bg, av.border,
                      user?.avatar === av.id || (!user?.avatar && av.id === "default")
                        ? "ring-2 ring-primary ring-offset-1 ring-offset-background scale-110"
                        : "opacity-60 hover:opacity-100"
                    )}
                  >
                    {av.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Socials */}
            <div className="space-y-3 border-t border-white/10 pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Socials</p>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">YouTube channel URL</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={user?.youtubeUrl ?? "https://youtube.com/@..."}
                    value={socialYoutube}
                    onChange={(e) => { setSocialYoutube(e.target.value); setSocialMsg(null); }}
                    className="bg-background/50 border-white/10 text-sm h-8"
                  />
                  <Button size="sm" className="h-8 bg-primary text-background font-bold shrink-0"
                    onClick={() => updateProfileMutation.mutate({ youtubeUrl: socialYoutube.trim() || undefined })}
                    disabled={!socialYoutube.trim() || updateProfileMutation.isPending}>Save</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Discord tag</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={user?.discordTag ?? "username#0000 or @username"}
                    value={socialDiscord}
                    onChange={(e) => { setSocialDiscord(e.target.value); setSocialMsg(null); }}
                    className="bg-background/50 border-white/10 text-sm h-8"
                  />
                  <Button size="sm" className="h-8 bg-primary text-background font-bold shrink-0"
                    onClick={() => updateProfileMutation.mutate({ discordTag: socialDiscord.trim() || undefined })}
                    disabled={!socialDiscord.trim() || updateProfileMutation.isPending}>Save</Button>
                </div>
              </div>
              {socialMsg && (
                <p className={cn("text-xs", socialMsg.ok ? "text-green-400" : "text-destructive")}>{socialMsg.text}</p>
              )}
            </div>

            {/* Change name */}
            <div className="space-y-2 border-t border-white/10 pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Account</p>
              <Label className="text-sm">Change display name</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={user?.username ?? "New name..."}
                  value={newUsername}
                  onChange={(e) => { setNewUsername(e.target.value); setUsernameMsg(null); }}
                  className="bg-background/50 border-white/10 text-sm h-8"
                />
                <Button
                  size="sm"
                  className="h-8 bg-primary text-background font-bold shrink-0"
                  onClick={() => changeUsernameMutation.mutate(newUsername)}
                  disabled={!newUsername.trim() || changeUsernameMutation.isPending}
                >
                  Save
                </Button>
              </div>
              {usernameMsg && (
                <p className={cn("text-xs", usernameMsg.ok ? "text-green-400" : "text-destructive")}>{usernameMsg.text}</p>
              )}
            </div>

            {/* Feedback */}
            <div className="space-y-2 border-t border-white/10 pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Feedback</p>
              <p className="text-xs text-muted-foreground">Found a bug or have a suggestion? Let us know!</p>
              <a
                href="https://discord.gg/Z9TByDdy"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-md py-2 transition-colors"
              >
                💬 Send feedback
              </a>
            </div>

          </div>
        </DialogContent>
      </Dialog>


      {/* Stats Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.bestWeapons.length > 0 && (
          <Card className="bg-gradient-to-br from-card/60 to-primary/10 border-primary/20">
             <CardContent className="flex items-center justify-between p-6">
               <div className="flex-1 min-w-0 mr-4">
                 <div className="text-sm text-primary uppercase font-bold tracking-wider mb-1">Best Performing Weapon{stats.bestWeapons.length > 1 ? 's' : ''}</div>
                 <div className="text-2xl font-display font-bold text-white truncate leading-tight">
                   {stats.bestWeapons.map(w => WEAPONS.find(weapon => weapon.id === w.id)?.name).join(", ")}
                 </div>
               </div>
               <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                 <TrendingUp className="w-6 h-6 text-primary" />
               </div>
             </CardContent>
          </Card>
        )}
        
        {stats.worstWeapons.length > 0 && 
         // Don't show "Needs Improvement" if it's the exact same set as "Best Performing" (e.g. only 1 weapon used)
         !(stats.bestWeapons.length === stats.worstWeapons.length && stats.bestWeapons.every(bw => stats.worstWeapons.some(ww => ww.id === bw.id))) && (
          <Card className="bg-gradient-to-br from-card/60 to-destructive/10 border-destructive/20">
             <CardContent className="flex items-center justify-between p-6">
               <div className="flex-1 min-w-0 mr-4">
                 <div className="text-sm text-destructive uppercase font-bold tracking-wider mb-1">Needs Improvement</div>
                 <div className="text-2xl font-display font-bold text-white truncate leading-tight">
                   {stats.worstWeapons.map(w => WEAPONS.find(weapon => weapon.id === w.id)?.name).join(", ")}
                 </div>
               </div>
               <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                 <TrendingDown className="w-6 h-6 text-destructive" />
               </div>
             </CardContent>
          </Card>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Weapon Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                <Swords className="w-6 h-6 text-primary" /> Weapon Performance
              </h2>
              <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs font-bold">
                {(["solo", "duo", "squad"] as HuntMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "px-3 py-1.5 capitalize transition-colors",
                      mode === m ? "bg-primary text-background" : "bg-background/30 text-muted-foreground hover:text-white"
                    )}
                  >
                    {m === "solo" ? <UserRound className="w-3.5 h-3.5 inline mr-1" /> : <Users className="w-3.5 h-3.5 inline mr-1" />}
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleUndo}
                disabled={history.length === 0}
                className="bg-background/50 border-white/10 h-9 w-9 hover:bg-white/10 disabled:opacity-30"
                title="Undo last action"
              >
                <Undo2 className="w-4 h-4 text-slate-200" />
              </Button>

              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[140px] bg-background/50 border-white/10 h-9 text-xs font-bold uppercase tracking-wide">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10 text-slate-200">
                  <SelectItem value="default">Most Recent</SelectItem>
                  <SelectItem value="points">Total Points</SelectItem>
                </SelectContent>
              </Select>

              <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) { setTimeWarning(""); setTimeInput(""); setVideoUrl(""); setBuildUrl(""); setNotes(""); } }}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-background hover:bg-primary/90 font-display font-bold tracking-wider h-9">
                    <Plus className="w-4 h-4 mr-2" /> Log Hunt
                  </Button>
                </DialogTrigger>
              <DialogContent className="bg-card border-white/10 text-slate-200">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">Log New Hunt</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Monster</Label>
                    <Select value={selectedMonster} onValueChange={setSelectedMonster}>
                      <SelectTrigger className="bg-background/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-slate-200 max-h-[40vh] overflow-y-auto">
                        {MONSTERS.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                             <div className="flex items-center gap-2">
                               <m.icon className={cn("w-4 h-4", m.color)} /> {m.name}
                             </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Weapon</Label>
                    <Select value={selectedWeapon} onValueChange={setSelectedWeapon}>
                      <SelectTrigger className="bg-background/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-slate-200 max-h-[40vh] overflow-y-auto">
                        {WEAPONS.map(w => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Time (mm:ss)</Label>
                    <Input 
                      placeholder="e.g. 14:24" 
                      value={timeInput}
                      onChange={(e) => { setTimeInput(e.target.value); setTimeWarning(""); }}
                      className="bg-background/50 border-white/10 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Proof Link <span className="text-muted-foreground text-xs font-normal">(optional — YouTube, clip, etc.)</span></Label>
                    <Input
                      placeholder="https://youtube.com/..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="bg-background/50 border-white/10 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Build Image <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="URL or leave blank to upload"
                        value={buildUrl.startsWith("data:") ? "" : buildUrl}
                        onChange={(e) => setBuildUrl(e.target.value)}
                        className="bg-background/50 border-white/10 text-sm flex-1"
                        disabled={buildUrl.startsWith("data:")}
                      />
                      <label className="cursor-pointer shrink-0">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => setBuildUrl(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }} />
                        <div className="h-9 px-3 flex items-center rounded-md border border-white/10 bg-background/50 text-xs text-muted-foreground hover:text-white hover:bg-white/10 transition-colors">
                          {buildUrl.startsWith("data:") ? "✓ Uploaded" : "Upload"}
                        </div>
                      </label>
                    </div>
                    {buildUrl.startsWith("data:") && (
                      <div className="flex items-center gap-2">
                        <img src={buildUrl} alt="Build preview" className="h-12 rounded border border-white/10 object-cover" />
                        <button onClick={() => setBuildUrl("")} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Notes <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                    <textarea
                      placeholder="e.g. used temporal mantle, ES3..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-white/10 bg-background/50 px-3 py-2 text-sm text-slate-200 placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  {timeWarning && (
                    <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
                      {timeWarning}
                    </p>
                  )}
                  <Button onClick={handleAddHunt} className="w-full bg-primary text-background font-bold">
                    Add Entry
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          <div className="grid gap-4">
            {stats.weaponStats.map((weapon) => {
              const weaponName = WEAPONS.find(w => w.id === weapon.id)?.name;
              const isInactive = weapon.hunts === 0;
              return (
                <Card key={weapon.id} className={cn(
                  "bg-card/40 border-white/5 backdrop-blur-sm overflow-hidden group transition-all",
                  isInactive ? "opacity-50 hover:opacity-100 grayscale hover:grayscale-0" : "hover:bg-card/60"
                )}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="font-display text-xl text-white flex items-center gap-2">
                        {weaponName}
                      </CardTitle>
                      <div className={cn(
                        "flex items-center gap-1 font-bold font-mono text-lg",
                        isInactive ? "text-muted-foreground" : "text-primary"
                      )}>
                        {weapon.points} <Diamond className={cn("w-4 h-4", isInactive ? "fill-muted/20" : "fill-primary/20")} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {settings.showMedals && (
                      <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1"><Medal className="w-4 h-4 text-yellow-500" /> {weapon.gold}</div>
                        <div className="flex items-center gap-1"><Medal className="w-4 h-4 text-slate-300" /> {weapon.silver}</div>
                        <div className="flex items-center gap-1"><Medal className="w-4 h-4 text-amber-700" /> {weapon.bronze}</div>
                        <div className="flex items-center gap-1"><Skull className="w-4 h-4 text-gray-500" /> {weapon.skull}</div>
                        <div className="flex items-center gap-1"><Star className="w-4 h-4 text-accent fill-accent/20" /> {weapon.star}</div>
                      </div>
                    )}
                    
                    {/* Personal Bests List for this weapon — always show all monsters */}
                    <div className="space-y-1 mt-2 border-t border-white/5 pt-2">
                      {MONSTERS.map((monster) => {
                        const hunt = hunts.find(
                          (h: HuntRecord) => h.weaponId === weapon.id && h.monsterId === monster.id && h.isPb
                        );
                        const rank = hunt ? getRank(hunt.timeSeconds) : null;
                        return (
                          <div key={monster.id} className="group flex items-center justify-between text-sm py-1">
                            <div className="flex items-center gap-2">
                              <monster.icon className={cn("w-4 h-4", hunt ? monster.color : "text-muted-foreground/40")} />
                              <div className="flex flex-col leading-none">
                                {hunt ? (
                                  <>
                                    <span className="font-mono text-slate-300">{formatTime(hunt.timeSeconds)}</span>
                                    {settings.showDates && hunt.date && (
                                      <span className="text-[10px] text-muted-foreground/50 mt-0.5">
                                        {new Date(hunt.date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="font-mono text-muted-foreground/40 italic text-xs">tbd</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {rank && settings.showMedals && <RankIcon rank={rank} className="w-4 h-4" />}
                              {hunt && stats.bestHuntPerMonster[hunt.monsterId] === hunt.id && (
                                <Star className="w-3 h-3 text-accent fill-accent" />
                              )}
                              {hunt?.videoUrl && (
                                <a href={hunt.videoUrl} target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="w-5 h-5 rounded border border-primary/40 text-primary/70 hover:border-primary hover:text-primary bg-primary/5 text-[10px] font-bold flex items-center justify-center transition-colors"
                                  title="Watch proof">1</a>
                              )}
                              {hunt?.buildUrl && (
                                hunt.buildUrl.startsWith("data:") ? (
                                  <button onClick={e => { e.stopPropagation(); setDashBuildModal(hunt.buildUrl!); }}
                                    className="w-5 h-5 rounded border border-yellow-500/40 text-yellow-500/70 hover:border-yellow-400 hover:text-yellow-400 bg-yellow-500/5 text-[10px] font-bold flex items-center justify-center transition-colors"
                                    title="View build">2</button>
                                ) : (
                                  <a href={hunt.buildUrl} target="_blank" rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="w-5 h-5 rounded border border-yellow-500/40 text-yellow-500/70 hover:border-yellow-400 hover:text-yellow-400 bg-yellow-500/5 text-[10px] font-bold flex items-center justify-center transition-colors"
                                    title="View build">2</a>
                                )
                              )}
                              {hunt?.notes && (
                                <span title={hunt.notes}
                                  className="w-5 h-5 rounded border border-slate-500/40 text-slate-400/70 hover:border-slate-300 hover:text-slate-300 bg-white/5 text-[10px] font-bold flex items-center justify-center cursor-default">3</span>
                              )}
                              {hunt && (
                                <button
                                  data-testid={`button-delete-hunt-${hunt.id}`}
                                  onClick={() => setHuntToDelete(hunt)}
                                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive ml-1"
                                  title="Delete this hunt"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Random Challenge & Scoring */}
        <div className="space-y-6">
          {/* Random Challenge Card */}
          <Card className="bg-gradient-to-br from-card/60 to-purple-500/10 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg text-white flex items-center gap-2">
                <Dices className="w-5 h-5 text-purple-400" /> Random Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog open={isRandomOpen} onOpenChange={setIsRandomOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold">
                    <Shuffle className="w-4 h-4 mr-2" /> Pick Random Hunt
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-white/10 text-slate-200 max-w-md max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl flex items-center gap-2">
                      <Dices className="w-6 h-6 text-purple-400" /> Random Challenge
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Show Result Screen or Selection Screen */}
                    {randomResult ? (
                      /* Result Display */
                      <div className="text-center">
                        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30">
                          <div className="text-xs uppercase tracking-wider text-purple-300 mb-3">Your Challenge</div>
                          <div className="flex items-center justify-center gap-3 mb-3">
                            {(() => {
                              const monster = MONSTERS.find(m => m.id === randomResult.monster)!;
                              return (
                                <>
                                  <monster.icon className={cn("w-8 h-8", monster.color)} />
                                  <span className="text-2xl font-display font-bold text-white">{monster.name}</span>
                                </>
                              );
                            })()}
                          </div>
                          <div className="text-muted-foreground text-lg">with</div>
                          <div className="text-xl font-bold text-purple-300 mt-2">
                            {WEAPONS.find(w => w.id === randomResult.weapon)?.name}
                          </div>
                          {(() => {
                            const existingHunt = hunts.find(
                              (h: HuntRecord) => h.monsterId === randomResult.monster && h.weaponId === randomResult.weapon
                            );
                            if (existingHunt) {
                              return (
                                <div className="mt-4 p-3 rounded bg-black/30 text-sm">
                                  <span className="text-muted-foreground">Current PB: </span>
                                  <span className="font-mono font-bold text-primary text-lg">{formatTime(existingHunt.timeSeconds)}</span>
                                </div>
                              );
                            }
                            return (
                              <div className="mt-4 p-3 rounded bg-black/30 text-sm text-muted-foreground">
                                No record yet - set a new PB!
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div className="flex flex-col gap-3 mt-6">
                          <Button 
                            onClick={() => {
                              setSelectedMonster(randomResult.monster);
                              setSelectedWeapon(randomResult.weapon);
                              setIsRandomOpen(false);
                              setIsAddOpen(true);
                            }} 
                            className="w-full bg-primary hover:bg-primary/90 text-background font-bold"
                          >
                            <Plus className="w-4 h-4 mr-2" /> Log Time
                          </Button>
                          <div className="flex gap-3">
                            <Button 
                              onClick={() => setRandomResult(null)} 
                              variant="outline"
                              className="flex-1 border-white/10 hover:bg-white/5"
                            >
                              Back
                            </Button>
                            <Button 
                              onClick={handleRandomChallenge} 
                              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold"
                            >
                              <Dices className="w-4 h-4 mr-2" /> Roll Again
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Selection Screen */
                      <>
                        {/* Monster Selection */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Monsters</Label>
                            <button
                              onClick={() => setSelectedRandomMonsters(
                                selectedRandomMonsters.length === MONSTERS.length ? [] : MONSTERS.map(m => m.id)
                              )}
                              className="text-xs text-purple-400 hover:text-purple-300"
                            >
                              {selectedRandomMonsters.length === MONSTERS.length ? "Deselect All" : "Select All"}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {MONSTERS.map(m => (
                              <button
                                key={m.id}
                                onClick={() => toggleRandomMonster(m.id)}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-lg border transition-all text-left",
                                  selectedRandomMonsters.includes(m.id)
                                    ? "bg-white/10 border-purple-500/50"
                                    : "bg-black/20 border-white/5 opacity-50"
                                )}
                              >
                                <m.icon className={cn("w-4 h-4", m.color)} />
                                <span className="text-sm">{m.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Weapon Selection */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Weapons</Label>
                            <button
                              onClick={() => setSelectedRandomWeapons(
                                selectedRandomWeapons.length === WEAPONS.length ? [] : WEAPONS.map(w => w.id)
                              )}
                              className="text-xs text-purple-400 hover:text-purple-300"
                            >
                              {selectedRandomWeapons.length === WEAPONS.length ? "Deselect All" : "Select All"}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                            {WEAPONS.map(w => (
                              <button
                                key={w.id}
                                onClick={() => toggleRandomWeapon(w.id)}
                                className={cn(
                                  "p-2 rounded-lg border transition-all text-left text-sm",
                                  selectedRandomWeapons.includes(w.id)
                                    ? "bg-white/10 border-purple-500/50"
                                    : "bg-black/20 border-white/5 opacity-50"
                                )}
                              >
                                {w.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Roll Button */}
                        <Button 
                          onClick={handleRandomChallenge} 
                          disabled={selectedRandomMonsters.length === 0 || selectedRandomWeapons.length === 0}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg py-6"
                        >
                          <Dices className="w-5 h-5 mr-2" /> Roll!
                        </Button>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" /> Best Times
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {MONSTERS.map((monster) => {
                const best = stats.bestTimePerMonster[monster.id];
                const weaponName = best ? WEAPONS.find(w => w.id === best.weaponId)?.name : null;
                const rank = best ? getRank(best.timeSeconds) : null;
                return (
                  <div key={monster.id} className="flex items-center justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <monster.icon className={cn("w-4 h-4", best ? monster.color : "text-muted-foreground/30")} />
                      {best ? (
                        <div className="flex flex-col leading-none">
                          <span className="font-mono text-slate-200">{formatTime(best.timeSeconds)}</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">{weaponName}</span>
                        </div>
                      ) : (
                        <span className="font-mono text-muted-foreground/40 italic text-xs">tbd</span>
                      )}
                    </div>
                    {rank && <RankIcon rank={rank} className="w-4 h-4" />}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-display text-lg text-white">Scoring Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 rounded bg-white/5">
                <span className="flex items-center gap-2"><Medal className="w-4 h-4 text-yellow-500" /> Sub 10:00</span>
                <span className="font-bold text-primary flex items-center gap-1">+3 <Diamond className="w-3 h-3" /></span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-white/5">
                <span className="flex items-center gap-2"><Medal className="w-4 h-4 text-slate-300" /> Sub 15:00</span>
                <span className="font-bold text-primary flex items-center gap-1">+2 <Diamond className="w-3 h-3" /></span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-white/5">
                <span className="flex items-center gap-2"><Medal className="w-4 h-4 text-amber-700" /> Sub 20:00</span>
                <span className="font-bold text-primary flex items-center gap-1">+1 <Diamond className="w-3 h-3" /></span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-white/5">
                <span className="flex items-center gap-2"><Skull className="w-4 h-4 text-gray-500" /> &gt; 20:00</span>
                <span className="font-bold text-destructive flex items-center gap-1">-1 <Diamond className="w-3 h-3" /></span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-accent/10 border border-accent/20">
                <span className="flex items-center gap-2 text-accent"><Star className="w-4 h-4" /> Personal Best</span>
                <span className="font-bold text-accent flex items-center gap-1">Bonus <Diamond className="w-3 h-3" /></span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Single Hunt Confirm Dialog */}
      <AlertDialog open={!!huntToDelete} onOpenChange={(open) => !open && setHuntToDelete(null)}>
        <AlertDialogContent className="bg-card border-white/10 text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this hunt?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {huntToDelete && (() => {
                const monster = MONSTERS.find(m => m.id === huntToDelete.monsterId);
                const weapon = WEAPONS.find(w => w.id === huntToDelete.weaponId);
                return `${monster?.name} · ${weapon?.name} · ${formatTime(huntToDelete.timeSeconds)}`;
              })()}
              <br />This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!huntToDelete) return;
                await fetch(`/api/hunts/${huntToDelete.id}`, { method: "DELETE" });
                queryClient.invalidateQueries({ queryKey: ["hunts"] });
                setHuntToDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Hunt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Section */}
      <div className="flex justify-center gap-4 pt-8 pb-4 border-t border-white/5 flex-wrap">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <RotateCcw className="w-4 h-4 mr-2" /> Reset All Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-white/10 text-slate-200">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action cannot be undone. This will permanently delete your hunting logs and reset the dashboard to its default state.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <Trash2 className="w-4 h-4 mr-2" /> Reset Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <User className="w-4 h-4 mr-2" /> Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-white/10 text-slate-200">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will permanently delete your account and all your hunt records. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await fetch("/api/me", { method: "DELETE" });
                  localStorage.removeItem("mhw-login-username");
                  localStorage.removeItem("mhw-login-hunter-id");
                  setLocation("/auth");
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Build image modal */}
      {dashBuildModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setDashBuildModal(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={dashBuildModal} alt="Build screenshot" className="w-full rounded-xl border border-white/10 shadow-2xl" />
            <button onClick={() => setDashBuildModal(null)}
              className="absolute top-3 right-3 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 text-lg">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
