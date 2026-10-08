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
        "sticky top-0 z-40 w-full px-3.5 pb-2.5 sm:px-5",
        "glass-strong rounded-b-[2rem] border-b border-white/60 dark:border-white/10 shadow-xs transition-all backdrop-blur-xl",
        className
      )}
      style={{
        paddingTop: "max(env(safe-area-inset-top), 24px)",
      }}
    >
      <div className="mx-auto flex max-w-2xl flex-col">
        {/* 第一列：返回按鈕、莊園標題與資產/功能入口 */}
        <div className="flex items-center justify-between gap-2">
          {/* 左側：返回鍵與莊園小窩標題 */}
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                aria-label="返回記帳首頁"
                className="bouncy flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl neu text-foreground active:scale-95 border border-white/60 dark:border-white/10"
              >
                <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
              </button>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-extrabold text-foreground tracking-tight leading-tight truncate">
                🏡 莊園小窩
              </span>
              <span className="text-[10px] font-bold text-muted-foreground truncate">
                一起經營甜甜日常
              </span>
            </div>
          </div>

          {/* 右側：金幣、造型幣與功能按鈕 */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 金幣幣值 (Coins) */}
            <div
              title="農場金幣 (可用於購買種子與幼崽)"
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black neu shadow-xs text-amber-800 dark:text-amber-300 border border-white/60 dark:border-white/10"
            >
              <span className="text-xs select-none" role="img" aria-label="金幣">
                🪙
              </span>
              <span className="font-black tracking-tight tabular-nums">
                {coins.toLocaleString()}
              </span>
            </div>

            {/* 造型幣值 (Style Tickets) */}
            <div
              title="造型幣 (可用於造型商店裝扮)"
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black neu shadow-xs text-purple-700 dark:text-purple-300 border border-white/60 dark:border-white/10"
            >
              <Sparkles className="h-3 w-3 text-purple-500 fill-purple-400" />
              <span className="font-black tracking-tight tabular-nums">
                {styleTickets.toLocaleString()}
              </span>
            </div>

            {/* 倉庫入口 */}
            {onOpenInventory && (
              <button
                onClick={onOpenInventory}
                title="農場倉庫"
                aria-label="查看倉庫物資"
                className="bouncy relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl neu text-foreground active:scale-95 border border-white/60 dark:border-white/10"
              >
                <Package className="h-4.5 w-4.5 stroke-[2.2] text-muted-foreground" />
                {totalInventoryCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-primary-foreground shadow-xs">
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
                className="bouncy flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-primary-foreground shadow-sm active:scale-95"
                style={{
                  backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                <Store className="h-4.5 w-4.5 stroke-[2.2]" />
              </button>
            )}
          </div>
        </div>

        {/* 第二列：等級膠囊與全寬經驗值進度條 (徹底杜絕 XP 文字卡到金幣問題) */}
        <div className="mt-2.5 flex items-center gap-2.5 pt-0.5">
          {/* 等級徽章 */}
          <div
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black text-primary-foreground shadow-xs"
            style={{ backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))" }}
          >
            <Star className="h-3 w-3 fill-current text-amber-200 animate-spin" style={{ animationDuration: "6s" }} />
            <span>Lv.{level}</span>
          </div>

          {/* 全寬 XP 進度條與數值展示 */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground px-0.5 leading-none">
              <span className="text-[10px] text-muted-foreground/80 font-bold">經驗進度</span>
              <span className="tabular-nums font-extrabold text-foreground">
                {xp} <span className="text-muted-foreground font-medium">/ {xpRequired} XP</span>
                <span className="ml-1 text-[10px] font-black text-[var(--caramel)]">
                  ({Math.round(xpPercent)}%)
                </span>
              </span>
            </div>

            <div className="neu-inset relative h-2.5 w-full overflow-hidden rounded-full p-0.5 border border-white/40 dark:border-white/5">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.max(5, Math.min(100, xpPercent))}%`,
                  backgroundImage: "linear-gradient(90deg, var(--caramel), var(--caramel-soft))",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
