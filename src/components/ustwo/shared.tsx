import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, type PanInfo } from "framer-motion";
import { Lock, Pencil, Trash2, X, CalendarDays } from "lucide-react";
import { PEOPLE, money, iconOf, ICONS, useUsTwo, type Txn } from "@/lib/ustwo";
import { useResolvedPhoto } from "@/lib/photoStorage";
import { cn } from "@/lib/utils";

export function Avatar({
  who,
  size = "md",
  className,
}: {
  who?: "me" | "her" | string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const { people } = useUsTwo();
  const [imgError, setImgError] = useState(false);

  // Safe fallback: handles legacy or unknown payer strings without throwing
  const safeWho: "me" | "her" = who === "her" ? "her" : "me";
  const p = (who && (people as any)?.[who]) ?? people?.[safeWho] ?? PEOPLE[safeWho];

  const hasCustomUrl = Boolean(p?.avatarType === "custom" && p?.avatarUrl && !imgError);
  const fallbackEmoji = p?.emoji || (safeWho === "her" ? "🐰" : "🐻");
  const fallbackInitial = p?.zh?.[0] || p?.name?.[0] || (safeWho === "her" ? "蓉" : "宗");

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden border border-white/80 dark:border-white/20 shadow-[var(--shadow-soft)] select-none",
        size === "xs" && "h-5 w-5 text-[10px]",
        size === "sm" && "h-7 w-7 text-xs",
        size === "md" && "h-10 w-10 text-lg",
        size === "lg" && "h-14 w-14 text-2xl",
        size === "xl" && "h-20 w-20 text-4xl",
        className,
      )}
      style={{ backgroundColor: `color-mix(in oklch, ${p?.color || "var(--caramel)"} 22%, white)` }}
    >
      {hasCustomUrl ? (
        <img
          src={p.avatarUrl}
          alt={p?.zh || safeWho}
          className="h-full w-full object-cover aspect-square"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : fallbackEmoji ? (
        <span>{fallbackEmoji}</span>
      ) : (
        <span className="font-black text-foreground">{fallbackInitial}</span>
      )}
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
  const resolvedSrc = useResolvedPhoto(src);
  if (!src) return null;
  return (
    <button
      onClick={onClose}
      className="fixed inset-0 z-[85] flex items-center justify-center bg-foreground/50 p-8 backdrop-blur-md"
      aria-label="Close photo"
    >
      <span className="polaroid pop-in block max-w-sm rotate-[-1.5deg] rounded-2xl p-3">
        <img src={resolvedSrc || src} alt="Memory" className="w-full rounded-xl object-cover" />
        <span className="mt-2 block text-center text-sm font-semibold text-muted-foreground">我們的小回憶 ✨</span>
      </span>
    </button>
  );
}

