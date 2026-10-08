import React, { useMemo } from "react";
import { ArrowLeft, Sparkles, Star, Package, Store } from "lucide-react";
import { useFarmStore } from "@/store/useFarmStore";
import { cn } from "@/lib/utils";

export interface FarmHeaderProps {
  /** 返回或切換回記帳主畫面的回呼 */
  onBack?: (() => void) | undefined;
  /** 開啟倉庫面板回呼 */
  onOpenInventory?: (() => void) | undefined;
  /** 開啟造型商店回呼 */
  onOpenShop?: (() => void) | undefined;
  className?: string | undefined;
}

/**
 * FarmHeader - 農場遊戲頂部狀態列
 * 
 * 包含：
 * 1. 玩家等級 (Lv.X) 與平滑漸層 XP 進度條 (含數值與比例)。
 * 2. 金幣 (Coins) 額度與造型幣 (Style Tickets) 額度。
 * 3. 快速導覽按鈕 (返回記帳、背包倉庫、造型商店)。
 */
export const FarmHeader: React.FC<FarmHeaderProps> = ({
  onBack,
  onOpenInventory,
  onOpenShop,
  className,
}) => {
  const level = useFarmStore((state) => state.level);
  const xp = useFarmStore((state) => state.xp);
  const coins = useFarmStore((state) => state.coins);
  const styleTickets = useFarmStore((state) => state.styleTickets);
  const inventory = useFarmStore((state) => state.inventory);
  const getXpPercentage = useFarmStore((state) => state.getXpPercentage);
  const getXpRequiredForNextLevel = useFarmStore(
    (state) => state.getXpRequiredForNextLevel
  );

  const xpPercent = getXpPercentage();
  const xpRequired = getXpRequiredForNextLevel();

  // 計算倉庫物資總數
  const totalInventoryCount = useMemo(() => {
    return Object.values(inventory).reduce((acc, count) => acc + count, 0);
  }, [inventory]);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full px-3 py-2.5 sm:px-4",
        "bg-background/80 backdrop-blur-xl border-b border-border/50 transition-all",
        className
      )}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 sm:gap-3">
        {/* 左側：返回按鈕與等級/經驗值條 */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="返回記帳首頁"
              className="bouncy flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/90 shadow-[var(--shadow-soft)] border border-white/60 text-foreground/80 hover:text-foreground hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          {/* 等級徽章與經驗值條區塊 */}
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {/* 等級膠囊 */}
              <div className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-xs font-black text-white shadow-sm ring-1 ring-white/40">
                <Star className="h-3 w-3 fill-current animate-pulse text-amber-200" />
                <span>Lv.{level}</span>
              </div>

              {/* XP 數值 */}
              <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                {xp} <span className="opacity-60">/ {xpRequired} XP</span>
              </span>
            </div>

            {/* 平滑 XP 進度條 */}
            <div className="relative h-2.5 w-28 sm:w-36 overflow-hidden rounded-full bg-black/8 ring-1 ring-black/5 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 shadow-inner transition-all duration-500 ease-out"
                style={{ width: `${Math.max(4, Math.min(100, xpPercent))}%` }}
              />
            </div>
          </div>
        </div>

        {/* 右側：資產數額與操作入口 */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* 金幣幣值 (Coins) */}
          <div
            title="農場金幣 (可用於購買種子、幼崽與開墾土地)"
            className="flex items-center gap-1.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 px-2.5 py-1 text-xs font-bold text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-700/40 shadow-xs"
          >
            <span className="text-sm select-none" role="img" aria-label="金幣">
              🪙
            </span>
            <span className="font-extrabold tracking-tight">
              {coins.toLocaleString()}
            </span>
          </div>

          {/* 造型幣值 (Style Tickets) */}
          <div
            title="造型幣 (可用於外觀商店購買限定裝扮與外觀風格)"
            className="flex items-center gap-1.5 rounded-2xl bg-purple-50/90 dark:bg-purple-950/40 px-2.5 py-1 text-xs font-bold text-purple-900 dark:text-purple-200 border border-purple-200/60 dark:border-purple-700/40 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-500 fill-purple-400/40" />
            <span className="font-extrabold tracking-tight">
              {styleTickets.toLocaleString()}
            </span>
          </div>

          {/* 倉庫入口 */}
          {onOpenInventory && (
            <button
              onClick={onOpenInventory}
              title="農場倉庫"
              aria-label="查看倉庫物資"
              className="bouncy relative flex h-9 w-9 items-center justify-center rounded-2xl bg-white/90 dark:bg-card/90 shadow-[var(--shadow-soft)] border border-white/60 dark:border-white/10 text-foreground/80 hover:text-foreground"
            >
              <Package className="h-4 w-4" />
              {totalInventoryCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-white shadow-sm ring-1 ring-white">
                  {totalInventoryCount > 99 ? "99+" : totalInventoryCount}
                </span>
              )}
            </button>
          )}

          {/* 造型商店入口 */}
          {onOpenShop && (
            <button
              onClick={onOpenShop}
              title="造型商店"
              aria-label="前往造型商店"
              className="bouncy flex h-9 w-9 items-center justify-center rounded-2xl bg-white/90 dark:bg-card/90 shadow-[var(--shadow-soft)] border border-white/60 dark:border-white/10 text-purple-600 dark:text-purple-400 hover:text-purple-700"
            >
              <Store className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
