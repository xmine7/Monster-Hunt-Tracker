import { Skull, Medal, Star, Diamond, Zap, Flame, Snowflake, Circle } from "lucide-react";

export type Rank = "gold" | "silver" | "bronze" | "skull";

// Sprite sheet: 2560×1440px, 10 cols × 8 rows, each cell 256×180px
// Grid positions (col, row) are best-guess from MHW compendium order — let me know if any look off
const CELL_W = 256;
const CELL_H = 180;

export interface MonsterSprite {
  col: number;
  row: number;
}

export interface Monster {
  id: string;
  name: string;
  icon: any; // Lucide icon or string (fallback)
  color: string;
  sprite: MonsterSprite;
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
  { id: "fatalis",    name: "Fatalis",               icon: Flame,     color: "text-red-500",    sprite: { col: 0, row: 7 } },
  { id: "velkhana",  name: "Arch Tempered Velkhana", icon: Snowflake, color: "text-blue-300",   sprite: { col: 4, row: 4 } },
  { id: "alatreon",  name: "Alatreon",               icon: Zap,       color: "text-yellow-400", sprite: { col: 5, row: 6 } },
  { id: "kulve",     name: "Kulve Taroth",           icon: Diamond,   color: "text-cyan-400",   sprite: { col: 8, row: 3 } },
  { id: "nergigante",name: "Tempered Nergigante",    icon: Circle,    color: "text-gray-400",   sprite: { col: 4, row: 3 } },
];

export function getSpriteStyle(sprite: MonsterSprite, displaySize: number) {
  const scale = displaySize / CELL_W;
  return {
    backgroundImage: "url('/monsters-sprite.png')",
    backgroundSize: `${2560 * scale}px ${1440 * scale}px`,
    backgroundPosition: `-${sprite.col * CELL_W * scale}px -${sprite.row * CELL_H * scale}px`,
    backgroundRepeat: "no-repeat",
    width: `${displaySize}px`,
    height: `${Math.round(CELL_H * scale)}px`,
  };
}

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
