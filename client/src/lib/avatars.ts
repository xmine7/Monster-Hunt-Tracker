export type AvatarId = "default" | "fatalis" | "velkhana" | "alatreon" | "kulve" | "nergigante";

export const AVATARS: { id: AvatarId; label: string; bg: string; border: string; emoji: string }[] = [
  { id: "default",    label: "Hunter",    bg: "bg-primary/20",      border: "border-primary/40",    emoji: "🗡️" },
  { id: "fatalis",    label: "Fatalis",   bg: "bg-red-900/40",      border: "border-red-500/40",    emoji: "🔥" },
  { id: "velkhana",   label: "Velkhana",  bg: "bg-blue-900/40",     border: "border-blue-300/40",   emoji: "❄️" },
  { id: "alatreon",   label: "Alatreon",  bg: "bg-yellow-900/40",   border: "border-yellow-400/40", emoji: "⚡" },
  { id: "kulve",      label: "Kulve",     bg: "bg-cyan-900/40",     border: "border-cyan-400/40",   emoji: "💎" },
  { id: "nergigante", label: "Nergigante",bg: "bg-slate-800/60",    border: "border-slate-400/40",  emoji: "⚫" },
];

export function getAvatar(id: string | null | undefined) {
  return AVATARS.find(a => a.id === id) ?? AVATARS[0];
}
