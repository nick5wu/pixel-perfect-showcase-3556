import React, { useState } from "react";
import { FarmHeader } from "./FarmHeader";
import { FarmMap } from "./FarmMap";
import { FarmShopModal } from "./FarmShopModal";
import { cn } from "@/lib/utils";

export interface FarmViewProps {
  /** 返回記帳主畫面回呼 */
  onBack?: (() => void) | undefined;
  className?: string | undefined;
}

/**
 * FarmView - 農場遊戲主畫面整合容器
 * 
 * 將 FarmHeader、FarmMap 與 FarmShopModal 整合，
 * 支援直接作為獨立 Tab 頁面或全螢幕視窗渲染。
 */
export const FarmView: React.FC<FarmViewProps> = ({ onBack, className }) => {
  const [showShopModal, setShowShopModal] = useState(false);
  const [initialShopTab, setInitialShopTab] = useState<"market" | "dressing">("market");

  const handleOpenShop = (tab: "market" | "dressing" = "market") => {
    setInitialShopTab(tab);
    setShowShopModal(true);
  };

  return (
    <div
      className={cn(
        "relative min-h-[85vh] w-full flex flex-col transition-colors pb-6 sm:pb-8 rounded-[2.5rem]",
        "bg-gradient-to-b from-amber-50/50 via-background to-emerald-50/30 dark:from-slate-900/60 dark:via-background dark:to-emerald-950/20",
        className
      )}
    >
      {/* 頂部狀態列 */}
      <FarmHeader
        onBack={onBack}
        onOpenShop={() => handleOpenShop("dressing")}
        onOpenInventory={() => handleOpenShop("market")}
      />

      {/* 核心網格地圖 */}
      <main className="flex-1 w-full">
        <FarmMap onOpenShop={(tab = "dressing") => handleOpenShop(tab)} />
      </main>

      {/* 農場商店與造型更衣間彈窗 (Shop & Dressing Room) */}
      <FarmShopModal
        open={showShopModal}
        initialTab={initialShopTab}
        onClose={() => setShowShopModal(false)}
      />
    </div>
  );
};

