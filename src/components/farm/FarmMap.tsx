import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Package,
  Coins,
  Warehouse,
  ShoppingBag,
  HelpCircle,
  X,
  Lock,
} from "lucide-react";
import {
  useFarmStore,
  type AnimalType,
  CROP_CONFIGS,
  ANIMAL_CONFIGS,
} from "@/store/useFarmStore";
import { CropField } from "./CropField";
import { FarmAnimal } from "./FarmAnimal";
import { cn } from "@/lib/utils";

export interface FarmMapProps {
  /** 外部點擊開啟商店事件 (可指定 tab) */
  onOpenShop?: ((tab?: "market" | "dressing") => void) | undefined;
  className?: string | undefined;
}

/**
 * FarmMap - 農場遊戲核心網格地圖
 * 
 * 包含三大主要區域：
 * 1. 農舍與設施區 (Farmhouse, Silo, Pond, Scarecrow)
 * 2. 作物田地區 (Plots Grid，支援開墾擴展)
 * 3. 動物牧場區 (Animal Pasture，支援動物領養)
 * 
 * 內建 1 秒時間戳記心跳定時器，即時同步現實時間進度。
 */
export const FarmMap: React.FC<FarmMapProps> = ({ onOpenShop, className }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Store 狀態與方法
  const plots = useFarmStore((state) => state.plots);
  const animals = useFarmStore((state) => state.animals);
  const inventory = useFarmStore((state) => state.inventory);
  const coins = useFarmStore((state) => state.coins);
  const level = useFarmStore((state) => state.level);
  const equippedSkins = useFarmStore((state) => state.equippedSkins);

  const updateGrowthState = useFarmStore((state) => state.updateGrowthState);
  const expandPlot = useFarmStore((state) => state.expandPlot);
  const purchaseAnimal = useFarmStore((state) => state.purchaseAnimal);
  const sellItem = useFarmStore((state) => state.sellItem);

  // 全域心跳定時器：每 1 秒更新時間戳記並同步 store 成長判定
  useEffect(() => {
    // 首次掛載立即檢查離線成長進度
    updateGrowthState(Date.now());

    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      updateGrowthState(now);
    }, 1000);

    return () => clearInterval(timer);
  }, [updateGrowthState]);

  // 彈跳 Toast 訊息
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  // 開墾農田
  const handleExpandPlot = () => {
    const res = expandPlot();
    triggerToast(res.message);
  };

  // 領養動物
  const handleAdopt = (type: AnimalType) => {
    const res = purchaseAnimal(type);
    if (res.success) {
      setShowAdoptModal(false);
    }
    triggerToast(res.message);
  };

  // 出售倉庫物品
  const handleSellItem = (itemId: string) => {
    const res = sellItem(itemId, 1);
    triggerToast(res.message);
  };

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-2xl px-3 py-4 sm:px-5 sm:py-6",
        "flex flex-col gap-6 select-none",
        className
      )}
    >
      {/* 浮動系統訊息 Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 pop-in pointer-events-none">
          <div className="flex items-center gap-2 rounded-2xl bg-foreground/90 px-4 py-2 text-xs font-black text-background shadow-xl backdrop-blur-md ring-1 ring-white/20">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ====================================================================
       * 區域 1：農舍與設施區 (Farmhouse & Facilities Zone)
       * ==================================================================== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#e9f5db] via-[#cfe1b9] to-[#b5c99a] p-4 sm:p-5 shadow-[var(--shadow-soft)] border border-[#718355]/30">
        {/* 背景自然光斑與草地紋理裝飾 */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/25 blur-2xl" />
        <div className="pointer-events-none absolute bottom-2 left-6 text-2xl opacity-60">
          🌼
        </div>
        <div className="pointer-events-none absolute top-4 right-12 text-xl opacity-50">
          🌿
        </div>

        {/* 標題與當前裝扮風格標籤 */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏡</span>
            <div>
              <h2 className="text-sm font-black tracking-tight text-[#344e41]">
                溫馨莊園小窩
              </h2>
              <span className="text-[10px] font-bold text-[#588157]">
                風格：{equippedSkins.house === "house-japanese" ? "和風日式竹屋" : equippedSkins.house === "house-european" ? "童話歐風石莊" : "原木鄉村木屋"}
              </span>
            </div>
          </div>

          {onOpenShop && (
            <button
              onClick={() => onOpenShop("dressing")}
              className="bouncy flex items-center gap-1 rounded-2xl bg-white/80 px-2.5 py-1 text-[11px] font-extrabold text-[#344e41] shadow-xs hover:bg-white"
            >
              <ShoppingBag className="h-3 w-3 text-purple-600" />
              <span>外觀換裝</span>
            </button>
          )}
        </div>

        {/* 設施互動網格：主房屋、穀倉倉庫、清澈池塘、守護稻草人 */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 items-center">
          {/* 1. 主農舍建築 (SVG) */}
          <div className="flex flex-col items-center">
            <div className="group relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl bg-white/35 backdrop-blur-xs p-1 shadow-xs transition-transform hover:scale-105">
              <FarmhouseSvg skin={equippedSkins.house} />
              {/* 炊煙動效 */}
              <div className="pointer-events-none absolute -top-2 right-4 animate-bounce text-xs opacity-60">
                💨
              </div>
            </div>
            <span className="mt-1 text-[11px] font-black text-[#344e41]">農夫小屋</span>
          </div>

          {/* 2. 穀物倉庫建築 (點擊可開啟倉庫) */}
          <button
            onClick={() => setShowInventoryModal(true)}
            className="bouncy flex flex-col items-center cursor-pointer outline-none group"
          >
            <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl bg-white/35 backdrop-blur-xs p-1 shadow-xs transition-transform group-hover:scale-105">
              <BarnSiloSvg />
              {/* 倉庫標籤 */}
              <div className="absolute -top-1.5 right-1 flex items-center gap-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow-xs">
                <Warehouse className="h-2.5 w-2.5" />
                <span>倉庫</span>
              </div>
            </div>
            <span className="mt-1 text-[11px] font-black text-[#344e41]">
              莊園糧倉 (點擊)
            </span>
          </button>

          {/* 3. 睡蓮池塘與水井 (SVG) */}
          <div className="flex flex-col items-center">
            <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl bg-white/35 backdrop-blur-xs p-1 shadow-xs">
              <LotusPondSvg />
            </div>
            <span className="mt-1 text-[11px] font-black text-[#344e41]">甘甜水池</span>
          </div>
        </div>
      </section>

      {/* ====================================================================
       * 區域 2：作物田地區 (Crop Fields Zone)
       * ==================================================================== */}
      <section className="relative flex flex-col gap-3 rounded-3xl bg-gradient-to-b from-[#e8f5e9]/90 to-[#c8e6c9]/80 p-4 sm:p-5 shadow-[var(--shadow-soft)] border border-[#81c784]/40">
        {/* 區域標題列 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <div>
              <h2 className="text-sm font-black tracking-tight text-[#1b5e20]">
                莊園耕地
              </h2>
              <span className="text-[10px] font-bold text-[#2e7d32]">
                已開墾 {plots.length} 塊農田 · 支援真實時間生長
              </span>
            </div>
          </div>

          {/* 快速開墾按鈕 */}
          <button
            onClick={handleExpandPlot}
            className="bouncy flex items-center gap-1 rounded-2xl bg-emerald-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-xs hover:bg-emerald-700"
          >
            <Plus className="h-3 w-3 stroke-[3]" />
            <span>開墾新田</span>
          </button>
        </div>

        {/* 農田網格切塊 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 justify-items-center pt-1">
          {plots.map((plot) => (
            <CropField
              key={plot.id}
              plot={plot}
              currentTime={currentTime}
              onHarvest={(res) => triggerToast(res.message)}
            />
          ))}

          {/* 擴建預留卡片 */}
          <button
            onClick={handleExpandPlot}
            className="bouncy flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#81c784] bg-white/30 p-2 text-center text-[#2e7d32] transition-colors hover:bg-white/50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700">
              <Plus className="h-4 w-4 stroke-[3]" />
            </div>
            <span className="mt-1 text-xs font-black">開墾農地</span>
            <span className="text-[9px] font-bold opacity-75">
              擴大種植面積
            </span>
          </button>
        </div>
      </section>

      {/* ====================================================================
       * 區域 3：動物牧場區 (Animal Pasture Zone)
       * ==================================================================== */}
      <section className="relative flex flex-col gap-3 rounded-3xl bg-gradient-to-b from-[#fefae0]/90 to-[#faedcd]/80 p-4 sm:p-5 shadow-[var(--shadow-soft)] border border-[#d4a373]/40">
        {/* 區域標題列 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐾</span>
            <div>
              <h2 className="text-sm font-black tracking-tight text-[#7f4f24]">
                歡樂牧場
              </h2>
              <span className="text-[10px] font-bold text-[#936639]">
                現有 {animals.length} 隻動物夥伴 · 支援裝備插槽與副產物採集
              </span>
            </div>
          </div>

          {/* 領養新夥伴按鈕 */}
          <button
            onClick={() => setShowAdoptModal(true)}
            className="bouncy flex items-center gap-1 rounded-2xl bg-amber-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-xs hover:bg-amber-700"
          >
            <Plus className="h-3 w-3 stroke-[3]" />
            <span>領養夥伴</span>
          </button>
        </div>

        {/* 動物圍欄網格 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 justify-items-center pt-1">
          {animals.map((animal) => (
            <FarmAnimal
              key={animal.id}
              animal={animal}
              currentTime={currentTime}
              onCollect={(res) => triggerToast(res.message)}
            />
          ))}

          {/* 領養夥伴預留卡片 */}
          <button
            onClick={() => setShowAdoptModal(true)}
            className="bouncy flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#d4a373] bg-white/30 p-2 text-center text-[#7f4f24] transition-colors hover:bg-white/50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-700">
              <Plus className="h-4 w-4 stroke-[3]" />
            </div>
            <span className="mt-1 text-xs font-black">領養幼崽</span>
            <span className="text-[9px] font-bold opacity-75">
              母雞 / 乳牛 / 綿羊
            </span>
          </button>
        </div>
      </section>

      {/* ====================================================================
       * 倉庫物資抽屜/彈窗 (Inventory Modal)
       * ==================================================================== */}
      {showInventoryModal && (
        <div
          onClick={() => setShowInventoryModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-2xl pop-in ring-1 ring-black/5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-black text-foreground">
                  莊園倉庫 (庫存物資)
                </h3>
              </div>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="bouncy h-7 w-7 rounded-full bg-muted/60 text-xs font-bold hover:bg-muted flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="py-2 text-xs text-muted-foreground">
              點擊物品可單件出售換取金幣：
            </p>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {Object.keys(inventory).length === 0 ? (
                <div className="py-8 text-center text-xs font-bold text-muted-foreground">
                  倉庫空空如也，趕快收割作物或收集牛奶雞蛋吧！
                </div>
              ) : (
                Object.entries(inventory).map(([itemId, count]) => {
                  if (count <= 0) return null;

                  // 尋找物品資訊
                  let name = itemId;
                  let icon = "📦";
                  let sellPrice = 10;

                  const crop = CROP_CONFIGS[itemId as keyof typeof CROP_CONFIGS];
                  if (crop) {
                    name = crop.name;
                    icon = crop.icon;
                    sellPrice = crop.sellPrice;
                  } else {
                    const animalCfg = Object.values(ANIMAL_CONFIGS).find(
                      (a) => a.productType === itemId
                    );
                    if (animalCfg) {
                      name = animalCfg.productName;
                      icon = animalCfg.productType === "egg" ? "🥚" : animalCfg.productType === "milk" ? "🥛" : "🧶";
                      sellPrice = animalCfg.productSellPrice;
                    }
                  }

                  return (
                    <div
                      key={itemId}
                      className="flex items-center justify-between rounded-2xl bg-muted/40 p-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{icon}</span>
                        <div>
                          <div className="font-extrabold text-xs text-foreground">
                            {name}
                          </div>
                          <div className="text-[11px] font-semibold text-muted-foreground">
                            庫存：<span className="text-foreground font-black">{count}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSellItem(itemId)}
                        className="bouncy flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-black text-white shadow-xs"
                      >
                        <Coins className="h-3 w-3" />
                        <span>賣出 (+{sellPrice})</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
       * 領養動物彈窗 (Adopt Animal Modal)
       * ==================================================================== */}
      {showAdoptModal && (
        <div
          onClick={() => setShowAdoptModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-2xl pop-in ring-1 ring-black/5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <h3 className="text-base font-black text-foreground">
                領養牧場動物夥伴
              </h3>
              <button
                onClick={() => setShowAdoptModal(false)}
                className="bouncy h-7 w-7 rounded-full bg-muted/60 text-xs font-bold hover:bg-muted flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 pt-3">
              {Object.values(ANIMAL_CONFIGS).map((cfg) => {
                const isLocked = level < cfg.unlockLevel;
                const canAfford = coins >= cfg.buyCost;

                return (
                  <button
                    key={cfg.id}
                    disabled={isLocked || !canAfford}
                    onClick={() => handleAdopt(cfg.id)}
                    className={cn(
                      "flex items-center justify-between rounded-2xl p-3 text-left transition-all",
                      isLocked || !canAfford
                        ? "opacity-50 cursor-not-allowed bg-muted/30"
                        : "hover:bg-amber-50 dark:hover:bg-amber-950/40 bg-muted/40 active:scale-98"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{cfg.icon}</span>
                      <div>
                        <div className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                          {cfg.name}
                          {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          產出：{cfg.productName} · 每週期間隔 {Math.round(cfg.produceDurationMs / 1000)}秒
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={cn(
                          "text-xs font-black",
                          canAfford ? "text-amber-600 dark:text-amber-400" : "text-destructive"
                        )}
                      >
                        🪙 {cfg.buyCost}
                      </span>
                      {isLocked && (
                        <div className="text-[10px] text-muted-foreground font-semibold">
                          Lv.{cfg.unlockLevel}解鎖
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 莊園專屬建築純 SVG 向量圖繪製 (Farmhouse, Silo, Pond)
 * ============================================================================ */

/** 主農舍 SVG (支援根據換裝 skin 呈現不同風格) */
function FarmhouseSvg({ skin }: { skin?: string }) {
  if (skin === "house-japanese") {
    // 日式和風竹舍
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {/* 地基台座 */}
        <rect x="18" y="76" width="64" height="6" rx="2" fill="#8D5B4C" />
        {/* 紙拉門牆身 */}
        <rect x="24" y="46" width="52" height="30" fill="#FDFBF7" stroke="#6F4E37" strokeWidth="2" />
        <line x1="50" y1="46" x2="50" y2="76" stroke="#6F4E37" strokeWidth="1.5" />
        <line x1="24" y1="61" x2="76" y2="61" stroke="#6F4E37" strokeWidth="1" opacity="0.6" />
        {/* 日式弧形深灰飛簷瓦頂 */}
        <path d="M 12 46 Q 50 32 88 46 L 80 40 Q 50 24 20 40 Z" fill="#3D405B" />
        <path d="M 16 42 Q 50 26 84 42" stroke="#2B2D42" strokeWidth="3" fill="none" />
      </svg>
    );
  }

  if (skin === "house-european") {
    // 童話歐風石莊
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {/* 石造牆身 */}
        <rect x="22" y="44" width="56" height="38" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
        {/* 拱門 */}
        <path d="M 44 82 L 44 64 Q 50 58 56 64 L 56 82 Z" fill="#9A3412" />
        {/* 圓形彩繪小窗 */}
        <circle cx="34" cy="56" r="5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
        {/* 陡峭紅色尖頂瓦屋頂 */}
        <polygon points="16,46 50,18 84,46" fill="#DC2626" stroke="#B91C1C" strokeWidth="2" />
        {/* 右煙囪 */}
        <rect x="66" y="22" width="7" height="14" fill="#991B1B" />
      </svg>
    );
  }

  // 預設：溫暖原木鄉村木屋
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      {/* 陰影 */}
      <ellipse cx="50" cy="84" rx="34" ry="5" fill="#2D6A4F" opacity="0.25" />

      {/* 原木屋身 */}
      <rect x="22" y="44" width="56" height="38" rx="4" fill="#DEAB7E" stroke="#BC6C25" strokeWidth="2" />
      {/* 原木橫條壓紋 */}
      <line x1="22" y1="54" x2="78" y2="54" stroke="#BC6C25" strokeWidth="1" opacity="0.6" />
      <line x1="22" y1="64" x2="78" y2="64" stroke="#BC6C25" strokeWidth="1" opacity="0.6" />
      <line x1="22" y1="74" x2="78" y2="74" stroke="#BC6C25" strokeWidth="1" opacity="0.6" />

      {/* 溫馨紅木小門 */}
      <rect x="43" y="60" width="14" height="22" rx="3" fill="#C84B31" stroke="#9A3412" strokeWidth="1.2" />
      <circle cx="53" cy="72" r="1.5" fill="#FEF08A" />

      {/* 左右亮黃光木窗 */}
      <rect x="28" y="52" width="10" height="10" rx="2" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" />
      <rect x="62" y="52" width="10" height="10" rx="2" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" />

      {/* 焦糖三角屋頂 */}
      <polygon points="16,46 50,18 84,46" fill="#D97706" stroke="#B45309" strokeWidth="2" />

      {/* 磚造煙囪 */}
      <rect x="64" y="22" width="8" height="16" fill="#B45309" stroke="#92400E" strokeWidth="1" />
      <rect x="63" y="20" width="10" height="3" fill="#92400E" />
    </svg>
  );
}

/** 圓頂穀物倉庫 (Barn Silo) SVG */
function BarnSiloSvg() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <ellipse cx="50" cy="84" rx="30" ry="5" fill="#2D6A4F" opacity="0.25" />

      {/* 穀倉主柱體 */}
      <rect x="28" y="38" width="44" height="44" rx="4" fill="#B91C1C" stroke="#991B1B" strokeWidth="2" />

      {/* 白色農莊 X 型大門門飾 */}
      <rect x="36" y="54" width="28" height="28" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
      <line x1="36" y1="54" x2="64" y2="82" stroke="#B91C1C" strokeWidth="2" />
      <line x1="64" y1="54" x2="36" y2="82" stroke="#B91C1C" strokeWidth="2" />

      {/* 銀灰圓頂蓋 */}
      <path
        d="M 24 38 C 24 18 76 18 76 38 Z"
        fill="#94A3B8"
        stroke="#64748B"
        strokeWidth="2"
      />
      {/* 頂端金屬避雷針 */}
      <line x1="50" y1="20" x2="50" y2="12" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 清澈荷葉水池 (Lotus Pond) SVG */
function LotusPondSvg() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      {/* 水池外緣鵝卵石圈 */}
      <ellipse cx="50" cy="54" rx="40" ry="28" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
      {/* 水面漸層 */}
      <ellipse cx="50" cy="54" rx="36" ry="24" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />
      {/* 水波反光 */}
      <path d="M 28 50 Q 50 46 72 50" stroke="#E0F2FE" strokeWidth="1.8" fill="none" opacity="0.7" />
      <path d="M 34 60 Q 50 56 66 60" stroke="#E0F2FE" strokeWidth="1.5" fill="none" opacity="0.6" />

      {/* 兩片翠綠睡蓮葉 */}
      <ellipse cx="38" cy="54" rx="8" ry="5" fill="#15803D" />
      <ellipse cx="62" cy="58" rx="9" ry="6" fill="#16A34A" />

      {/* 粉嫩小睡蓮花 */}
      <circle cx="64" cy="56" r="3.5" fill="#F472B6" />
      <circle cx="64" cy="56" r="1.5" fill="#FDE047" />
    </svg>
  );
}
