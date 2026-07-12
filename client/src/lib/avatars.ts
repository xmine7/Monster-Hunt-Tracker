export type AvatarId =
  | "default" | "fatalis" | "velkhana" | "alatreon" | "kulve" | "nergigante"
  | "gs" | "ls" | "sns" | "db" | "hammer" | "hh" | "lance" | "gl" | "sa" | "cb" | "ig" | "lbg" | "hbg" | "bow";

export const AVATARS: { id: AvatarId; label: string; bg: string; border: string; emoji: string; sprite?: string }[] = [
  { id: "default",    label: "Hunter",      bg: "bg-primary/20",      border: "border-primary/40",    emoji: "🗡️" },
  { id: "fatalis",    label: "Fatalis",     bg: "bg-red-900/40",      border: "border-red-500/40",    emoji: "🔥" },
  { id: "velkhana",   label: "Velkhana",    bg: "bg-blue-900/40",     border: "border-blue-300/40",   emoji: "❄️" },
  { id: "alatreon",   label: "Alatreon",    bg: "bg-yellow-900/40",   border: "border-yellow-400/40", emoji: "⚡" },
  { id: "kulve",      label: "Kulve",       bg: "bg-cyan-900/40",     border: "border-cyan-400/40",   emoji: "💎" },
  { id: "nergigante", label: "Nergigante",  bg: "bg-slate-800/60",    border: "border-slate-400/40",  emoji: "⚫" },
  { id: "gs",    label: "Great Sword",    bg: "bg-red-900/30",     border: "border-red-600/40",    emoji: "", sprite: "/weapons/gs.png" },
  { id: "ls",    label: "Long Sword",     bg: "bg-blue-900/30",    border: "border-blue-400/40",   emoji: "", sprite: "/weapons/ls.png" },
  { id: "sns",   label: "Sword & Shield", bg: "bg-green-900/30",   border: "border-green-400/40",  emoji: "", sprite: "/weapons/sns.png" },
  { id: "db",    label: "Dual Blades",    bg: "bg-purple-900/30",  border: "border-purple-400/40", emoji: "", sprite: "/weapons/db.png" },
  { id: "hammer",label: "Hammer",         bg: "bg-amber-900/30",   border: "border-amber-500/40",  emoji: "", sprite: "/weapons/hammer.png" },
  { id: "hh",    label: "Hunting Horn",   bg: "bg-amber-900/30",   border: "border-amber-400/40",  emoji: "", sprite: "/weapons/hh.png" },
  { id: "lance", label: "Lance",          bg: "bg-sky-900/30",     border: "border-sky-400/40",    emoji: "", sprite: "/weapons/lance.png" },
  { id: "gl",    label: "Gunlance",       bg: "bg-sky-900/30",     border: "border-sky-500/40",    emoji: "", sprite: "/weapons/gl.png" },
  { id: "sa",    label: "Switch Axe",     bg: "bg-violet-900/30",  border: "border-violet-400/40", emoji: "", sprite: "/weapons/sa.png" },
  { id: "cb",    label: "Charge Blade",   bg: "bg-violet-900/30",  border: "border-violet-500/40", emoji: "", sprite: "/weapons/cb.png" },
  { id: "ig",    label: "Insect Glaive",  bg: "bg-pink-900/30",    border: "border-pink-400/40",   emoji: "", sprite: "/weapons/ig.png" },
  { id: "lbg",   label: "Light Bowgun",   bg: "bg-emerald-900/30", border: "border-emerald-400/40",emoji: "", sprite: "/weapons/lbg.png" },
  { id: "hbg",   label: "Heavy Bowgun",   bg: "bg-emerald-900/30", border: "border-emerald-500/40",emoji: "", sprite: "/weapons/hbg.png" },
  { id: "bow",   label: "Bow",            bg: "bg-teal-900/30",    border: "border-teal-400/40",   emoji: "", sprite: "/weapons/bow.png" },
];

export function getAvatar(id: string | null | undefined) {
  return AVATARS.find(a => a.id === id) ?? AVATARS[0];
}
