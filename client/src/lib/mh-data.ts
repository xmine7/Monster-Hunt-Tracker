import { LucideIcon, Skull, Medal, Star, Diamond, Zap, Flame, Snowflake, Circle } from "lucide-react";

export type Rank = "gold" | "silver" | "bronze" | "skull";

export interface Monster {
  id: string;
  name: string;
  icon: any; // Lucide icon or string
  color: string;
}

export interface Weapon {
  id: string;
  name: string;
}

export interface HuntRecord {
  id: string;
  monsterId: string;
  weaponId: string;
  timeSeconds: number; // Stored in seconds for easy calc
  isPb: boolean;
  date: Date;
}

export const MONSTERS: Monster[] = [
  { id: "nergigante", name: "Tempered Nergigante", icon: Circle, color: "text-gray-400" },
  { id: "kulve", name: "Kulve Taroth", icon: Diamond, color: "text-cyan-400" },
  { id: "alatreon", name: "Alatreon", icon: Zap, color: "text-yellow-400" },
  { id: "velkhana", name: "Arch Tempered Velkhana", icon: Snowflake, color: "text-blue-300" },
  { id: "fatalis", name: "Fatalis", icon: Flame, color: "text-red-500" },
];

export const WEAPONS: Weapon[] = [
  { id: "gs", name: "Great Sword" },
  { id: "ls", name: "Long Sword" },
  { id: "sns", name: "Sword and Shield" },
  { id: "db", name: "Dual Blades" },
  { id: "hammer", name: "Hammer" },
  { id: "hh", name: "Hunting Horn" },
  { id: "lance", name: "Lance" },
  { id: "gl", name: "Gunlance" },
  { id: "sa", name: "Switch Axe" },
  { id: "cb", name: "Charge Blade" },
  { id: "ig", name: "Insect Glaive" },
  { id: "lbg", name: "Light Bowgun" },
  { id: "hbg", name: "Heavy Bowgun" },
  { id: "bow", name: "Bow" },
];

export function getRank(timeSeconds: number): Rank {
  if (timeSeconds < 10 * 60) return "gold";
  if (timeSeconds < 15 * 60) return "silver";
  if (timeSeconds < 20 * 60) return "bronze";
  return "skull"; // Sub 30 or worse (assuming >20 is skull based on screenshot "sub 30 skull")
}

export function getPoints(rank: Rank, isPb: boolean): number {
  let points = 0;
  switch (rank) {
    case "gold": points = 3; break;
    case "silver": points = 2; break;
    case "bronze": points = 1; break;
    case "skull": points = -1; break;
  }
  if (isPb) points += 1;
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

// Initial Mock Data to match screenshot
export const INITIAL_HUNTS: HuntRecord[] = [
  // Bow Data
  { id: "1", monsterId: "nergigante", weaponId: "bow", timeSeconds: 528, isPb: true, date: new Date() }, // 8:48 Gold + PB
  { id: "2", monsterId: "kulve", weaponId: "bow", timeSeconds: 984, isPb: true, date: new Date() }, // 16:24 Bronze + PB (Wait, 16:24 is sub 20, so Bronze. But PB gives +1. Screenshot shows bronze medal next to it)
  // Let's adjust logic based on screenshot observation:
  // "pb 16:24 Bronze" -> Bronze is sub 20.
  // "pb 14:24 Silver Star" -> Silver is sub 15. 14:24 is sub 15. Correct.
  // "pb 17:30 Bronze" -> Sub 20. Correct.
  
  // Adding more to populate
  { id: "3", monsterId: "alatreon", weaponId: "bow", timeSeconds: 864, isPb: true, date: new Date() }, // 14:24
  { id: "4", monsterId: "velkhana", weaponId: "bow", timeSeconds: 913, isPb: true, date: new Date() }, // 15:13
  { id: "5", monsterId: "fatalis", weaponId: "bow", timeSeconds: 1050, isPb: true, date: new Date() }, // 17:30

  // HH Data
  { id: "6", monsterId: "nergigante", weaponId: "hh", timeSeconds: 533, isPb: true, date: new Date() }, // 8:53
  { id: "7", monsterId: "kulve", weaponId: "hh", timeSeconds: 963, isPb: true, date: new Date() }, // 16:03
  { id: "8", monsterId: "alatreon", weaponId: "hh", timeSeconds: 1354, isPb: true, date: new Date() }, // 22:34 (Skull)
];
