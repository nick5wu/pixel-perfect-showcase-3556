import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Store,
  Sparkles,
  Check,
  Lock,
  Shirt,
  CheckCircle2,
} from "lucide-react";
import {
  useFarmStore,
  AVAILABLE_SKINS,
  CROP_CONFIGS,
  ANIMAL_CONFIGS,
  type AnimalType,
  type CropType,
} from "@/store/useFarmStore";
import { cn } from "@/lib/utils";

export interface FarmShopModalProps {
  /** 是否開啟彈窗 */
  open: boolean;
  /** 關閉彈窗回呼 */
  onClose: () => void;
  /** 預設顯示的 Tab 分頁 */
  initialTab?: "market" | "dressing" | undefined;
  className?: string | undefined;
}

type ShopTab = "market" | "dressing";
type PreviewTarget = "cow" | "chicken" | "sheep" | "house";

/**
 * FarmShopModal - 農場商店與造型更衣間 (Shop & Dressing Room)
 * 
 * 融合 UsTwo Ledger 頂級溫暖燕麥奶與焦糖美學：
 * 1. Bottom Sheet 底部抽屜彈窗 (Framer Motion 彈性滑動與半透明毛玻璃暖調遮罩)。
 * 2. 雙 Tab 切換：「🛒 雜貨店 (Market)」與「👗 造型更衣間 (Dressing Room)」。
 * 3. 雜貨店：Bento Grid (便當盒網格) 佈局，包含種子、幼崽與資材，支援購買微動效。
 * 4. 更衣間：毛玻璃溫暖展示台，即時反映裝備 SVG，橫向滑動飾品清單。
 */
