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
  attempts?: number;
  videoUrl?: string | null;
}

export const MONSTERS: Monster[] = [
  { id: "fatalis", name: "Fatalis", icon: Flame, color: "text-red-500" },
  { id: "velkhana", name: "Arch Tempered Velkhana", icon: Snowflake, color: "text-blue-300" },
  { id: "alatreon", name: "Alatreon", icon: Zap, color: "text-yellow-400" },
  { id: "kulve", name: "Kulve Taroth", icon: Diamond, color: "text-cyan-400" },
  { id: "nergigante", name: "Tempered Nergigante", icon: Circle, color: "text-gray-400" },
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
export const INITIAL_HUNTS: HuntRecord[] = [];