/** Confirm-delete overlay shown inline inside TxnCard with z-30 elevation */
function DeleteConfirm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.16 }}
      className="absolute inset-0 z-30 flex items-center justify-between rounded-3xl bg-card border-2 border-destructive/25 shadow-lg px-4"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
          <Trash2 className="h-5 w-5" />
        </span>
        <p className="text-sm font-bold text-foreground">確定刪除這筆花費？</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
          className="bouncy flex min-h-[44px] items-center justify-center rounded-2xl bg-destructive px-4 py-2 text-xs font-black text-destructive-foreground shadow-xs active:scale-95"
        >
          刪除
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="bouncy flex min-h-[44px] items-center justify-center rounded-2xl neu px-4 py-2 text-xs font-bold text-foreground active:scale-95"
        >
          取消
        </button>
      </div>
    </motion.div>
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
  const { people, getCat, resolveCat, deleteTxn } = useUsTwo();
  const resolved = resolveCat(t.category, t.subCategory);
  const cat = getCat(t.category);
  const Icon = (resolved.sub?.icon && ICONS[resolved.sub.icon]) || iconOf(cat);
  const displayCatLabel = resolved.sub
    ? `${resolved.group.zh} · ${resolved.sub.zh}`
    : cat.zh;
  const tilt = index % 2 === 0 ? "rotate-1" : "-rotate-1";
  const [confirming, setConfirming] = useState(false);
  const resolvedPhoto = useResolvedPhoto(t.photo);

  // Framer Motion 左右滑動位移監聽與閾值動態映射
  const x = useMotionValue(0);

  // 底層背景僅在有實際拖曳時顯現，平時靜止時徹底透明 (opacity 0) 杜絕任何顏色或文字滲漏
  const bgOpacity = useTransform(x, [-60, -15, 0, 15, 60], [1, 0, 0, 0, 1]);

  // 右滑露出編輯：x <= 15 時透明度嚴格維持 0（向左滑動的所有負值均為 0，絕不會留在項目下面！）
  const editOpacity = useTransform(x, [-10, 0, 15, 75], [0, 0, 0, 1]);
  const editScale = useTransform(x, [-10, 0, 15, 75], [0.8, 0.8, 0.85, 1.05]);

  // 左滑露出刪除：x >= -15 時透明度嚴格維持 0（向右滑動的所有正值均為 0，絕不會留在項目下面！）
  const deleteOpacity = useTransform(x, [10, 0, -15, -75], [0, 0, 0, 1]);
  const deleteScale = useTransform(x, [10, 0, -15, -75], [0.8, 0.8, 0.85, 1.05]);

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
      {/* 底層動作露出背景層 (Revealed Actions Layer) - 平時完全隱藏 (bgOpacity: 0)，僅在拖曳時顯現 */}
      <motion.div
        style={{ opacity: bgOpacity }}
        className="pointer-events-none absolute inset-0 flex items-center justify-between px-4 rounded-3xl bg-muted/70"
      >
        {/* 右滑露出：編輯動作 (Caramel 溫暖色調) - 左滑時此處 opacity 嚴格為 0 */}
        <motion.div
          style={{ opacity: editOpacity, scale: editScale }}
          className="flex items-center gap-1.5 text-[var(--caramel)] font-black text-xs"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--caramel)] text-white shadow-xs">
            <Pencil className="h-4.5 w-4.5 stroke-[2.5]" />
          </div>
          <span>編輯花費</span>
        </motion.div>

        {/* 左滑露出：刪除動作 (Destructive 紅色調) - 右滑時此處 opacity 嚴格為 0 */}
        <motion.div
          style={{ opacity: deleteOpacity, scale: deleteScale }}
          className="flex items-center gap-1.5 text-destructive font-black text-xs ml-auto"
        >
          <span>滑動刪除</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive text-destructive-foreground shadow-xs">
            <Trash2 className="h-4.5 w-4.5 stroke-[2.5]" />
          </div>
        </motion.div>
      </motion.div>

      {/* 上層卡片本體：支援 X 軸手勢拖曳，垂直滾動鎖定；點擊直接開啟編輯；實心卡片表面杜絕透底 */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -110, right: 110 }}
        dragElastic={0.25}
        onDragEnd={handleDragEnd}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 450, damping: 32 }}
        style={{ x, touchAction: "pan-y" }}
        onTap={() => {
          if (!confirming && onEdit) {
            onEdit(t);
          }
        }}
        className="pop-in relative z-10 flex items-center gap-3 rounded-3xl p-3 bg-card border border-white/60 dark:border-white/10 cursor-pointer active:scale-[0.99] transition-transform"
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/60 shadow-xs"
          style={{ backgroundColor: `color-mix(in oklch, ${resolved.group.tint} 24%, white)` }}
        >
          <Icon className="h-5 w-5" style={{ color: `color-mix(in oklch, ${resolved.group.tint} 80%, black)` }} />
        </span>

        {/* 筆記與明細文字區 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="truncate text-[15px] font-bold text-foreground">{t.note || displayCatLabel}</p>
            {t.isPrivate ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                <Lock className="h-2.5 w-2.5" /> 個人
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                共同
              </span>
            )}
            {t.subscriptionId && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                <CalendarDays className="h-2.5 w-2.5" /> 固定
              </span>
            )}
            {t.forPartnerAmount && t.forPartnerAmount > 0 ? (
              <span className="inline-flex shrink-0 items-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                含幫出 NT${t.forPartnerAmount}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap truncate">
            <Avatar who={t.payer} size="xs" />
            <span className="font-semibold text-foreground/85">
              {((t.payer && (people as any)?.[t.payer]) || people?.[t.payer === "her" ? "her" : "me"] || PEOPLE.me)?.zh || t.payer || "我"}付的
            </span>
            <span className="opacity-40">·</span>
            <span>{displayCatLabel}</span>
          </p>
        </div>

        {/* 拍立得照片縮圖 */}
        {t.photo && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPhoto?.(t.photo!);
            }}
            className={cn("polaroid bouncy shrink-0 rounded-2xl p-1 hover:rotate-0", tilt)}
          >
            <img
              src={resolvedPhoto || t.photo}
              alt={t.note}
              loading="lazy"
              className="h-11 w-11 rounded-xl object-cover"
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

      {/* 刪除確認彈窗 (內嵌提示：置頂於最上層 z-30，絕不被卡片或動作遮擋) */}
      <AnimatePresence>
        {confirming && (
          <DeleteConfirm
            onCancel={() => setConfirming(false)}
            onConfirm={() => {
              deleteTxn(t.id);
              setConfirming(false);
            }}
          />
        )}
      </AnimatePresence>
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