export const FarmShopModal: React.FC<FarmShopModalProps> = ({
  open,
  onClose,
  initialTab = "market",
  className,
}) => {
  const [activeTab, setActiveTab] = useState<ShopTab>(initialTab);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget>("cow");
  const [selectedSlot, setSelectedSlot] = useState<"head" | "neck" | "animalStyle" | "house">("head");
  const [purchasedFeedback, setPurchasedFeedback] = useState<Record<string, boolean>>({});

  // Store 狀態與操作
  const coins = useFarmStore((state) => state.coins);
  const styleTickets = useFarmStore((state) => state.styleTickets);
  const level = useFarmStore((state) => state.level);
  const animals = useFarmStore((state) => state.animals);
  const unlockedSkins = useFarmStore((state) => state.unlockedSkins);
  const equippedSkins = useFarmStore((state) => state.equippedSkins);

  const spendCoins = useFarmStore((state) => state.spendCoins);
  const addInventoryItem = useFarmStore((state) => state.addInventoryItem);
  const purchaseAnimal = useFarmStore((state) => state.purchaseAnimal);
  const buySkin = useFarmStore((state) => state.buySkin);
  const equipSkin = useFarmStore((state) => state.equipSkin);
  const unequipSkin = useFarmStore((state) => state.unequipSkin);
  const equipAnimal = useFarmStore((state) => state.equipAnimal);

  // 取得當前預覽對象的特定實體資料 (以動物為例)
  const currentPreviewAnimal = useMemo(() => {
    return animals.find((a) => a.type === previewTarget) || animals[0] || null;
  }, [animals, previewTarget]);

  // 購買回饋微動效
  const triggerPurchaseEffect = (id: string) => {
    setPurchasedFeedback((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setPurchasedFeedback((prev) => ({ ...prev, [id]: false }));
    }, 1400);
  };

  // 處理雜貨店作物種子購買
  const handleBuySeed = (cropId: CropType, cost: number) => {
    if (coins < cost) return;
    const ok = spendCoins(cost);
    if (ok) {
      addInventoryItem(cropId, 1);
      triggerPurchaseEffect(`crop-${cropId}`);
    }
  };

  // 處理雜貨店動物幼崽領養
  const handleBuyAnimal = (type: AnimalType) => {
    const config = ANIMAL_CONFIGS[type];
    if (!config || coins < config.buyCost) return;
    const res = purchaseAnimal(type);
    if (res.success) {
      triggerPurchaseEffect(`animal-${type}`);
    }
  };

  // 處理雜貨店肥料/資材購買
  const handleBuySupply = (id: string, cost: number) => {
    if (coins < cost) return;
    const ok = spendCoins(cost);
    if (ok) {
      addInventoryItem(id, 1);
      triggerPurchaseEffect(id);
    }
  };

  // 篩選當前部位裝備清單
  const slotSkins = useMemo(() => {
    return AVAILABLE_SKINS.filter((skin) => skin.category === selectedSlot);
  }, [selectedSlot]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          {/* 半透明毛玻璃暖調遮罩 Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={onClose}
            className="fixed inset-0 bg-[oklch(0.22_0.02_55/0.5)] backdrop-blur-md"
          />

          {/* Bottom Sheet 主面板 */}
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className={cn(
              "glass-strong relative z-10 w-full max-w-xl sm:rounded-[2.5rem] rounded-t-[2.5rem]",
              "border border-white/70 dark:border-white/10",
              "shadow-[0_-16px_48px_rgba(0,0,0,0.18)] max-h-[92vh] flex flex-col overflow-hidden",
              className
            )}
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
            }}
          >
            {/* 頂部拖曳把手與資產條 */}
            <div className="flex flex-col items-center pt-3 pb-2 px-5 border-b border-border/60">
              {/* 頂部手勢把手 */}
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30 mb-3" />

              {/* 資產餘額與關閉按鈕列 */}
              <div className="flex w-full items-center justify-between">
                {/* 玩家資產膠囊 */}
                <div className="flex items-center gap-2">
                  {/* 金幣 Coins */}
                  <div className="glass neu rounded-full flex items-center gap-1.5 px-3.5 py-1.5 border border-white/60 dark:border-white/10 shadow-xs">
                    <span className="text-sm select-none" role="img" aria-label="金幣">
                      🪙
                    </span>
                    <span className="text-xs font-black tracking-tight text-[var(--caramel)]">
                      {coins.toLocaleString()}
                    </span>
                  </div>

                  {/* 造型幣 Style Tickets */}
                  <div className="glass neu rounded-full flex items-center gap-1.5 px-3.5 py-1.5 border border-white/60 dark:border-white/10 shadow-xs">
                    <Sparkles className="h-3.5 w-3.5 text-purple-500 fill-purple-500" />
                    <span className="text-xs font-black tracking-tight text-purple-600 dark:text-purple-400">
                      {styleTickets.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 關閉按鈕 (Android 48px touch target) */}
                <button
                  onClick={onClose}
                  aria-label="關閉商店"
                  className="neu bouncy flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground active:scale-95 border border-white/60 dark:border-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 雙 Tab 切換分頁：「🛒 雜貨店」與「👗 造型更衣間」 */}
              <div className="neu-inset relative flex w-full items-center p-1.5 mt-3 rounded-2xl border border-white/40 dark:border-white/5">
                {/* 雜貨店 Tab */}
                <button
                  onClick={() => setActiveTab("market")}
                  className={cn(
                    "bouncy relative flex-1 min-h-[44px] py-2 text-xs font-black transition-all rounded-xl flex items-center justify-center gap-1.5 z-10 active:scale-95",
                    activeTab === "market"
                      ? "text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  style={
                    activeTab === "market"
                      ? { background: "linear-gradient(135deg, var(--caramel), var(--caramel-soft))" }
                      : {}
                  }
                >
                  <Store className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">🛒 雜貨店 (Market)</span>
                </button>

                {/* 造型更衣間 Tab */}
                <button
                  onClick={() => setActiveTab("dressing")}
                  className={cn(
                    "bouncy relative flex-1 min-h-[44px] py-2 text-xs font-black transition-all rounded-xl flex items-center justify-center gap-1.5 z-10 active:scale-95",
                    activeTab === "dressing"
                      ? "text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  style={
                    activeTab === "dressing"
                      ? { background: "linear-gradient(135deg, var(--caramel), var(--caramel-soft))" }
                      : {}
                  }
                >
                  <Shirt className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">👗 造型更衣間 (Dressing Room)</span>
                </button>
              </div>
            </div>

            {/* Tab 內容切換區 */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 no-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === "market" ? (
                  /* ==============================================================
                   * TAB 1: 雜貨店 (Market) - Bento Grid 便當盒佈局
                   * ============================================================== */
                  <motion.div
                    key="market-view"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.22 }}
                    className="flex flex-col gap-4"
                  >
                    {/* Bento Grid 區域標題 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🥕</span>
                        <h3 className="text-sm font-extrabold text-foreground">
                          農莊當季精選與幼崽
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        等級越高，可解鎖更多珍稀種子
                      </span>
                    </div>

                    {/* Bento Grid 容器 */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {/* 1. 精選焦點卡片 (Featured Bento: 草莓種子 / 跨 2 欄) */}
                      <BentoCardFeatured
                        crop={CROP_CONFIGS.strawberry}
                        playerLevel={level}
                        playerCoins={coins}
                        isPurchased={!!purchasedFeedback["crop-strawberry"]}
                        onBuy={() => handleBuySeed("strawberry", CROP_CONFIGS.strawberry.seedCost)}
                      />

                      {/* 2. 小麥種子 */}
                      <BentoCardSeed
                        crop={CROP_CONFIGS.wheat}
                        playerLevel={level}
                        playerCoins={coins}
                        isPurchased={!!purchasedFeedback["crop-wheat"]}
                        onBuy={() => handleBuySeed("wheat", CROP_CONFIGS.wheat.seedCost)}
                      />

                      {/* 3. 胡蘿蔔種子 */}
                      <BentoCardSeed
                        crop={CROP_CONFIGS.carrot}
                        playerLevel={level}
                        playerCoins={coins}
                        isPurchased={!!purchasedFeedback["crop-carrot"]}
                        onBuy={() => handleBuySeed("carrot", CROP_CONFIGS.carrot.seedCost)}
                      />

                      {/* 4. 玉米種子 */}
                      <BentoCardSeed
                        crop={CROP_CONFIGS.corn}
                        playerLevel={level}
                        playerCoins={coins}
                        isPurchased={!!purchasedFeedback["crop-corn"]}
                        onBuy={() => handleBuySeed("corn", CROP_CONFIGS.corn.seedCost)}
                      />

                      {/* 5. 萬聖大南瓜種子 */}
                      <BentoCardSeed
                        crop={CROP_CONFIGS.pumpkin}
                        playerLevel={level}
                        playerCoins={coins}
                        isPurchased={!!purchasedFeedback["crop-pumpkin"]}
                        onBuy={() => handleBuySeed("pumpkin", CROP_CONFIGS.pumpkin.seedCost)}
                      />

                      {/* 6. 特級有機肥料 */}
                      <div className="bouncy glass flex flex-col justify-between p-3.5 rounded-3xl border border-white/60 dark:border-white/10 shadow-[var(--shadow-soft)]">
                        <div className="flex items-start justify-between">
                          <span className="text-2xl drop-shadow-xs">🧪</span>
                          <span className="glass neu text-emerald-600 dark:text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs">
                            熱銷道具
                          </span>
                        </div>
                        <div className="my-2">
                          <div className="text-xs font-black text-foreground">有機肥料</div>
                          <div className="text-[10px] text-muted-foreground font-bold">
                            為土壤注入豐富養分
                          </div>
                        </div>
                        <BuyButton
                          price={20}
                          canAfford={coins >= 20}
                          isPurchased={!!purchasedFeedback["fertilizer"]}
                          onClick={() => handleBuySupply("fertilizer", 20)}
                        />
                      </div>
                    </div>

                    {/* 幼崽牧場專區 */}
                    <div className="mt-3 flex flex-col gap-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🐣</span>
                        <h4 className="text-xs font-black text-foreground">
                          領養農場動物幼崽
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {Object.values(ANIMAL_CONFIGS).map((animalCfg) => {
                          const isLocked = level < animalCfg.unlockLevel;
                          const canAfford = coins >= animalCfg.buyCost;
                          const isPurchased = !!purchasedFeedback[`animal-${animalCfg.id}`];

                          return (
                            <div
                              key={animalCfg.id}
                              className={cn(
                                "bouncy glass flex flex-col justify-between p-3.5 rounded-3xl border border-white/60 dark:border-white/10 shadow-[var(--shadow-soft)]",
                                isLocked && "opacity-60"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-3xl drop-shadow-xs">{animalCfg.icon}</span>
                                {isLocked ? (
                                  <span className="glass neu flex items-center gap-0.5 text-[9px] font-bold text-muted-foreground px-2 py-0.5 rounded-full">
                                    <Lock className="h-2.5 w-2.5" /> Lv.{animalCfg.unlockLevel}
                                  </span>
                                ) : (
                                  <span
                                    className="text-[9px] font-black text-white px-2 py-0.5 rounded-full shadow-xs"
                                    style={{ background: "linear-gradient(135deg, var(--caramel), var(--caramel-soft))" }}
                                  >
                                    產{animalCfg.productName}
                                  </span>
                                )}
                              </div>

                              <div className="my-2">
                                <div className="text-xs font-black text-foreground">
                                  {animalCfg.name}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-bold">
                                  每{Math.round(animalCfg.produceDurationMs / 1000)}秒產出 · +{animalCfg.xpReward}XP
                                </div>
                              </div>

                              <BuyButton
                                price={animalCfg.buyCost}
                                canAfford={canAfford && !isLocked}
                                disabledText={isLocked ? `Lv.${animalCfg.unlockLevel} 解鎖` : undefined}
                                isPurchased={isPurchased}
                                onClick={() => handleBuyAnimal(animalCfg.id)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* ==============================================================
                   * TAB 2: 造型更衣間 (Dressing Room)
                   * ============================================================== */
                  <motion.div
                    key="dressing-view"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.22 }}
                    className="flex flex-col gap-4"
                  >
                    {/* 上半部：毛玻璃展示台 (Preview Zone) */}
                    <div className="glass-strong relative flex flex-col items-center justify-center rounded-[2.2rem] p-4.5 border border-white/70 dark:border-white/10 shadow-[var(--shadow-soft)] overflow-hidden">
                      <div className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full bg-purple-500/10 blur-2xl" />

                      {/* 展示對象切換按鈕列 */}
                      <div className="neu-inset flex items-center gap-1.5 mb-2.5 p-1 rounded-2xl border border-white/40 dark:border-white/5">
                        {(
                          [
                            { key: "cow", label: "乳牛 🐮" },
                            { key: "chicken", label: "小雞 🐥" },
                            { key: "sheep", label: "綿羊 🐑" },
                            { key: "house", label: "小屋 🏡" },
                          ] as const
                        ).map((target) => (
                          <button
                            key={target.key}
                            onClick={() => setPreviewTarget(target.key)}
                            className={cn(
                              "bouncy px-3 py-1.5 rounded-xl text-xs font-black transition-all",
                              previewTarget === target.key
                                ? "glass neu text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {target.label}
                          </button>
                        ))}
                      </div>

                      {/* 展示台中央 SVG 實體渲染 */}
                      <motion.div
                        key={`${previewTarget}-${equippedSkins.house}-${currentPreviewAnimal?.equipment?.head}-${currentPreviewAnimal?.equipment?.neck}`}
                        initial={{ scale: 0.92, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="relative flex h-36 w-36 sm:h-40 sm:w-40 items-center justify-center my-1"
                      >
                        {/* 展示台底座柔和光圈 */}
                        <div className="pointer-events-none absolute bottom-2 h-8 w-28 rounded-full bg-purple-300/30 dark:bg-purple-500/20 blur-md" />

                        {previewTarget === "house" ? (
                          <div className="h-28 w-28 drop-shadow-md">
                            <FarmhousePreviewSvg skin={equippedSkins.house} />
                          </div>
                        ) : (
                          <div className="h-32 w-32 drop-shadow-md">
                            <AnimalPreviewSvg
                              type={previewTarget}
                              equipment={currentPreviewAnimal?.equipment}
                            />
                          </div>
                        )}
                      </motion.div>

                      {/* 當前裝備狀態標籤 */}
                      <div className="glass neu rounded-full flex items-center gap-2 px-3.5 py-1 text-[11px] font-black text-foreground shadow-xs mt-1 border border-white/60 dark:border-white/10">
                        {previewTarget === "house" ? (
                          <span>
                            當前外觀：{equippedSkins.house === "house-japanese" ? "和風日式竹屋" : equippedSkins.house === "house-european" ? "童話歐風石莊" : "原木經典木屋"}
                          </span>
                        ) : (
                          <span>
                            頭部：{currentPreviewAnimal?.equipment?.head || "無"} · 頸部：
                            {currentPreviewAnimal?.equipment?.neck || "無"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 下半部：部位分類切換標籤 */}
                    <div className="flex items-center gap-2 border-b border-border/60 pb-2.5 overflow-x-auto no-scrollbar pt-1">
                      {(
                        [
                          { key: "head", label: "👒 頭部飾品" },
                          { key: "neck", label: "🔔 頸部飾品" },
                          { key: "animalStyle", label: "🎨 特殊外觀" },
                          { key: "house", label: "🏡 莊園建築" },
                        ] as const
                      ).map((slot) => (
                        <button
                          key={slot.key}
                          onClick={() => setSelectedSlot(slot.key)}
                          className={cn(
                            "bouncy rounded-full px-3.5 py-1.5 text-xs font-black whitespace-nowrap transition-all border",
                            selectedSlot === slot.key
                              ? "text-white shadow-xs border-transparent"
                              : "glass neu text-muted-foreground hover:text-foreground border-white/60 dark:border-white/10"
                          )}
                          style={
                            selectedSlot === slot.key
                              ? { background: "linear-gradient(135deg, var(--caramel), var(--caramel-soft))" }
                              : {}
                          }
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>

                    {/* 橫向滑動裝備卡片列表 */}
                    <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 px-0.5">
                      {slotSkins.map((skin) => {
                        const isUnlocked = unlockedSkins.includes(skin.id);

                        let isEquipped = false;
                        if (skin.category === "head") {
                          isEquipped = currentPreviewAnimal?.equipment?.head === skin.id;
                        } else if (skin.category === "neck") {
                          isEquipped = currentPreviewAnimal?.equipment?.neck === skin.id;
                        } else if (skin.category === "house") {
                          isEquipped = equippedSkins.house === skin.id;
                        } else {
                          isEquipped = equippedSkins.animalStyle === skin.id;
                        }

                        const canAfford =
                          skin.currency === "coins"
                            ? coins >= skin.price
                            : styleTickets >= skin.price;

                        const handleEquip = () => {
                          if (skin.category === "head" || skin.category === "neck") {
                            if (currentPreviewAnimal) {
                              equipAnimal(currentPreviewAnimal.id, skin.category, skin.id);
                            }
                          } else {
                            equipSkin(skin.category, skin.id);
                          }
                        };

                        const handleUnequip = () => {
                          if (skin.category === "head" || skin.category === "neck") {
                            if (currentPreviewAnimal) {
                              equipAnimal(currentPreviewAnimal.id, skin.category, "");
                            }
                          } else {
                            unequipSkin(skin.category);
                          }
                        };

                        const handleUnlock = () => {
                          buySkin(skin.id);
                        };

                        return (
                          <div
                            key={skin.id}
                            className={cn(
                              "bouncy glass flex flex-col justify-between p-3.5 min-w-[150px] max-w-[150px] shrink-0 rounded-3xl",
                              "border transition-all duration-200 shadow-xs",
                              isEquipped
                                ? "border-[var(--caramel)]! ring-2 ring-[var(--caramel)]/40 shadow-sm"
                                : isUnlocked
                                ? "border-white/70 dark:border-white/10"
                                : "border-dashed border-border opacity-70"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <span className="text-3xl drop-shadow-xs">{skin.previewIcon}</span>
                              {isEquipped ? (
                                <span
                                  className="text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs"
                                  style={{ background: "linear-gradient(135deg, var(--caramel), var(--caramel-soft))" }}
                                >
                                  <Check className="h-2.5 w-2.5" /> 已裝備
                                </span>
                              ) : !isUnlocked ? (
                                <span className="glass neu text-muted-foreground text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <Lock className="h-2.5 w-2.5" /> 未解鎖
                                </span>
                              ) : null}
                            </div>

                            <div className="my-2.5">
                              <div className="text-xs font-black text-foreground truncate">
                                {skin.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-bold line-clamp-2 leading-tight mt-0.5">
                                {skin.description}
                              </div>
                            </div>

                            {/* 卡片按鈕 */}
                            {isEquipped ? (
                              <button
                                onClick={handleUnequip}
                                className="neu bouncy w-full py-1.5 rounded-xl text-muted-foreground hover:text-foreground text-xs font-black active:scale-95"
                              >
                                卸下
                              </button>
                            ) : isUnlocked ? (
                              <button
                                onClick={handleEquip}
                                className="bouncy w-full py-1.5 rounded-xl text-white text-xs font-black shadow-xs active:scale-95"
                                style={{ background: "linear-gradient(135deg, var(--caramel), var(--caramel-soft))" }}
                              >
                                裝備
                              </button>
                            ) : (
                              <button
                                disabled={!canAfford}
                                onClick={handleUnlock}
                                className={cn(
                                  "bouncy w-full py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 active:scale-95",
                                  canAfford
                                    ? "text-white shadow-xs"
                                    : "bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
                                )}
                                style={
                                  canAfford
                                    ? { background: "linear-gradient(135deg, var(--caramel), var(--caramel-soft))" }
                                    : {}
                                }
                              >
                                {skin.currency === "coins" ? (
                                  <span>🪙 {skin.price}</span>
                                ) : (
                                  <span className="flex items-center gap-0.5">
                                    <Sparkles className="h-3 w-3" />
                                    {skin.price} 造型幣
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* ============================================================================
 * Bento Grid 卡片子元件 (Bento Cards)
 * ============================================================================ */

interface BentoCardSeedProps {
  crop: (typeof CROP_CONFIGS)[CropType];
  playerLevel: number;
  playerCoins: number;
  isPurchased: boolean;
  onBuy: () => void;
}

/** 常規種子 Bento 卡片 */
function BentoCardSeed({
  crop,
  playerLevel,
  playerCoins,
  isPurchased,
  onBuy,
}: BentoCardSeedProps) {
  const isLocked = playerLevel < crop.unlockLevel;
  const canAfford = playerCoins >= crop.seedCost;

  return (
    <div
      className={cn(
        "bouncy glass flex flex-col justify-between p-3.5 rounded-3xl border border-white/60 dark:border-white/10 shadow-[var(--shadow-soft)] transition-all",
        isLocked && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-2xl drop-shadow-xs">{crop.icon}</span>
        {isLocked ? (
          <span className="glass neu rounded-full flex items-center gap-0.5 text-[9px] font-bold text-muted-foreground px-2 py-0.5">
            <Lock className="h-2.5 w-2.5" /> Lv.{crop.unlockLevel}
          </span>
        ) : (
          <span className="glass neu rounded-full text-[9px] font-black text-emerald-600 dark:text-emerald-400 px-2 py-0.5">
            {Math.round(crop.growDurationMs / 1000)}s 成熟
          </span>
        )}
      </div>

      <div className="my-2">
        <div className="text-xs font-black text-foreground">{crop.name}種子</div>
        <div className="text-[10px] text-muted-foreground font-bold">
          收成產量 x{crop.harvestYield} · +{crop.xpReward}XP
        </div>
      </div>

      <BuyButton
        price={crop.seedCost}
        canAfford={canAfford && !isLocked}
        disabledText={isLocked ? `Lv.${crop.unlockLevel} 解鎖` : undefined}
        isPurchased={isPurchased}
        onClick={onBuy}
      />
    </div>
  );
}

/** 精選焦點種子卡片 (橫跨 2 欄) */
function BentoCardFeatured({
  crop,
  playerLevel,
  playerCoins,
  isPurchased,
  onBuy,
}: BentoCardSeedProps) {
  const isLocked = playerLevel < crop.unlockLevel;
  const canAfford = playerCoins >= crop.seedCost;

  return (
    <div
      className={cn(
        "bouncy glass col-span-2 flex items-center justify-between rounded-3xl p-4 border border-white/70 dark:border-white/10 shadow-[var(--shadow-soft)] relative overflow-hidden",
        isLocked && "opacity-60"
      )}
    >
      <div className="pointer-events-none absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-[var(--caramel)]/10 blur-xl" />
      <div className="flex items-center gap-3 relative z-10">
        <div className="glass neu flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-xs">
          {crop.icon}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-foreground">{crop.name}種子</span>
            <span
              className="text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs"
              style={{ background: "linear-gradient(135deg, var(--caramel), var(--caramel-soft))" }}
            >
              高收益首選
            </span>
          </div>
          <div className="text-xs text-muted-foreground font-bold mt-0.5">
            收成產量 x{crop.harvestYield} · 成品每顆可賣 🪙{crop.sellPrice}
          </div>
          <div className="text-[10px] text-muted-foreground/80 font-semibold">
            生長時長：{Math.round(crop.growDurationMs / 1000 / 60)} 分鐘 · 獎勵 +{crop.xpReward} XP
          </div>
        </div>
      </div>

      <div className="shrink-0 pl-3 relative z-10">
        <BuyButton
          price={crop.seedCost}
          canAfford={canAfford && !isLocked}
          disabledText={isLocked ? `Lv.${crop.unlockLevel} 解鎖` : undefined}
          isPurchased={isPurchased}
          onClick={onBuy}
        />
      </div>
    </div>
  );
}

/** 購買按鈕 (支援金幣扣除飛走 / 打勾微動效) */
function BuyButton({
  price,
  canAfford,
  disabledText,
  isPurchased,
  onClick,
}: {
  price: number;
  canAfford: boolean;
  disabledText?: string | undefined;
  isPurchased: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={!canAfford || isPurchased}
      onClick={onClick}
      className={cn(
        "bouncy min-h-[38px] relative flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-black transition-all active:scale-95",
        isPurchased
          ? "bg-emerald-500 text-white shadow-xs"
          : canAfford
          ? "text-white shadow-xs"
          : "bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
      )}
      style={
        !isPurchased && canAfford
          ? { background: "linear-gradient(135deg, var(--caramel), var(--caramel-soft))" }
          : {}
      }
    >
      <AnimatePresence mode="wait">
        {isPurchased ? (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center gap-1"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>已購入!</span>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1"
          >
            {disabledText ? (
              <span>{disabledText}</span>
            ) : (
              <>
                <span>🪙</span>
                <span>{price} 購買</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

/* ============================================================================
 * 展示台純 SVG 即時預覽子元件 (Preview SVGs)
 * ============================================================================ */

function AnimalPreviewSvg({
  type,
  equipment,
}: {
  type: PreviewTarget;
  equipment?: { head?: string | undefined; neck?: string | undefined } | undefined;
}) {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full drop-shadow-md">
      <ellipse cx="60" cy="104" rx="36" ry="7" fill="#2D6A4F" opacity="0.25" />

      {/* 底層動物 */}
      {type === "cow" && <CowBaseSvg />}
      {type === "chicken" && <ChickenBaseSvg />}
      {type === "sheep" && <SheepBaseSvg />}

      {/* 頸部裝備插槽 */}
      {equipment?.neck === "golden-bell" && (
        <g transform={type === "cow" ? "translate(60, 78)" : "translate(60, 84)"}>
          <path d="M -14 -4 Q 0 2 14 -4" stroke="#E63946" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="0" cy="5" r="6" fill="#FFB703" stroke="#FB8500" strokeWidth="1" />
          <circle cx="-2" cy="3.5" r="1.2" fill="#FFFBEB" />
        </g>
      )}
      {equipment?.neck === "red-scarf" && (
        <g transform={type === "cow" ? "translate(60, 78)" : "translate(60, 83)"}>
          <ellipse cx="0" cy="0" rx="16" ry="5" fill="#E63946" stroke="#9B2226" strokeWidth="1" />
          <path d="M 6 0 L 10 14 L 4 14 Z" fill="#E63946" stroke="#9B2226" strokeWidth="1" />
        </g>
      )}

      {/* 頭部裝備插槽 */}
      {equipment?.head === "straw-hat" && (
        <g transform={type === "cow" ? "translate(60, 36)" : "translate(60, 44)"}>
          <ellipse cx="0" cy="0" rx="22" ry="6" fill="#DDA15E" stroke="#BC6C25" strokeWidth="1.2" />
          <path d="M -12 -1 C -12 -14 12 -14 12 -1 Z" fill="#E9C46A" stroke="#BC6C25" strokeWidth="1.2" />
          <path d="M -12 -2 Q 0 -1 12 -2 L 11 0 Q 0 1 -11 0 Z" fill="#E63946" />
        </g>
      )}
      {equipment?.head === "flower-crown" && (
        <g transform={type === "cow" ? "translate(60, 40)" : "translate(60, 48)"}>
          <path d="M -16 0 Q 0 -6 16 0" stroke="#52B788" strokeWidth="2.5" fill="none" />
          <circle cx="-10" cy="-2" r="3.5" fill="#FFB703" />
          <circle cx="0" cy="-4" r="4" fill="#FF758F" />
          <circle cx="10" cy="-2" r="3.5" fill="#72EFDD" />
        </g>
      )}
    </svg>
  );
}

function FarmhousePreviewSvg({ skin }: { skin?: string | undefined }) {
  if (skin === "house-japanese") {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <rect x="18" y="76" width="64" height="6" rx="2" fill="#8D5B4C" />
        <rect x="24" y="46" width="52" height="30" fill="#FDFBF7" stroke="#6F4E37" strokeWidth="2" />
        <path d="M 12 46 Q 50 32 88 46 L 80 40 Q 50 24 20 40 Z" fill="#3D405B" />
      </svg>
    );
  }
  if (skin === "house-european") {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <rect x="22" y="44" width="56" height="38" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
        <polygon points="16,46 50,18 84,46" fill="#DC2626" stroke="#B91C1C" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <ellipse cx="50" cy="84" rx="34" ry="5" fill="#2D6A4F" opacity="0.25" />
      <rect x="22" y="44" width="56" height="38" rx="4" fill="#DEAB7E" stroke="#BC6C25" strokeWidth="2" />
      <polygon points="16,46 50,18 84,46" fill="#D97706" stroke="#B45309" strokeWidth="2" />
    </svg>
  );
}

function ChickenBaseSvg() {
  return (
    <g>
      <ellipse cx="60" cy="74" rx="28" ry="26" fill="#FFFDF0" stroke="#E9C46A" strokeWidth="2" />
      <path d="M 54 48 C 50 38 60 36 60 48 C 64 36 74 38 70 48 Z" fill="#E76F51" />
      <circle cx="50" cy="66" r="3.5" fill="#264653" />
      <circle cx="49" cy="64.5" r="1.2" fill="#FFFFFF" />
      <circle cx="70" cy="66" r="3.5" fill="#264653" />
      <circle cx="69" cy="64.5" r="1.2" fill="#FFFFFF" />
      <polygon points="56,71 64,71 60,77" fill="#F4A261" stroke="#E76F51" strokeWidth="1" />
    </g>
  );
}

function CowBaseSvg() {
  return (
    <g>
      <rect x="36" y="86" width="11" height="18" rx="5" fill="#E9ECEF" stroke="#CED4DA" strokeWidth="1.5" />
      <rect x="73" y="86" width="11" height="18" rx="5" fill="#E9ECEF" stroke="#CED4DA" strokeWidth="1.5" />
      <ellipse cx="60" cy="72" rx="34" ry="28" fill="#F8F9FA" stroke="#DEE2E6" strokeWidth="2" />
      <path d="M 32 64 C 30 76 44 82 46 72 C 48 64 38 56 32 64 Z" fill="#212529" />
      <circle cx="48" cy="54" r="3.2" fill="#212529" />
      <circle cx="72" cy="54" r="3.2" fill="#212529" />
      <ellipse cx="60" cy="68" rx="16" ry="10" fill="#F8D7DA" stroke="#F1A7B0" strokeWidth="1.2" />
    </g>
  );
}

function SheepBaseSvg() {
  return (
    <g>
      <g fill="#F8F9FA" stroke="#E9ECEF" strokeWidth="1.8">
        <circle cx="60" cy="68" r="26" />
        <circle cx="44" cy="64" r="16" />
        <circle cx="76" cy="64" r="16" />
        <circle cx="60" cy="50" r="15" />
      </g>
      <ellipse cx="60" cy="66" rx="13" ry="16" fill="#495057" />
      <circle cx="54" cy="64" r="2" fill="#FFFFFF" />
      <circle cx="66" cy="64" r="2" fill="#FFFFFF" />
    </g>
  );
}
