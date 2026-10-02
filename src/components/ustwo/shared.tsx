import { useState } from "react";
import { Lock } from "lucide-react";
import { PEOPLE, money, iconOf, useUsTwo, type Txn } from "@/lib/ustwo";
import { cn } from "@/lib/utils";

export function Avatar({ who, size = "md" }: { who: "me" | "her"; size?: "sm" | "md" | "lg" }) {
  const p = PEOPLE[who];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-white/70 shadow-[var(--shadow-soft)]",
        size === "sm" && "h-7 w-7 text-sm",
        size === "md" && "h-10 w-10 text-lg",
        size === "lg" && "h-14 w-14 text-2xl",
      )}
      style={{ backgroundColor: `color-mix(in oklch, ${p.color} 22%, white)` }}
    >
      {p.emoji}
    </span>
  );
}

export function SectionTitle({ zh, en }: { zh: string; en: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-2 px-1">
      <h2 className="text-lg font-bold tracking-tight">{zh}</h2>
      <span className="text-xs font-medium text-muted-foreground">{en}</span>
    </div>
  );
}

export function Lightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null;
  return (
    <button
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/50 p-8 backdrop-blur-md"
      aria-label="Close photo"
    >
      <span className="polaroid pop-in block max-w-sm rotate-[-1.5deg] rounded-md">
        <img src={src} alt="Memory" className="w-full rounded-sm object-cover" />
        <span className="mt-2 block text-center text-sm text-muted-foreground">我們的小回憶 ✨</span>
      </span>
    </button>
  );
}

export function TxnCard({
  t,
  onPhoto,
  index = 0,
}: {
  t: Txn;
  onPhoto?: (src: string) => void;
  index?: number;
}) {
  const cat = useUsTwo().getCat(t.category);
  const Icon = iconOf(cat);
  const tilt = index % 2 === 0 ? "rotate-1" : "-rotate-1";

  return (
    <div className="glass pop-in flex items-center gap-3 rounded-3xl p-3">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/60"
        style={{ backgroundColor: `color-mix(in oklch, ${cat.tint} 24%, white)` }}
      >
        <Icon className="h-5 w-5" style={{ color: `color-mix(in oklch, ${cat.tint} 80%, black)` }} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[15px] font-semibold">{t.note || cat.zh}</p>
          {t.isPrivate && (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
              <Lock className="h-2.5 w-2.5" /> 私人
            </span>
          )}
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <span>{PEOPLE[t.payer].emoji}</span>
          {PEOPLE[t.payer].zh}付的 · {cat.zh}
        </p>
      </div>

      {t.photo && (
        <button
          onClick={() => onPhoto?.(t.photo!)}
          className={cn("polaroid bouncy shrink-0 rounded-md hover:rotate-0", tilt)}
        >
          <img
            src={t.photo}
            alt={t.note}
            loading="lazy"
            className="h-12 w-12 rounded-sm object-cover"
          />
        </button>
      )}

      <p
        className="shrink-0 text-right text-[15px] font-extrabold tabular-nums"
        style={{ color: t.kind === "income" ? "var(--cat-9)" : "var(--foreground)" }}
      >
        {t.kind === "income" ? "+" : "-"}
        {money(t.amount)}
      </p>
    </div>
  );
}

export function useLightbox() {
  const [photo, setPhoto] = useState<string | null>(null);
  return { photo, setPhoto, close: () => setPhoto(null) };
}

export function EmptyNote({ text }: { text: string }) {
  return (
    <div className="glass rounded-3xl px-6 py-10 text-center">
      <p className="text-3xl">🍞</p>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
