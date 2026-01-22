import { useMemo, useState, useEffect } from "react";
import { 
  MONSTERS, WEAPONS, INITIAL_HUNTS, 
  getRank, getPoints, formatTime, parseTime, 
  type HuntRecord, type Rank 
} from "@/lib/mh-data";
import { 
  Skull, Medal, Star, Diamond, 
  Plus, Trophy, History, Swords,
  TrendingUp, TrendingDown, RotateCcw, Trash2
} from "lucide-react";
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

export default function Dashboard() {
  // Load from local storage or use initial
  const [hunts, setHunts] = useState<HuntRecord[]>(() => {
    const saved = localStorage.getItem("mhw-hunts");
    if (saved) {
      try {
        // Parse dates back to Date objects
        return JSON.parse(saved, (key, value) => 
          key === 'date' ? new Date(value) : value
        );
      } catch (e) {
        console.error("Failed to parse local storage", e);
        return INITIAL_HUNTS;
      }
    }
    return INITIAL_HUNTS;
  });

  // Save to local storage whenever hunts change
  useEffect(() => {
    localStorage.setItem("mhw-hunts", JSON.stringify(hunts));
  }, [hunts]);

  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [selectedMonster, setSelectedMonster] = useState(MONSTERS[0].id);
  const [selectedWeapon, setSelectedWeapon] = useState(WEAPONS[0].id);
  const [timeInput, setTimeInput] = useState("");

  const stats = useMemo(() => {
    const weaponStats: Record<string, { points: number, hunts: number, gold: number, silver: number, bronze: number, skull: number, star: number, lastHuntDate: number }> = {};
    let totalPoints = 0;
    
    // Initialize
    WEAPONS.forEach(w => {
      weaponStats[w.id] = { points: 0, hunts: 0, gold: 0, silver: 0, bronze: 0, skull: 0, star: 0, lastHuntDate: 0 };
    });

    // Calculate Best Time per Monster (across ALL weapons)
    const bestTimePerMonster: Record<string, number> = {};
    hunts.forEach(hunt => {
      if (!bestTimePerMonster[hunt.monsterId] || hunt.timeSeconds < bestTimePerMonster[hunt.monsterId]) {
        bestTimePerMonster[hunt.monsterId] = hunt.timeSeconds;
      }
    });

    hunts.forEach(hunt => {
      const rank = getRank(hunt.timeSeconds);
      // It is a Global Best Time if it matches the best time for this monster
      const isGlobalBest = bestTimePerMonster[hunt.monsterId] === hunt.timeSeconds;
      
      const points = getPoints(rank, isGlobalBest);
      const ws = weaponStats[hunt.weaponId];
      
      if (ws) {
        ws.points += points;
        ws.hunts += 1;
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
      // Default Sort: Active weapons by Last Updated (desc), then Inactive weapons by base game order
      .sort((a, b) => {
        // First check: Are they active?
        const aActive = a.hunts > 0;
        const bActive = b.hunts > 0;

        // If both have hunts, sort by Last Hunt Date (Newest first)
        if (aActive && bActive) {
           return b.lastHuntDate - a.lastHuntDate;
        }

        // If one is active and the other is not, active comes first
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;

        // If neither have hunts (or we want to preserve base order for inactive ones)
        // Sort by their index in the WEAPONS array (Base Game Order)
        const aIndex = WEAPONS.findIndex(w => w.id === a.id);
        const bIndex = WEAPONS.findIndex(w => w.id === b.id);
        return aIndex - bIndex;
      });

    // Get Best and Worst (only considering weapons with > 0 hunts)
    const activeWeapons = sortedWeapons.filter(w => w.hunts > 0);
    const bestWeapon = activeWeapons.length > 0 ? activeWeapons[0] : null;
    const worstWeapon = activeWeapons.length > 0 ? activeWeapons[activeWeapons.length - 1] : null;

    return { totalPoints, weaponStats: sortedWeapons, totalHunts: hunts.length, bestWeapon, worstWeapon, bestTimePerMonster };
  }, [hunts]);

  const handleAddHunt = () => {
    const time = parseTime(timeInput);
    if (!time) return;

    // Check if a record already exists for this monster/weapon
    const existingHuntIndex = hunts.findIndex(
      h => h.monsterId === selectedMonster && h.weaponId === selectedWeapon
    );

    const newHunt: HuntRecord = {
      id: existingHuntIndex !== -1 ? hunts[existingHuntIndex].id : Math.random().toString(),
      monsterId: selectedMonster,
      weaponId: selectedWeapon,
      timeSeconds: time,
      isPb: true, // If it's the only entry, it's the PB
      date: new Date()
    };

    setHunts(prev => {
      const newHunts = [...prev];
      if (existingHuntIndex !== -1) {
        // Update existing
        newHunts[existingHuntIndex] = newHunt;
      } else {
        // Add new
        newHunts.unshift(newHunt);
      }
      return newHunts;
    });

    setIsAddOpen(false);
    setTimeInput("");
  };

  const handleReset = () => {
    setHunts(INITIAL_HUNTS);
    localStorage.removeItem("mhw-hunts");
  };

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 font-sans text-slate-200">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/50 backdrop-blur-md p-6 rounded-xl border border-white/5">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-wide uppercase">
            Hunter's <span className="text-primary">Log</span>
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4" /> 
            World Solo Speedrun Tracker
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-sm text-muted-foreground uppercase tracking-wider">Total Score</div>
            <div className="text-3xl font-display font-bold text-primary flex items-center justify-end gap-2">
              {stats.totalPoints} <Diamond className="w-6 h-6 fill-primary/20" />
            </div>
          </div>
          <div className="text-right border-l border-white/10 pl-6">
            <div className="text-sm text-muted-foreground uppercase tracking-wider">Total Hunts</div>
            <div className="text-3xl font-display font-bold text-white">
              {stats.totalHunts}
            </div>
          </div>
        </div>
      </header>

      {/* Stats Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.bestWeapon && (
          <Card className="bg-gradient-to-br from-card/60 to-primary/10 border-primary/20">
             <CardContent className="flex items-center justify-between p-6">
               <div>
                 <div className="text-sm text-primary uppercase font-bold tracking-wider mb-1">Best Performing Weapon</div>
                 <div className="text-2xl font-display font-bold text-white">
                   {WEAPONS.find(w => w.id === stats.bestWeapon?.id)?.name}
                 </div>
               </div>
               <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                 <TrendingUp className="w-6 h-6 text-primary" />
               </div>
             </CardContent>
          </Card>
        )}
        {stats.worstWeapon && stats.worstWeapon.id !== stats.bestWeapon?.id && (
          <Card className="bg-gradient-to-br from-card/60 to-destructive/10 border-destructive/20">
             <CardContent className="flex items-center justify-between p-6">
               <div>
                 <div className="text-sm text-destructive uppercase font-bold tracking-wider mb-1">Needs Improvement</div>
                 <div className="text-2xl font-display font-bold text-white">
                   {WEAPONS.find(w => w.id === stats.worstWeapon?.id)?.name}
                 </div>
               </div>
               <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
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
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <Swords className="w-6 h-6 text-primary" /> Weapon Performance
            </h2>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-background hover:bg-primary/90 font-display font-bold tracking-wider">
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
                      onChange={(e) => setTimeInput(e.target.value)}
                      className="bg-background/50 border-white/10 font-mono"
                    />
                  </div>
                  <Button onClick={handleAddHunt} className="w-full bg-primary text-background font-bold">
                    Add Entry
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                        {weapon.hunts > 0 && (
                          <Badge variant="outline" className="ml-2 bg-white/5 border-white/10 text-xs">
                            {weapon.hunts} Hunts
                          </Badge>
                        )}
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
                    <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1"><Medal className="w-4 h-4 text-yellow-500" /> {weapon.gold}</div>
                      <div className="flex items-center gap-1"><Medal className="w-4 h-4 text-slate-300" /> {weapon.silver}</div>
                      <div className="flex items-center gap-1"><Medal className="w-4 h-4 text-amber-700" /> {weapon.bronze}</div>
                      <div className="flex items-center gap-1"><Skull className="w-4 h-4 text-gray-500" /> {weapon.skull}</div>
                      <div className="flex items-center gap-1"><Star className="w-4 h-4 text-accent fill-accent/20" /> {weapon.star}</div>
                    </div>
                    
                    {/* Personal Bests List for this weapon */}
                    <div className="space-y-1 mt-2 border-t border-white/5 pt-2 min-h-[20px]">
                      {hunts.filter(h => h.weaponId === weapon.id && h.isPb).length > 0 ? (
                        hunts
                          .filter(h => h.weaponId === weapon.id && h.isPb)
                          .map(hunt => {
                            const monster = MONSTERS.find(m => m.id === hunt.monsterId)!;
                            const rank = getRank(hunt.timeSeconds);
                            return (
                              <div key={hunt.id} className="flex items-center justify-between text-sm py-1">
                                <div className="flex items-center gap-2 text-slate-300">
                                  <monster.icon className={cn("w-4 h-4", monster.color)} />
                                  <span className="text-xs uppercase tracking-wide opacity-70">PB</span>
                                  <span className="font-mono">{formatTime(hunt.timeSeconds)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <RankIcon rank={rank} className="w-4 h-4" />
                                  {/* Only show star if it is the Global Best for this monster */}
                                  {stats.bestTimePerMonster[hunt.monsterId] === hunt.timeSeconds && (
                                    <Star className="w-3 h-3 text-accent fill-accent" />
                                  )}
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <div className="text-xs text-muted-foreground py-1 italic">No records yet</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Reference & Recent */}
        <div className="space-y-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-primary" /> Recent Logs
          </h2>
          
          <ScrollArea className="h-[400px] rounded-xl border border-white/5 bg-card/30 p-4">
            <div className="space-y-3">
              {hunts.slice(0, 10).map((hunt) => {
                 const monster = MONSTERS.find(m => m.id === hunt.monsterId)!;
                 const weapon = WEAPONS.find(w => w.id === hunt.weaponId)!;
                 const rank = getRank(hunt.timeSeconds);
                 
                 return (
                   <div key={hunt.id} className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                     <div className="flex items-center gap-3">
                       <div className={cn("p-2 rounded-md bg-white/5", monster.color)}>
                         <monster.icon className="w-5 h-5" />
                       </div>
                       <div>
                         <div className="text-sm font-bold text-slate-200">{monster.name}</div>
                         <div className="text-xs text-muted-foreground">{weapon.name}</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="font-mono font-bold text-primary">{formatTime(hunt.timeSeconds)}</div>
                       <div className="flex justify-end items-center gap-1 mt-1">
                         <RankIcon rank={rank} className="w-3 h-3" />
                         {hunt.isPb && <Star className="w-3 h-3 text-accent" />}
                       </div>
                     </div>
                   </div>
                 );
              })}
            </div>
          </ScrollArea>

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

      {/* Reset Section */}
      <div className="flex justify-center pt-8 pb-4 border-t border-white/5">
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
      </div>
    </div>
  );
}
