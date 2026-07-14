import { Skull, Medal, Star, Diamond, Zap, Flame, Snowflake, Circle, Sparkles, Waves, Bomb, Dumbbell } from "lucide-react";

export type Rank = "gold" | "silver" | "bronze" | "skull";

export interface Monster {
  id: string;
  name: string;
  icon: any;
  color: string;
}

export interface Weapon {
  id: string;
  name: string;
  sprite: string;
}

export interface HuntRecord {
  id: string;
  monsterId: string;
  weaponId: string;
  timeSeconds: number;
  isPb: boolean;
  date: Date;
  attempts?: number;
  videoUrl?: string | null;
}

export const MONSTERS: Monster[] = [
  { id: "fatalis",    name: "Fatalis",               icon: Flame,     color: "text-red-500" },
  { id: "velkhana",  name: "Arch Tempered Velkhana", icon: Snowflake, color: "text-blue-300" },
  { id: "alatreon",  name: "Alatreon",               icon: Zap,       color: "text-yellow-400" },
  { id: "kulve",     name: "Kulve Taroth",           icon: Diamond,   color: "text-cyan-400" },
  { id: "teostra",   name: "Tempered Teostra",       icon: Star,      color: "text-orange-400" },
  { id: "nergigante",name: "Tempered Nergigante",    icon: Circle,    color: "text-gray-400" },
  { id: "safi",      name: "Safi'jiiva",             icon: Sparkles,  color: "text-rose-400" },
  { id: "brachydios",name: "Raging Brachydios",      icon: Bomb,      color: "text-lime-400" },
  { id: "rajang",    name: "Furious Rajang",         icon: Dumbbell,  color: "text-yellow-600" },
  { id: "namielle",  name: "Arch Tempered Namielle", icon: Waves,     color: "text-violet-400" },
];

export const WEAPONS: Weapon[] = [
  { id: "gs",     name: "Great Sword",      sprite: "/weapons/gs.png" },
  { id: "ls",     name: "Long Sword",        sprite: "/weapons/ls.png" },
  { id: "sns",    name: "Sword and Shield",  sprite: "/weapons/sns.png" },
  { id: "db",     name: "Dual Blades",       sprite: "/weapons/db.png" },
  { id: "hammer", name: "Hammer",            sprite: "/weapons/hammer.png" },
  { id: "hh",     name: "Hunting Horn",      sprite: "/weapons/hh.png" },
  { id: "lance",  name: "Lance",             sprite: "/weapons/lance.png" },
  { id: "gl",     name: "Gunlance",          sprite: "/weapons/gl.png" },
  { id: "sa",     name: "Switch Axe",        sprite: "/weapons/sa.png" },
  { id: "cb",     name: "Charge Blade",      sprite: "/weapons/cb.png" },
  { id: "ig",     name: "Insect Glaive",     sprite: "/weapons/ig.png" },
  { id: "lbg",    name: "Light Bowgun",      sprite: "/weapons/lbg.png" },
  { id: "hbg",    name: "Heavy Bowgun",      sprite: "/weapons/hbg.png" },
  { id: "bow",    name: "Bow",               sprite: "/weapons/bow.png" },
];

export function getRank(timeSeconds: number): Rank {
  if (timeSeconds < 10 * 60) return "gold";
  if (timeSeconds < 15 * 60) return "silver";
  if (timeSeconds < 20 * 60) return "bronze";
  return "skull";
}

export function getPoints(rank: Rank, isPb: boolean): number {
  let points = 0;
  switch (rank) {
    case "gold": points = 3; break;
    case "silver": points = 2; break;
    case "bronze": points = 1; break;
    case "skull": points = -3; break;
  }
  if (isPb) points += 5;
  return points;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function parseTime(timeStr: string): number {
  const [m, s] = timeStr.split(':').map(Number);
  return (m * 60) + (s || 0);
}

export const INITIAL_HUNTS: HuntRecord[] = [];
