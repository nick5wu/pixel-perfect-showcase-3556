import React, { useState, useEffect, useMemo } from "react";
import { Sparkles, Plus, Clock, Lock } from "lucide-react";
import {
  useFarmStore,
  type Plot,
  type CropType,
  CROP_CONFIGS,
} from "@/store/useFarmStore";
import { cn } from "@/lib/utils";

export interface CropFieldProps {
  plot: Plot;
  /** 當前時間戳記 (由外層定時器傳入，或元件內部自己維護) */
  currentTime?: number | undefined;
  /** 點擊收成時的回呼 */
  onHarvest?: ((result: { success: boolean; message: string; cropYield?: number | undefined; xpGained?: number | undefined }) => void) | undefined;
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
 * CropField - 單塊農田作物元件
 * 
 * 純 SVG 向量繪製：
 * 1. 空地 (翻土質地、泥壟紋理、播種提示)
 * 2. 生長中 (翠綠小芽、露珠、即時倒數與進度條)
 * 3. 成熟作物 (金黃小麥、胡蘿蔔、玉米、南瓜、草莓)
 * 4. 浮動收成徽章與微彈跳互動
 */
export const CropField: React.FC<CropFieldProps> = ({
  plot,
  currentTime: externalTime,
  onHarvest,
  className,
}) => {
  const [internalTime, setInternalTime] = useState(Date.now());
  const [showSeedPicker, setShowSeedPicker] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [floatingFeedback, setFloatingFeedback] = useState<string | null>(null);

  const level = useFarmStore((state) => state.level);
  const coins = useFarmStore((state) => state.coins);
  const plantCrop = useFarmStore((state) => state.plantCrop);
  const harvestPlot = useFarmStore((state) => state.harvestPlot);
  const getPlotGrowthStatus = useFarmStore((state) => state.getPlotGrowthStatus);

  // 當外層沒有傳入定時器時，內部使用 1 秒更新頻率
  useEffect(() => {
    if (externalTime !== undefined) return;
    const interval = setInterval(() => {
      setInternalTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [externalTime]);

  const now = externalTime ?? internalTime;

  // 計算生長進度
  const growthStatus = useMemo(() => {
    return getPlotGrowthStatus(plot.id, now);
  }, [getPlotGrowthStatus, plot.id, now, plot.plantedAt, plot.isReady, plot.type]);

  const isReady = plot.isReady || (growthStatus?.isReady ?? false);
  const isGrowing = plot.type !== "empty" && !isReady;
  const cropConfig = plot.type !== "empty" ? CROP_CONFIGS[plot.type] : null;

  // 點擊土地行為
  const handlePlotClick = () => {
    if (plot.type === "empty") {
      setShowSeedPicker((prev) => !prev);
      return;
    }

    if (isReady) {
      // 觸發收成
      setIsHarvesting(true);
      const result = harvestPlot(plot.id, now);
      if (result.success) {
        setFloatingFeedback(`+${result.cropYield} ${cropConfig?.name}!`);
        setTimeout(() => setFloatingFeedback(null), 1600);
      }
      onHarvest?.(result);
      setTimeout(() => setIsHarvesting(false), 300);
    }
  };

  // 執行播種
  const handleSelectSeed = (cropType: CropType) => {
    const res = plantCrop(plot.id, cropType, now);
    if (res.success) {
      setShowSeedPicker(false);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className={cn("relative flex flex-col items-center select-none", className)}>
      {/* 飄浮收成反饋氣泡 */}
      {floatingFeedback && (
        <div className="pointer-events-none absolute -top-8 z-20 animate-farm-badge">
          <div className="flex items-center gap-1 rounded-full bg-emerald-500/95 px-3 py-1 text-xs font-black text-white shadow-lg ring-2 ring-white">
            <Sparkles className="h-3 w-3 fill-current text-yellow-300" />
            <span>{floatingFeedback}</span>
          </div>
        </div>
      )}

      {/* 主地塊容器 */}
      <button
        onClick={handlePlotClick}
        aria-label={
          plot.type === "empty"
            ? "空地，點擊播種"
            : isReady
            ? `${cropConfig?.name} 已成熟，點擊收割`
            : `${cropConfig?.name} 生長中`
        }
        className={cn(
          "group relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-3xl p-1",
          "transition-all duration-300 cursor-pointer outline-none focus:outline-none",
          isReady && "animate-farm-wiggle hover:scale-105 active:scale-95",
          isHarvesting && "scale-110",
          !isReady && "hover:brightness-105 active:scale-98"
        )}
      >
        {/* 純 SVG 土地畫布 */}
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full drop-shadow-md transition-transform"
        >
          {/* 定義濾鏡與漸層 */}
          <defs>
            {/* 泥土主體漸層 */}
            <linearGradient id={`soil-grad-${plot.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#9C6644" />
              <stop offset="60%" stopColor="#7F4F24" />
              <stop offset="100%" stopColor="#582F0E" />
            </linearGradient>

            {/* 壟溝深色陰影漸層 */}
            <linearGradient id={`furrow-grad-${plot.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4A2810" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#361C08" stopOpacity="0.9" />
            </linearGradient>

            {/* 土壤邊緣外框發光 (成熟時) */}
            <filter id={`ready-glow-${plot.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#F59E0B" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* 1. 土層底座 (圓角土地塊) */}
          <rect
            x="6"
            y="8"
            width="108"
            height="104"
            rx="22"
            fill={`url(#soil-grad-${plot.id})`}
            stroke={isReady ? "#F59E0B" : "#B07D62"}
            strokeWidth={isReady ? "3.5" : "1.8"}
            filter={isReady ? `url(#ready-glow-${plot.id})` : undefined}
          />

          {/* 2. 翻土壟溝立體紋理 (3 條水平凹槽) */}
          <g opacity="0.65">
            {/* 上壟 */}
            <path
              d="M 18 36 Q 60 40 102 36"
              stroke={`url(#furrow-grad-${plot.id})`}
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 20 38 Q 60 42 100 38"
              stroke="#DDB892"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeOpacity="0.4"
              fill="none"
            />

            {/* 中壟 */}
            <path
              d="M 16 62 Q 60 66 104 62"
              stroke={`url(#furrow-grad-${plot.id})`}
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 18 64 Q 60 68 102 64"
              stroke="#DDB892"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeOpacity="0.4"
              fill="none"
            />

            {/* 下壟 */}
            <path
              d="M 20 88 Q 60 92 100 88"
              stroke={`url(#furrow-grad-${plot.id})`}
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 22 90 Q 60 94 98 90"
              stroke="#DDB892"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeOpacity="0.4"
              fill="none"
            />
          </g>

          {/* 3. 散落小土礫細節 */}
          <circle cx="28" cy="24" r="2" fill="#DDB892" opacity="0.35" />
          <circle cx="86" cy="26" r="2.5" fill="#4A2810" opacity="0.4" />
          <circle cx="34" cy="76" r="2" fill="#DDB892" opacity="0.3" />
          <circle cx="92" cy="78" r="1.8" fill="#4A2810" opacity="0.4" />

          {/* 4. 根據狀態繪製前景內容 */}
          {plot.type === "empty" ? (
            /* --- 空地狀態：顯示播種提示線條與加號 --- */
            <g className="transition-transform group-hover:scale-110" transform-origin="60 60">
              <circle
                cx="60"
                cy="60"
                r="18"
                fill="#EDE0D4"
                fillOpacity="0.15"
                stroke="#EDE0D4"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <path
                d="M 60 52 L 60 68 M 52 60 L 68 60"
                stroke="#EDE0D4"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </g>
          ) : !isReady ? (
            /* --- 生長中狀態：顯示翠綠小雙葉萌芽 --- */
            <g transform="translate(60, 64)">
              {/* 幼苗小土丘 */}
              <ellipse cx="0" cy="8" rx="14" ry="4" fill="#4A2810" opacity="0.5" />

              {/* 綠色小莖 */}
              <path
                d="M 0 8 Q 1 -6 0 -16"
                stroke="#52B788"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* 左側萌芽小葉 */}
              <path
                d="M 0 -10 C -8 -12 -14 -4 -12 2 C -8 4 -2 0 0 -8"
                fill="#74C69D"
                stroke="#40916C"
                strokeWidth="1.2"
              />

              {/* 右側萌芽小葉 */}
              <path
                d="M 0 -13 C 8 -16 15 -8 13 -2 C 9 0 2 -4 0 -11"
                fill="#52B788"
                stroke="#2D6A4F"
                strokeWidth="1.2"
              />

              {/* 葉尖晨露高光 */}
              <circle cx="9" cy="-6" r="1.5" fill="#FFFFFF" opacity="0.9" />
            </g>
          ) : (
            /* --- 成熟作物狀態：根據作物種類繪製完整成熟 SVG --- */
            <g transform="translate(60, 60)">
              {plot.type === "wheat" && <WheatCropSvg />}
              {plot.type === "carrot" && <CarrotCropSvg />}
              {plot.type === "corn" && <CornCropSvg />}
              {plot.type === "pumpkin" && <PumpkinCropSvg />}
              {plot.type === "strawberry" && <StrawberryCropSvg />}
            </g>
          )}
        </svg>

        {/* 成熟時上方浮動的收成驚嘆號 / 徽章 */}
        {isReady && (
          <div className="pointer-events-none absolute -top-3 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[11px] font-black text-white shadow-lg ring-2 ring-white animate-farm-badge">
            <span role="img" aria-label="收成手勢">
              🌾
            </span>
            <span>收成!</span>
          </div>
        )}
      </button>

      {/* 生長中：下方微型進度條與倒數時間 */}
      {isGrowing && growthStatus && (
        <div className="mt-1 flex flex-col items-center gap-0.5">
          {/* 迷你進度條 */}
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-black/15 dark:bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-300"
              style={{ width: `${growthStatus.progressPercent}%` }}
            />
          </div>
          {/* 剩餘時間標籤 */}
          <div className="flex items-center gap-0.5 text-[10px] font-bold text-muted-foreground">
            <Clock className="h-2.5 w-2.5 opacity-70" />
            <span>{formatRemainingTime(growthStatus.remainingMs)}</span>
          </div>
        </div>
      )}

      {/* 空地時：下方標籤 */}
      {plot.type === "empty" && !showSeedPicker && (
        <span className="mt-1 text-[11px] font-semibold text-muted-foreground/80">
          點擊播種
        </span>
      )}

      {/* 播種種子選擇彈窗 (懸浮在田地旁) */}
      {showSeedPicker && (
        <div className="absolute top-full z-40 mt-2 flex w-56 flex-col gap-1.5 rounded-3xl bg-white/95 dark:bg-zinc-900/95 p-3 shadow-xl backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10 pop-in">
          <div className="flex items-center justify-between pb-1 border-b border-border/50">
            <span className="text-xs font-black text-foreground">選擇種子播種</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSeedPicker(false);
              }}
              className="text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
            {Object.values(CROP_CONFIGS).map((crop) => {
              const isLocked = level < crop.unlockLevel;
              const canAfford = coins >= crop.seedCost;

              return (
                <button
                  key={crop.id}
                  disabled={isLocked || !canAfford}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSeed(crop.id);
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-2xl p-2 text-left text-xs transition-all",
                    isLocked || !canAfford
                      ? "opacity-45 cursor-not-allowed bg-muted/30"
                      : "hover:bg-amber-50 dark:hover:bg-amber-950/40 active:scale-98"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{crop.icon}</span>
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-1">
                        {crop.name}
                        {isLocked && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {Math.round(crop.growDurationMs / 1000)}秒 · 獲{crop.harvestYield}個
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={cn(
                        "text-[11px] font-black",
                        canAfford ? "text-amber-600 dark:text-amber-400" : "text-destructive"
                      )}
                    >
                      🪙 {crop.seedCost}
                    </span>
                    {isLocked && (
                      <div className="text-[9px] text-muted-foreground font-semibold">
                        Lv.{crop.unlockLevel}解鎖
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 各種成熟作物的純 SVG 向量圖繪製元件
 * ============================================================================ */

/** 金黃小麥 SVG */
function WheatCropSvg() {
  return (
    <g className="animate-farm-sway" transform-origin="0 25">
      {/* 根部小土丘 */}
      <ellipse cx="0" cy="22" rx="12" ry="3.5" fill="#4A2810" opacity="0.6" />

      {/* 左小麥株 */}
      <path d="M 0 20 Q -8 4 -12 -14" stroke="#DDA15E" strokeWidth="2.5" fill="none" />
      <g transform="translate(-12, -14) rotate(-20)">
        <ellipse cx="0" cy="0" rx="3.5" ry="7" fill="#E9C46A" stroke="#BC6C25" strokeWidth="1" />
        <ellipse cx="0" cy="-6" rx="3" ry="6" fill="#F4A261" stroke="#BC6C25" strokeWidth="1" />
        <line x1="0" y1="-12" x2="-2" y2="-18" stroke="#BC6C25" strokeWidth="1" />
      </g>

      {/* 主麥株 (中央) */}
      <path d="M 0 20 Q 0 0 0 -22" stroke="#DDA15E" strokeWidth="3" fill="none" />
      <g transform="translate(0, -22)">
        <ellipse cx="0" cy="8" rx="4.5" ry="8" fill="#F4A261" stroke="#BC6C25" strokeWidth="1.2" />
        <ellipse cx="0" cy="0" rx="4" ry="7.5" fill="#E9C46A" stroke="#BC6C25" strokeWidth="1.2" />
        <ellipse cx="0" cy="-8" rx="3.5" ry="6.5" fill="#F9C74F" stroke="#BC6C25" strokeWidth="1.2" />
        <line x1="0" y1="-14" x2="0" y2="-24" stroke="#BC6C25" strokeWidth="1.5" />
      </g>

      {/* 右小麥株 */}
      <path d="M 0 20 Q 8 6 14 -12" stroke="#DDA15E" strokeWidth="2.5" fill="none" />
      <g transform="translate(14, -12) rotate(22)">
        <ellipse cx="0" cy="0" rx="3.5" ry="7" fill="#E9C46A" stroke="#BC6C25" strokeWidth="1" />
        <ellipse cx="0" cy="-6" rx="3" ry="6" fill="#F4A261" stroke="#BC6C25" strokeWidth="1" />
        <line x1="0" y1="-12" x2="3" y2="-18" stroke="#BC6C25" strokeWidth="1" />
      </g>
    </g>
  );
}

/** 脆甜胡蘿蔔 SVG */
function CarrotCropSvg() {
  return (
    <g transform-origin="0 18">
      {/* 土面微露出胡蘿蔔頂部 */}
      <ellipse cx="0" cy="18" rx="14" ry="4" fill="#4A2810" opacity="0.6" />

      {/* 胡蘿蔔塊根上截 */}
      <path
        d="M -10 18 C -9 10 9 10 10 18 Z"
        fill="#F77F00"
        stroke="#D62828"
        strokeWidth="1.5"
      />
      {/* 表面細橫條紋 */}
      <line x1="-5" y1="14" x2="2" y2="14" stroke="#D62828" strokeWidth="1" opacity="0.6" />
      <line x1="-3" y1="16" x2="5" y2="16" stroke="#D62828" strokeWidth="1" opacity="0.6" />

      {/* 翠綠羽狀葉冠 */}
      <g transform="translate(0, 11)">
        {/* 左葉 */}
        <path
          d="M 0 0 Q -12 -12 -14 -24 Q -8 -20 -4 -8"
          fill="#52B788"
          stroke="#2D6A4F"
          strokeWidth="1.2"
        />
        {/* 中主葉 */}
        <path
          d="M 0 0 Q -3 -16 0 -30 Q 3 -16 0 0"
          fill="#40916C"
          stroke="#1B4332"
          strokeWidth="1.5"
        />
        {/* 右葉 */}
        <path
          d="M 0 0 Q 12 -10 15 -22 Q 8 -18 3 -7"
          fill="#74C69D"
          stroke="#2D6A4F"
          strokeWidth="1.2"
        />
      </g>
    </g>
  );
}

/** 黃金玉米 SVG */
function CornCropSvg() {
  return (
    <g transform-origin="0 20">
      <ellipse cx="0" cy="22" rx="13" ry="3.5" fill="#4A2810" opacity="0.6" />

      {/* 挺立綠色玉蜀黍株幹 */}
      <path d="M 0 20 L 0 -18" stroke="#52B788" strokeWidth="4" strokeLinecap="round" />

      {/* 左右大葉苞 */}
      <path d="M 0 8 Q -18 4 -22 -6" stroke="#40916C" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 0 2 Q 18 0 24 -10" stroke="#40916C" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* 金黃玉米穗棒 (左斜) */}
      <g transform="translate(-5, 0) rotate(-16)">
        <rect x="-5" y="-14" width="10" height="20" rx="5" fill="#FFB703" stroke="#FB8500" strokeWidth="1.2" />
        {/* 顆粒網紋 */}
        <line x1="-3" y1="-8" x2="3" y2="-8" stroke="#FB8500" strokeWidth="1" />
        <line x1="-4" y1="-3" x2="4" y2="-3" stroke="#FB8500" strokeWidth="1" />
        <line x1="-3" y1="2" x2="3" y2="2" stroke="#FB8500" strokeWidth="1" />
        {/* 苞葉包裹底座 */}
        <path d="M -6 -2 Q 0 8 6 -2 L 3 6 L -3 6 Z" fill="#74C69D" />
        {/* 玉米鬚 */}
        <line x1="0" y1="-14" x2="-2" y2="-20" stroke="#99582A" strokeWidth="1.2" />
      </g>

      {/* 金黃玉米穗棒 (右直立) */}
      <g transform="translate(6, -6) rotate(12)">
        <rect x="-4.5" y="-12" width="9" height="18" rx="4.5" fill="#FFC300" stroke="#FB8500" strokeWidth="1" />
        <line x1="-3" y1="-6" x2="3" y2="-6" stroke="#FB8500" strokeWidth="1" />
        <line x1="-3" y1="-1" x2="3" y2="-1" stroke="#FB8500" strokeWidth="1" />
      </g>
    </g>
  );
}

/** 圓滾滾大南瓜 SVG */
function PumpkinCropSvg() {
  return (
    <g transform-origin="0 15">
      <ellipse cx="0" cy="20" rx="20" ry="4.5" fill="#4A2810" opacity="0.6" />

      {/* 大南瓜本體 (三重瓣瓣疊加) */}
      <g>
        {/* 外側瓣 */}
        <circle cx="-12" cy="6" r="14" fill="#F77F00" stroke="#D62828" strokeWidth="1.2" />
        <circle cx="12" cy="6" r="14" fill="#F77F00" stroke="#D62828" strokeWidth="1.2" />

        {/* 次外側瓣 */}
        <circle cx="-6" cy="4" r="15" fill="#FCBF49" stroke="#E85D04" strokeWidth="1.2" />
        <circle cx="6" cy="4" r="15" fill="#FCBF49" stroke="#E85D04" strokeWidth="1.2" />

        {/* 正中央瓣 */}
        <ellipse cx="0" cy="3" rx="12" ry="16" fill="#F77F00" stroke="#D62828" strokeWidth="1.2" />
      </g>

      {/* 頂部深綠瓜蒂與小卷鬚 */}
      <path
        d="M -3 -12 Q -2 -22 6 -24 Q 2 -20 2 -12 Z"
        fill="#2D6A4F"
        stroke="#1B4332"
        strokeWidth="1.2"
      />
      {/* 卷鬚線條 */}
      <path
        d="M 4 -20 Q 12 -26 14 -18 Q 16 -12 20 -14"
        stroke="#52B788"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

/** 鮮甜草莓 SVG */
function StrawberryCropSvg() {
  return (
    <g transform-origin="0 18">
      <ellipse cx="0" cy="20" rx="14" ry="3.5" fill="#4A2810" opacity="0.6" />

      {/* 草莓葉片叢底 */}
      <ellipse cx="-12" cy="2" rx="7" ry="4" fill="#40916C" transform="rotate(-25 -12 2)" />
      <ellipse cx="12" cy="4" rx="7" ry="4" fill="#40916C" transform="rotate(25 12 4)" />

      {/* 主草莓果實 (倒水滴形) */}
      <path
        d="M -13 0 C -15 14 0 22 0 22 C 0 22 15 14 13 0 C 10 -4 -10 -4 -13 0 Z"
        fill="#E63946"
        stroke="#9B2226"
        strokeWidth="1.5"
      />

      {/* 黃色草莓籽顆粒 */}
      <circle cx="-5" cy="4" r="1" fill="#FEE440" />
      <circle cx="3" cy="5" r="1" fill="#FEE440" />
      <circle cx="-1" cy="9" r="1" fill="#FEE440" />
      <circle cx="-6" cy="13" r="0.9" fill="#FEE440" />
      <circle cx="4" cy="12" r="0.9" fill="#FEE440" />
      <circle cx="0" cy="16" r="0.8" fill="#FEE440" />

      {/* 綠色鋸齒果托星萼 */}
      <path
        d="M 0 -2 L -5 -6 L -2 0 L -8 2 L -1 3 L 0 8 L 2 3 L 8 1 L 2 -1 L 5 -6 Z"
        fill="#52B788"
        stroke="#2D6A4F"
        strokeWidth="0.8"
      />

      {/* 旁邊的小白花 */}
      <g transform="translate(14, -8) scale(0.8)">
        <circle cx="0" cy="0" r="3.5" fill="#FEE440" />
        <circle cx="-4" cy="0" r="2.8" fill="#FFFFFF" />
        <circle cx="4" cy="0" r="2.8" fill="#FFFFFF" />
        <circle cx="0" cy="-4" r="2.8" fill="#FFFFFF" />
        <circle cx="0" cy="4" r="2.8" fill="#FFFFFF" />
      </g>
    </g>
  );
}
