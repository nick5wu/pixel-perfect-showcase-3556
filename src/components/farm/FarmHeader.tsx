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
        "sticky top-0 z-30 w-full px-3 py-3 sm:px-5",
        "glass-strong rounded-b-[2rem] border-b border-white/60 shadow-xs transition-all",
        className
      )}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 sm:gap-4">
        {/* 左側：返回按鈕與等級/經驗值條 */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="返回記帳首頁"
              className="bouncy flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl neu text-foreground active:scale-95"
            >
              <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
            </button>
          )}

          {/* 等級徽章與經驗值條區塊 */}
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {/* UsTwo 焦糖金等級膠囊 */}
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-black text-primary-foreground shadow-xs"
                style={{ backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))" }}
              >
                <Star className="h-3 w-3 fill-current text-amber-200 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Lv.{level}</span>
              </div>

              {/* XP 數值 */}
              <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap tabular-nums">
                {xp} <span className="opacity-70 font-semibold">/ {xpRequired} XP</span>
              </span>
            </div>

            {/* 溫暖凹槽 XP 進度條 (與夢想存錢目標統一) */}
            <div className="neu-inset relative h-3 w-28 sm:w-36 overflow-hidden rounded-full p-0.5">
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

        {/* 右側：資產數額與操作入口 */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* 金幣幣值 (Coins - 溫潤蜜糖暖金) */}
          <div
            title="農場金幣 (可用於購買種子、幼崽與開墾土地)"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black neu shadow-xs text-amber-800 dark:text-amber-300"
          >
            <span className="text-sm select-none" role="img" aria-label="金幣">
              🪙
            </span>
            <span className="font-black tracking-tight tabular-nums">
              {coins.toLocaleString()}
            </span>
          </div>

          {/* 造型幣值 (Style Tickets - 溫潤紫羅蘭) */}
          <div
            title="造型幣 (可用於外觀商店購買限定裝扮與外觀風格)"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black neu shadow-xs text-purple-700 dark:text-purple-300"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-500 fill-purple-400" />
            <span className="font-black tracking-tight tabular-nums">
              {styleTickets.toLocaleString()}
            </span>
          </div>

          {/* 倉庫入口 (Tactile Neu Button) */}
          {onOpenInventory && (
            <button
              onClick={onOpenInventory}
              title="農場倉庫"
              aria-label="查看倉庫物資"
              className="bouncy relative flex h-11 w-11 items-center justify-center rounded-2xl neu text-foreground active:scale-95"
            >
              <Package className="h-5 w-5 stroke-[2.2] text-muted-foreground" />
              {totalInventoryCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground shadow-xs">
                  {totalInventoryCount > 99 ? "99+" : totalInventoryCount}
                </span>
              )}
            </button>
          )}

          {/* 造型商店入口 (Tactile Caramel Button) */}
          {onOpenShop && (
            <button
              onClick={onOpenShop}
              title="造型商店"
              aria-label="前往造型商店"
              className="bouncy flex h-11 w-11 items-center justify-center rounded-2xl text-primary-foreground shadow-sm active:scale-95"
              style={{ backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))", boxShadow: "var(--shadow-soft)" }}
            >
              <Store className="h-5 w-5 stroke-[2.2]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
