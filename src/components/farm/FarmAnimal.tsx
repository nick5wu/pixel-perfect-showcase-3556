import React, { useState, useEffect, useMemo } from "react";
import { Sparkles, Clock, Utensils } from "lucide-react";
import {
  useFarmStore,
  type Animal,
  ANIMAL_CONFIGS,
} from "@/store/useFarmStore";
import { cn } from "@/lib/utils";

export interface FarmAnimalProps {
  animal: Animal;
  /** 當前時間戳記 (由外層定時器傳入，或元件內部自己維護) */
  currentTime?: number | undefined;
  /** 點擊收取產物時的回呼 */
  onCollect?: ((result: { success: boolean; message: string; productYield?: number | undefined; xpGained?: number | undefined }) => void) | undefined;
  className?: string | undefined;
}

/**
 * 格式化剩餘時間 (毫秒 -> mm:ss)
 */
function formatRemainingTime(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * FarmAnimal - 牧場動物元件
 * 
 * 核心特點：
 * 1. 純 SVG 向量繪製黑白乳牛、元氣小雞、軟綿綿羊。
 * 2. 裝備層 (Layering Slots)：支援頭頂 (head: 'straw-hat') 與頸部 (neck: 'golden-bell') 等插槽疊加。
 * 3. 待機呼吸動畫 (animate-farm-breathe) 與就緒晃動 (animate-farm-wiggle)。
 * 4. 現實時間 Timestamp 倒數計算，點擊餵食與收取產出。
 */
export const FarmAnimal: React.FC<FarmAnimalProps> = ({
  animal,
  currentTime: externalTime,
  onCollect,
  className,
}) => {
  const [internalTime, setInternalTime] = useState(Date.now());
  const [isBouncing, setIsBouncing] = useState(false);
  const [floatingFeedback, setFloatingFeedback] = useState<string | null>(null);

  const coins = useFarmStore((state) => state.coins);
  const feedAnimal = useFarmStore((state) => state.feedAnimal);
  const collectAnimalProduct = useFarmStore((state) => state.collectAnimalProduct);
  const getAnimalProduceStatus = useFarmStore((state) => state.getAnimalProduceStatus);

  useEffect(() => {
    if (externalTime !== undefined) return;
    const interval = setInterval(() => {
      setInternalTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [externalTime]);

  const now = externalTime ?? internalTime;
  const config = ANIMAL_CONFIGS[animal.type];

  // 計算生產進度
  const produceStatus = useMemo(() => {
    return getAnimalProduceStatus(animal.id, now);
  }, [getAnimalProduceStatus, animal.id, now, animal.fedAt, animal.isReadyToProduce, animal.type]);

  const isReady = animal.isReadyToProduce || (produceStatus?.isReadyToProduce ?? false);
  const isHungry = animal.fedAt === null && !isReady;
  const isProducing = animal.fedAt !== null && !isReady;

  // 點擊動物互動邏輯
  const handleClick = () => {
    if (isReady) {
      // 收取產物
      setIsBouncing(true);
      const res = collectAnimalProduct(animal.id, now);
      if (res.success) {
        setFloatingFeedback(`+${res.productYield} ${config?.productName}!`);
        setTimeout(() => setFloatingFeedback(null), 1600);
      }
      onCollect?.(res);
      setTimeout(() => setIsBouncing(false), 300);
    } else if (isHungry) {
      // 餵食動物
      if (!config) return;
      if (coins < config.feedCost) {
        alert(`金幣不足！餵食 ${config.name} 需要 ${config.feedCost} 金幣`);
        return;
      }
      feedAnimal(animal.id, now);
      setFloatingFeedback(`餵食成功!`);
      setTimeout(() => setFloatingFeedback(null), 1200);
    }
  };

  return (
    <div className={cn("relative flex flex-col items-center select-none", className)}>
      {/* 飄浮收成反饋氣泡 */}
      {floatingFeedback && (
        <div className="pointer-events-none absolute -top-8 z-30 animate-farm-badge">
          <div
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black text-white shadow-xl ring-2 ring-white/80"
            style={{ background: "linear-gradient(135deg, var(--caramel), var(--caramel-soft))" }}
          >
            <Sparkles className="h-3.5 w-3.5 fill-current text-amber-200" />
            <span>{floatingFeedback}</span>
          </div>
        </div>
      )}

      {/* 動物主體按鈕 */}
      <button
        onClick={handleClick}
        aria-label={
          isReady
            ? `${config?.name} 已產出 ${config?.productName}，點擊收取`
            : isHungry
            ? `${config?.name} 肚子餓了，點擊餵食`
            : `${config?.name} 正在生產中`
        }
        className={cn(
          "bouncy glass group relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center p-1.5 rounded-[2rem]",
          "border border-white/70 dark:border-white/10 shadow-[var(--shadow-soft)] transition-all",
          isReady && "animate-farm-wiggle border-[var(--caramel)]! shadow-[var(--shadow-pop)] ring-2 ring-[var(--caramel)]/40",
          isBouncing && "scale-105"
        )}
      >
        {/* 純 SVG 動物向量繪製（含裝備插槽層） */}
        <div className="relative h-full w-full">
          <svg
            viewBox="0 0 120 120"
            className="h-full w-full drop-shadow-md animate-farm-breathe"
          >
            {/* 陰影底座 */}
            <ellipse cx="60" cy="104" rx="36" ry="7" fill="#2D6A4F" opacity="0.25" />

            {/* 1. 動物底層 (Base Layer) */}
            {animal.type === "chicken" && <ChickenBaseSvg />}
            {animal.type === "cow" && <CowBaseSvg />}
            {animal.type === "sheep" && <SheepBaseSvg />}

            {/* 2. 裝備層 (Layering Slots) */}
            {/* 頸部插槽 (Neck Slot) */}
            {animal.equipment?.neck === "golden-bell" && (
              <GoldenBellSlot animalType={animal.type} />
            )}
            {animal.equipment?.neck === "red-scarf" && (
              <RedScarfSlot animalType={animal.type} />
            )}

            {/* 頭部插槽 (Head Slot) */}
            {animal.equipment?.head === "straw-hat" && (
              <StrawHatSlot animalType={animal.type} />
            )}
            {animal.equipment?.head === "flower-crown" && (
              <FlowerCrownSlot animalType={animal.type} />
            )}
          </svg>

          {/* 收取氣泡徽章 (浮動在頭頂) */}
          {isReady && (
            <div
              className="pointer-events-none absolute -top-3 inset-x-0 mx-auto flex w-max items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black text-white shadow-lg animate-farm-badge ring-1 ring-white/60"
              style={{ background: "linear-gradient(135deg, var(--caramel), var(--caramel-soft))" }}
            >
              <span role="img" aria-label="產物">
                {animal.type === "chicken" ? "🥚" : animal.type === "cow" ? "🥛" : "🧶"}
              </span>
              <span>收取!</span>
            </div>
          )}

          {/* 飢餓待餵食氣泡 (浮動在頭頂) */}
          {isHungry && (
            <div
              className="pointer-events-none absolute -top-2 inset-x-0 mx-auto flex w-max items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black text-white shadow-md animate-bounce ring-1 ring-white/60"
              style={{ background: "linear-gradient(135deg, var(--caramel), var(--caramel-soft))" }}
            >
              <Utensils className="h-2.5 w-2.5 stroke-[2.5]" />
              <span>點擊餵食</span>
            </div>
          )}
        </div>
      </button>

      {/* 底部生產倒數或提示 */}
      {isProducing && produceStatus && (
        <div className="mt-1.5 flex flex-col items-center gap-1">
          {/* Neumorphic 凹槽進度條 */}
          <div className="neu-inset relative h-2.5 w-20 overflow-hidden rounded-full p-0.5 border border-white/40 dark:border-white/5">
            <div
              className="h-full rounded-full transition-all duration-300 shadow-xs"
              style={{
                width: `${produceStatus.progressPercent}%`,
                background: "linear-gradient(90deg, var(--caramel), var(--caramel-soft))",
              }}
            />
          </div>
          {/* 剩餘時間膠囊 */}
          <div className="glass neu rounded-full flex items-center gap-1 px-2 py-0.5 text-[10px] font-black text-muted-foreground border border-white/60 dark:border-white/10 shadow-xs">
            <Clock className="h-2.5 w-2.5 text-[var(--caramel)]" />
            <span>{formatRemainingTime(produceStatus.remainingMs)}</span>
          </div>
        </div>
      )}

      {/* 飢餓時下方餵食成本標籤 */}
      {isHungry && config && (
        <div className="glass neu rounded-full mt-1 flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black text-[var(--caramel)] border border-white/60 dark:border-white/10 shadow-xs">
          <span>🪙 {config.feedCost} 金幣</span>
        </div>
      )}

      {/* 收取完畢時下方名稱標籤 */}
      {isReady && config && (
        <span className="mt-1 text-[11px] font-black text-[var(--caramel)]">
          產出：{config.productName}
        </span>
      )}
    </div>
  );
};

/* ============================================================================
 * 動物底層純 SVG 向量圖形 (Base Animals)
 * ============================================================================ */

/** 元氣小雞底層 (Chicken Base) */
export function ChickenBaseSvg() {
  return (
    <g id="chicken-base">
      {/* 雙腿與小爪爪 */}
      <line x1="50" y1="96" x2="48" y2="105" stroke="#F4A261" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="70" y1="96" x2="72" y2="105" stroke="#F4A261" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 44 105 L 52 105 M 68 105 L 76 105" stroke="#F4A261" strokeWidth="2" strokeLinecap="round" />

      {/* 圓滾滾身軀 */}
      <ellipse cx="60" cy="74" rx="28" ry="26" fill="#FFFDF0" stroke="#E9C46A" strokeWidth="2" />

      {/* 鮮紅小雞冠 */}
      <path
        d="M 54 48 C 50 38 60 36 60 48 C 64 36 74 38 70 48 Z"
        fill="#E76F51"
      />

      {/* 圓圓大眼睛 (帶有眼神光) */}
      <circle cx="50" cy="66" r="3.5" fill="#264653" />
      <circle cx="49" cy="64.5" r="1.2" fill="#FFFFFF" />
      <circle cx="70" cy="66" r="3.5" fill="#264653" />
      <circle cx="69" cy="64.5" r="1.2" fill="#FFFFFF" />

      {/* 嫩黃小腮紅 */}
      <ellipse cx="43" cy="73" rx="4" ry="2" fill="#F4A261" opacity="0.6" />
      <ellipse cx="77" cy="73" rx="4" ry="2" fill="#F4A261" opacity="0.6" />

      {/* 橘色小尖嘴 */}
      <polygon points="56,71 64,71 60,77" fill="#F4A261" stroke="#E76F51" strokeWidth="1" />

      {/* 兩側可愛小翅膀 */}
      <path
        d="M 33 72 C 30 80 34 86 40 84 C 36 78 35 72 33 72 Z"
        fill="#FFF9D2"
        stroke="#E9C46A"
        strokeWidth="1.5"
      />
      <path
        d="M 87 72 C 90 80 86 86 80 84 C 84 78 85 72 87 72 Z"
        fill="#FFF9D2"
        stroke="#E9C46A"
        strokeWidth="1.5"
      />
    </g>
  );
}

/** 溫和黑白乳牛底層 (Cow Base) */
export function CowBaseSvg() {
  return (
    <g id="cow-base">
      {/* 四條粗粗小短腿 */}
      <rect x="36" y="86" width="11" height="18" rx="5" fill="#E9ECEF" stroke="#CED4DA" strokeWidth="1.5" />
      <rect x="36" y="98" width="11" height="6" rx="2" fill="#495057" />
      <rect x="73" y="86" width="11" height="18" rx="5" fill="#E9ECEF" stroke="#CED4DA" strokeWidth="1.5" />
      <rect x="73" y="98" width="11" height="6" rx="2" fill="#495057" />

      {/* 圓潤飽滿牛身軀 */}
      <ellipse cx="60" cy="72" rx="34" ry="28" fill="#F8F9FA" stroke="#DEE2E6" strokeWidth="2" />

      {/* 黑色乳牛花斑 (左、右與背部斑塊) */}
      <path
        d="M 32 64 C 30 76 44 82 46 72 C 48 64 38 56 32 64 Z"
        fill="#212529"
      />
      <path
        d="M 76 60 C 88 64 86 80 78 78 C 72 74 72 62 76 60 Z"
        fill="#212529"
      />
      <path
        d="M 52 48 C 58 44 64 48 62 54 C 54 56 50 50 52 48 Z"
        fill="#212529"
      />

      {/* 身後翹起的小牛尾巴 */}
      <path d="M 92 76 Q 102 74 100 84" stroke="#CED4DA" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="100" cy="85" r="2.5" fill="#212529" />

      {/* 雙耳 */}
      <ellipse cx="32" cy="46" rx="9" ry="5" fill="#F8F9FA" stroke="#DEE2E6" strokeWidth="1.5" transform="rotate(-20 32 46)" />
      <ellipse cx="32" cy="46" rx="5" ry="2.5" fill="#F8D7DA" transform="rotate(-20 32 46)" />
      <ellipse cx="88" cy="46" rx="9" ry="5" fill="#F8F9FA" stroke="#DEE2E6" strokeWidth="1.5" transform="rotate(20 88 46)" />
      <ellipse cx="88" cy="46" rx="5" ry="2.5" fill="#F8D7DA" transform="rotate(20 88 46)" />

      {/* 米黃小牛角 */}
      <path d="M 44 42 Q 40 32 46 32 Q 48 38 46 42 Z" fill="#FFE8D6" stroke="#DDB892" strokeWidth="1" />
      <path d="M 76 42 Q 80 32 74 32 Q 72 38 74 42 Z" fill="#FFE8D6" stroke="#DDB892" strokeWidth="1" />

      {/* 牛頭大眼睛 */}
      <circle cx="48" cy="54" r="3.2" fill="#212529" />
      <circle cx="47" cy="53" r="1.1" fill="#FFFFFF" />
      <circle cx="72" cy="54" r="3.2" fill="#212529" />
      <circle cx="71" cy="53" r="1.1" fill="#FFFFFF" />

      {/* 粉嫩橢圓口鼻處 */}
      <ellipse cx="60" cy="68" rx="16" ry="10" fill="#F8D7DA" stroke="#F1A7B0" strokeWidth="1.2" />
      {/* 兩個小鼻孔 */}
      <ellipse cx="54" cy="68" rx="2.2" ry="3" fill="#D6336C" opacity="0.6" />
      <ellipse cx="66" cy="68" rx="2.2" ry="3" fill="#D6336C" opacity="0.6" />
    </g>
  );
}

/** 蓬鬆雲朵綿羊底層 (Sheep Base) */
export function SheepBaseSvg() {
  return (
    <g id="sheep-base">
      {/* 四隻黑色小短腿 */}
      <rect x="40" y="90" width="8" height="15" rx="4" fill="#343A40" />
      <rect x="72" y="90" width="8" height="15" rx="4" fill="#343A40" />

      {/* 蓬鬆綿羊毛球身軀 (雲朵狀圓弧疊合) */}
      <g fill="#F8F9FA" stroke="#E9ECEF" strokeWidth="1.8">
        <circle cx="60" cy="68" r="26" />
        <circle cx="44" cy="64" r="16" />
        <circle cx="76" cy="64" r="16" />
        <circle cx="48" cy="80" r="14" />
        <circle cx="72" cy="80" r="14" />
        <circle cx="60" cy="50" r="15" />
      </g>

      {/* 粉灰小羊臉 (置於羊毛前方) */}
      <ellipse cx="60" cy="66" rx="13" ry="16" fill="#495057" />

      {/* 兩隻下垂小羊耳 */}
      <ellipse cx="44" cy="58" rx="6" ry="3.5" fill="#343A40" transform="rotate(35 44 58)" />
      <ellipse cx="76" cy="58" rx="6" ry="3.5" fill="#343A40" transform="rotate(-35 76 58)" />

      {/* 溫柔小羊眼 */}
      <circle cx="54" cy="64" r="2" fill="#FFFFFF" />
      <circle cx="66" cy="64" r="2" fill="#FFFFFF" />
      <ellipse cx="60" cy="74" rx="2.5" ry="1.5" fill="#CED4DA" />
    </g>
  );
}

/* ============================================================================
 * 裝備插槽層 (Equipment Slot Components)
 * ============================================================================ */

/** 頭部裝備：精緻草帽 (Straw Hat Slot) */
export function StrawHatSlot({ animalType }: { animalType: string }) {
  // 依動物種類精準定位頭頂座標
  const transform =
    animalType === "chicken"
      ? "translate(60, 44) scale(0.85)"
      : animalType === "cow"
      ? "translate(60, 36) scale(0.95)"
      : "translate(60, 45) scale(0.9)";

  return (
    <g transform={transform} id="slot-straw-hat" className="drop-shadow-sm">
      {/* 帽子大帽沿 (微傾斜圓盤) */}
      <ellipse cx="0" cy="0" rx="22" ry="6" fill="#DDA15E" stroke="#BC6C25" strokeWidth="1.2" />

      {/* 帽子圓形頂部 */}
      <path
        d="M -12 -1 C -12 -14 12 -14 12 -1 Z"
        fill="#E9C46A"
        stroke="#BC6C25"
        strokeWidth="1.2"
      />

      {/* 紅色緞帶裝飾 */}
      <path d="M -12 -2 Q 0 -1 12 -2 L 11 0 Q 0 1 -11 0 Z" fill="#E63946" />
      {/* 垂下的緞帶結 */}
      <path d="M 8 -1 L 13 4 L 10 5 Z" fill="#E63946" />
    </g>
  );
}

/** 頭部裝備：浪漫小花環 (Flower Crown Slot) */
export function FlowerCrownSlot({ animalType }: { animalType: string }) {
  const transform =
    animalType === "chicken"
      ? "translate(60, 48) scale(0.8)"
      : "translate(60, 40) scale(0.9)";

  return (
    <g transform={transform} id="slot-flower-crown">
      {/* 綠色枝藤藤圈 */}
      <path d="M -16 0 Q 0 -6 16 0" stroke="#52B788" strokeWidth="2.5" fill="none" />
      {/* 三朵彩色小花 */}
      <circle cx="-10" cy="-2" r="3.5" fill="#FFB703" />
      <circle cx="0" cy="-4" r="4" fill="#FF758F" />
      <circle cx="10" cy="-2" r="3.5" fill="#72EFDD" />
      <circle cx="0" cy="-4" r="1.5" fill="#FFFFFF" />
    </g>
  );
}

/** 頸部裝備：閃耀金鈴鐺 (Golden Bell Slot) */
export function GoldenBellSlot({ animalType }: { animalType: string }) {
  // 精準定位在頸部喉前
  const transform =
    animalType === "chicken"
      ? "translate(60, 84) scale(0.75)"
      : animalType === "cow"
      ? "translate(60, 78) scale(0.95)"
      : "translate(60, 82) scale(0.85)";

  return (
    <g transform={transform} id="slot-golden-bell" className="drop-shadow-sm">
      {/* 紅色繫繩項圈 */}
      <path
        d="M -14 -4 Q 0 2 14 -4"
        stroke="#E63946"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* 金黃色小鈴鐺主體 */}
      <circle cx="0" cy="5" r="6" fill="#FFB703" stroke="#FB8500" strokeWidth="1" />
      {/* 鈴鐺頂環 */}
      <ellipse cx="0" cy="0" rx="2" ry="1.5" fill="#FB8500" />
      {/* 鈴鐺切口與小珠珠 */}
      <line x1="-4" y1="6" x2="4" y2="6" stroke="#D48B02" strokeWidth="1" />
      <circle cx="0" cy="8" r="1.2" fill="#78350F" />
      {/* 鈴鐺高光反射 */}
      <circle cx="-2" cy="3.5" r="1.2" fill="#FFFBEB" />
    </g>
  );
}

/** 頸部裝備：溫暖紅圍巾 (Red Scarf Slot) */
export function RedScarfSlot({ animalType }: { animalType: string }) {
  const transform =
    animalType === "chicken"
      ? "translate(60, 83) scale(0.8)"
      : "translate(60, 78) scale(0.95)";

  return (
    <g transform={transform} id="slot-red-scarf">
      {/* 環頸圍巾 */}
      <ellipse cx="0" cy="0" rx="16" ry="5" fill="#E63946" stroke="#9B2226" strokeWidth="1" />
      {/* 垂下圍巾尾端 */}
      <path d="M 6 0 L 10 14 L 4 14 Z" fill="#E63946" stroke="#9B2226" strokeWidth="1" />
      {/* 流蘇細線 */}
      <line x1="5" y1="14" x2="5" y2="17" stroke="#9B2226" strokeWidth="1" />
      <line x1="7" y1="14" x2="7" y2="17" stroke="#9B2226" strokeWidth="1" />
      <line x1="9" y1="14" x2="9" y2="17" stroke="#9B2226" strokeWidth="1" />
    </g>
  );
}
