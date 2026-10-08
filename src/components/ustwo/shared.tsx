import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Lock, Pencil, Trash2, X } from "lucide-react";
import { PEOPLE, money, iconOf, useUsTwo, type Txn } from "@/lib/ustwo";
import { cn } from "@/lib/utils";

export function Avatar({ who, size = "md" }: { who: "me" | "her"; size?: "sm" | "md" | "lg" }) {
  const { people } = useUsTwo();
  const p = people[who];
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

/** Confirm-delete overlay shown inline inside TxnCard */
function DeleteConfirm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="pop-in absolute inset-0 z-10 flex items-center justify-center gap-3 rounded-3xl bg-[oklch(0.97_0.015_78/0.94)] dark:bg-[oklch(0.24_0.018_55/0.95)] backdrop-blur-md px-3">
      <p className="text-sm font-bold text-foreground">確定刪除這筆？</p>
      <button
        onClick={onConfirm}
        className="bouncy flex min-h-[44px] items-center justify-center rounded-2xl bg-destructive px-4 py-2 text-xs font-black text-destructive-foreground shadow-sm active:scale-95"
      >
        刪除
      </button>
      <button
        onClick={onCancel}
        className="bouncy flex min-h-[44px] items-center justify-center rounded-2xl neu px-4 py-2 text-xs font-bold active:scale-95"
      >
        取消
      </button>
    </div>
  );
}

export function TxnCard({
  t,
  onPhoto,
  onEdit,
  index = 0,
}: {
  t: Txn;
  onPhoto?: (src: string) => void;
  onEdit?: (t: Txn) => void;
  index?: number;
}) {
  const { people, getCat, deleteTxn } = useUsTwo();
  const cat = getCat(t.category);
  const Icon = iconOf(cat);
  const tilt = index % 2 === 0 ? "rotate-1" : "-rotate-1";
  const [confirming, setConfirming] = useState(false);

  // Framer Motion 左右滑動位移監聽與閾值動態映射
  const x = useMotionValue(0);
  const editOpacity = useTransform(x, [15, 75], [0.3, 1]);
  const editScale = useTransform(x, [15, 75], [0.85, 1.1]);
  const deleteOpacity = useTransform(x, [-15, -75], [0.3, 1]);
  const deleteScale = useTransform(x, [-15, -75], [0.85, 1.1]);

  const SWIPE_THRESHOLD = 75; // 滑動臨界閾值 (超過 75px 觸發編輯或刪除)

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD && onEdit) {
      onEdit(t);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      setConfirming(true);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl select-none shadow-[var(--shadow-soft)]">
      {/* 刪除確認彈窗 (內嵌提示) */}
      {confirming && (
        <DeleteConfirm
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            deleteTxn(t.id);
            setConfirming(false);
          }}
        />
      )}

      {/* 底層動作露出背景層 (Revealed Actions Layer) */}
      <div className="absolute inset-0 flex items-center justify-between px-4 rounded-3xl bg-muted/60">
        {/* 右滑露出：編輯動作 (Caramel 溫暖色調) */}
        <motion.div
          style={{ opacity: editOpacity, scale: editScale }}
          className="flex items-center gap-1.5 text-[var(--caramel)] font-black text-xs"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--caramel)] text-white shadow-xs">
            <Pencil className="h-4.5 w-4.5 stroke-[2.5]" />
          </div>
          <span>編輯花費</span>
        </motion.div>

        {/* 左滑露出：刪除動作 (Destructive 紅色調) */}
        <motion.div
          style={{ opacity: deleteOpacity, scale: deleteScale }}
          className="flex items-center gap-1.5 text-destructive font-black text-xs ml-auto"
        >
          <span>滑動刪除</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive text-destructive-foreground shadow-xs">
            <Trash2 className="h-4.5 w-4.5 stroke-[2.5]" />
          </div>
        </motion.div>
      </div>

      {/* 上層卡片本體：支援 X 軸手勢拖曳，垂直滾動鎖定 (touchAction: pan-y, dragDirectionLock) */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -110, right: 110 }}
        dragElastic={0.25}
        onDragEnd={handleDragEnd}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 450, damping: 32 }}
        style={{ x, touchAction: "pan-y" }}
        className="glass pop-in relative z-10 flex items-center gap-3 rounded-3xl p-3 bg-card/95 border border-white/60 dark:border-white/10"
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/60 shadow-xs"
          style={{ backgroundColor: `color-mix(in oklch, ${cat.tint} 24%, white)` }}
        >
          <Icon className="h-5 w-5" style={{ color: `color-mix(in oklch, ${cat.tint} 80%, black)` }} />
        </span>

        {/* 筆記與明細文字區 (解除按鈕佔位，獲得充裕橫向寬度，杜絕字體被擠壓為直排或折行) */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="truncate text-[15px] font-bold text-foreground">{t.note || cat.zh}</p>
            {t.isPrivate ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                <Lock className="h-2.5 w-2.5" /> 個人
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                共同
              </span>
            )}
            {t.forPartnerAmount && t.forPartnerAmount > 0 ? (
              <span className="inline-flex shrink-0 items-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                含幫出 NT${t.forPartnerAmount}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap truncate">
            <span>{people[t.payer].emoji}</span>
            <span>{people[t.payer].zh}付的 · {cat.zh}</span>
          </p>
        </div>

        {/* 拍立得照片縮圖 */}
        {t.photo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPhoto?.(t.photo!);
            }}
            className={cn("polaroid bouncy shrink-0 rounded-md hover:rotate-0", tilt)}
          >
            <img
              src={t.photo}
              alt={t.note}
              loading="lazy"
              className="h-11 w-11 rounded-sm object-cover"
            />
          </button>
        )}

        {/* 金額顯示 */}
        <p
          className="shrink-0 text-right text-[15px] font-extrabold tabular-nums pl-1"
          style={{ color: t.kind === "income" ? "var(--cat-9)" : "var(--foreground)" }}
        >
          {t.kind === "income" ? "+" : "-"}
          {money(t.amount)}
        </p>
      </motion.div>
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
