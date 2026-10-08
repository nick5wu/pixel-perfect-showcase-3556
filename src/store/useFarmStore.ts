/**
 * ============================================================================
 * UsTwo Ledger - 農場遊戲核心狀態管理 Store (useFarmStore)
 * ============================================================================
 * 
 * 核心架構：
 * 1. 玩家狀態 (Player State)：等級、無上限等級系統、平滑 XP 曲線、金幣、造型幣。
 * 2. 升級與獎勵機制 (Leveling & Rewards)：Lv 1~20 解鎖農場特權/新功能；Lv > 20 獎勵造型幣。
 * 3. 實體與生產鏈 (Plots & Animals)：以現實時間戳記 (Timestamp) 驅動作物生長與動物產出。
 * 4. 倉庫系統 (Inventory)：管理農產品、禽畜產品與資材儲存。
 * 5. 造型外觀與商店 (Cosmetics & Shop)：管理外觀裝扮、部位解鎖與造型幣消費。
 * 6. 本地持久化 (Persistence)：使用 Zustand persist 自動儲存與恢復進度，支援離線時間計算。
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ============================================================================
 * 1. 常數與遊戲配置資料表 (Game Constants & Configurations)
 * ============================================================================ */

/** 作物種類 */
export type CropType = 'wheat' | 'carrot' | 'corn' | 'pumpkin' | 'strawberry';

/** 作物靜態配置 */
export interface CropConfig {
  readonly id: CropType;
  readonly name: string;
  readonly icon: string;
  readonly seedCost: number;       // 種子價格 (金幣)
  readonly sellPrice: number;      // 成品售價 (金幣)
  readonly growDurationMs: number; // 生長時間 (毫秒，例如 1 分鐘 = 60,000)
  readonly harvestYield: number;   // 收成數量
  readonly xpReward: number;       // 收成可獲取的 XP
  readonly unlockLevel: number;    // 解鎖所需農場等級
}

/** 所有作物的基礎數值表 */
export const CROP_CONFIGS: Record<CropType, CropConfig> = {
  wheat: {
    id: 'wheat',
    name: '小麥',
    icon: '🌾',
    seedCost: 5,
    sellPrice: 15,
    growDurationMs: 60 * 1000, // 1 分鐘 (適合快速上手)
    harvestYield: 2,
    xpReward: 15,
    unlockLevel: 1,
  },
  carrot: {
    id: 'carrot',
    name: '胡蘿蔔',
    icon: '🥕',
    seedCost: 12,
    sellPrice: 35,
    growDurationMs: 3 * 60 * 1000, // 3 分鐘
    harvestYield: 2,
    xpReward: 30,
    unlockLevel: 2,
  },
  corn: {
    id: 'corn',
    name: '玉米',
    icon: '🌽',
    seedCost: 25,
    sellPrice: 70,
    growDurationMs: 5 * 60 * 1000, // 5 分鐘
    harvestYield: 2,
    xpReward: 50,
    unlockLevel: 5,
  },
  pumpkin: {
    id: 'pumpkin',
    name: '大南瓜',
    icon: '🎃',
    seedCost: 50,
    sellPrice: 140,
    growDurationMs: 10 * 60 * 1000, // 10 分鐘
    harvestYield: 1,
    xpReward: 90,
    unlockLevel: 8,
  },
  strawberry: {
    id: 'strawberry',
    name: '草莓',
    icon: '🍓',
    seedCost: 90,
    sellPrice: 260,
    growDurationMs: 15 * 60 * 1000, // 15 分鐘
    harvestYield: 3,
    xpReward: 150,
    unlockLevel: 12,
  },
};

/** 動物種類 */
export type AnimalType = 'chicken' | 'cow' | 'sheep';

/** 動物產物種類 */
export type AnimalProductType = 'egg' | 'milk' | 'wool';

/** 動物靜態配置 */
export interface AnimalConfig {
  readonly id: AnimalType;
  readonly name: string;
  readonly icon: string;
  readonly buyCost: number;           // 購買費用 (金幣)
  readonly feedCost: number;          // 單次餵食費用 (金幣)
  readonly produceDurationMs: number; // 生產週期 (毫秒)
  readonly productType: AnimalProductType;
  readonly productName: string;
  readonly productYield: number;      // 每次產量
  readonly productSellPrice: number;  // 產物出售單價
  readonly xpReward: number;          // 收集時獲取的 XP
  readonly unlockLevel: number;       // 解鎖所需農場等級
}

/** 所有動物的基礎數值表 */
export const ANIMAL_CONFIGS: Record<AnimalType, AnimalConfig> = {
  chicken: {
    id: 'chicken',
    name: '母雞',
    icon: '🐔',
    buyCost: 80,
    feedCost: 5,
    produceDurationMs: 2 * 60 * 1000, // 2 分鐘產蛋
    productType: 'egg',
    productName: '雞蛋',
    productYield: 2,
    productSellPrice: 20,
    xpReward: 25,
    unlockLevel: 3,
  },
  cow: {
    id: 'cow',
    name: '乳牛',
    icon: '🐮',
    buyCost: 250,
    feedCost: 15,
    produceDurationMs: 5 * 60 * 1000, // 5 分鐘產奶
    productType: 'milk',
    productName: '牛奶',
    productYield: 2,
    productSellPrice: 55,
    xpReward: 60,
    unlockLevel: 5,
  },
  sheep: {
    id: 'sheep',
    name: '綿羊',
    icon: '🐑',
    buyCost: 500,
    feedCost: 30,
    produceDurationMs: 8 * 60 * 1000, // 8 分鐘產羊毛
    productType: 'wool',
    productName: '羊毛',
    productYield: 1,
    productSellPrice: 120,
    xpReward: 100,
    unlockLevel: 7,
  },
};

/** 等級 1 ~ 20 的解鎖功能項目 */
export interface LevelFeatureUnlock {
  readonly level: number;
  readonly featureId: string;
  readonly title: string;
  readonly description: string;
  readonly bonusCoins?: number; // 升級額外贈送金幣
}

/** 1~20 級功能解鎖清單 */
export const LEVEL_FEATURES: readonly LevelFeatureUnlock[] = [
  { level: 1, featureId: 'crop-wheat', title: '小麥種植', description: '解鎖小麥種子與初始農田' },
  { level: 2, featureId: 'crop-carrot', title: '胡蘿蔔種植', description: '解鎖甜脆胡蘿蔔，可獲取更高回報' },
  { level: 3, featureId: 'animal-chicken', title: '咕咕雞舍', description: '解鎖母雞飼養與雞蛋生產' },
  { level: 4, featureId: 'plot-expand-1', title: '土地擴建 I', description: '解鎖開墾第 2 塊農地權限', bonusCoins: 50 },
  { level: 5, featureId: 'animal-cow', title: '溫馨牛棚與玉米', description: '解鎖乳牛飼養（產牛奶）及玉米種植', bonusCoins: 80 },
  { level: 6, featureId: 'plot-expand-2', title: '土地擴建 II', description: '解鎖開墾第 3 塊農地權限', bonusCoins: 100 },
  { level: 7, featureId: 'animal-sheep', title: '柔軟羊圈', description: '解鎖綿羊飼養（產羊毛）' },
  { level: 8, featureId: 'crop-pumpkin', title: '萬聖大南瓜', description: '解鎖高價值大南瓜種植' },
  { level: 9, featureId: 'plot-expand-3', title: '土地擴建 III', description: '解鎖開墾第 4 塊農地權限', bonusCoins: 150 },
  { level: 10, featureId: 'cart-stand', title: '農夫小推車外觀', description: '解鎖小推車站點與每日訂單加成', bonusCoins: 200 },
  { level: 11, featureId: 'fertilizer-boost', title: '高效有機肥料', description: '解鎖肥料商店，作物生長提速 20%' },
  { level: 12, featureId: 'crop-strawberry', title: '頂級草莓園', description: '解鎖鮮美草莓種植' },
  { level: 13, featureId: 'plot-expand-4', title: '土地擴建 IV', description: '解鎖開墾第 5 塊農地權限', bonusCoins: 250 },
  { level: 14, featureId: 'beehive', title: '甜蜜蜂箱設施', description: '在農場邊緣引進蜜蜂，提高鄰近作物收益' },
  { level: 15, featureId: 'auto-sprinkler', title: '自動灑水外觀', description: '解鎖蒸氣龐克風格灑水器造型' },
  { level: 16, featureId: 'plot-expand-5', title: '土地擴建 V', description: '解鎖開墾第 6 塊農地權限', bonusCoins: 300 },
  { level: 17, featureId: 'silo-upgrade', title: '穀倉大型擴建', description: '提升倉庫堆疊上限與保鮮特效' },
  { level: 18, featureId: 'windmill-building', title: '古典風車磨坊', description: '農場景觀新增旋轉風車' },
  { level: 19, featureId: 'stone-path', title: '精緻鵝卵石道', description: '解鎖莊園石板鋪路地磚風格' },
  { level: 20, featureId: 'legendary-estate', title: '傳奇莊園主', description: '完成基礎農場修煉！解鎖玻璃溫室外觀，此後每級皆贈 5 造型幣！', bonusCoins: 500 },
];

/** 造型部位類別 */
export type SkinCategory = 'house' | 'fieldBorder' | 'scarecrow' | 'animalStyle' | 'head' | 'neck';

/** 造型定義項目 */
export interface SkinItem {
  readonly id: string;
  readonly name: string;
  readonly category: SkinCategory;
  readonly description: string;
  readonly price: number;
  readonly currency: 'coins' | 'styleTickets';
  readonly previewIcon: string;
}

/** 造型清單 (用於商店購買與預覽) */
export const AVAILABLE_SKINS: readonly SkinItem[] = [
  // 房屋外觀
  {
    id: 'house-default',
    name: '原木鄉村木屋',
    category: 'house',
    description: '最初溫暖的鄉間小木屋',
    price: 0,
    currency: 'coins',
    previewIcon: '🏡',
  },
  {
    id: 'house-japanese',
    name: '和風日式竹屋',
    category: 'house',
    description: '帶有枯山水風格與紙門屋簷的和式小屋',
    price: 15,
    currency: 'styleTickets',
    previewIcon: '🏯',
  },
  {
    id: 'house-european',
    name: '童話歐風石莊',
    category: 'house',
    description: '被攀藤玫瑰包圍的典雅石造別墅',
    price: 25,
    currency: 'styleTickets',
    previewIcon: '🏰',
  },
  // 圍籬外觀
  {
    id: 'fence-wood',
    name: '質樸木圍籬',
    category: 'fieldBorder',
    description: '經典原木農莊圍欄',
    price: 0,
    currency: 'coins',
    previewIcon: '🪵',
  },
  {
    id: 'fence-stone',
    name: '英式砌石矮牆',
    category: 'fieldBorder',
    description: '穩重厚實的灰色鵝卵石牆',
    price: 10,
    currency: 'styleTickets',
    previewIcon: '🧱',
  },
  {
    id: 'fence-flower',
    name: '櫻花藤蔓花籬',
    category: 'fieldBorder',
    description: '隨風飄落粉嫩花瓣的生機花籬',
    price: 15,
    currency: 'styleTickets',
    previewIcon: '🌸',
  },
  // 稻草人造型
  {
    id: 'scarecrow-default',
    name: '憨厚草帽阿吉',
    category: 'scarecrow',
    description: '默默守護農田的忠誠稻草人',
    price: 0,
    currency: 'coins',
    previewIcon: '🌾',
  },
  {
    id: 'scarecrow-wizard',
    name: '魔法大師稻草人',
    category: 'scarecrow',
    description: '手持發光法杖、戴著神秘巫師帽',
    price: 12,
    currency: 'styleTickets',
    previewIcon: '🧙‍♂️',
  },
  // 動物特殊外觀
  {
    id: 'cow-golden',
    name: '尊爵黃金乳牛',
    category: 'animalStyle',
    description: '渾身散發閃耀金色光芒的傳奇乳牛',
    price: 30,
    currency: 'styleTickets',
    previewIcon: '✨🐮',
  },
  {
    id: 'chicken-rainbow',
    name: '七彩夢幻小雞',
    category: 'animalStyle',
    description: '擁有彩虹漸層羽毛的元氣小雞',
    price: 20,
    currency: 'styleTickets',
    previewIcon: '🌈🐥',
  },
  // 動物頭部裝備 (Head Slot)
  {
    id: 'straw-hat',
    name: '編織小草帽',
    category: 'head',
    description: '手工編織的遮陽草帽，繫著焦糖紅緞帶',
    price: 0,
    currency: 'coins',
    previewIcon: '👒',
  },
  {
    id: 'flower-crown',
    name: '浪漫野花環',
    category: 'head',
    description: '由新鮮雛菊與幸運草編織而成的芬芳花環',
    price: 10,
    currency: 'styleTickets',
    previewIcon: '🌸',
  },
  // 動物頸部裝備 (Neck Slot)
  {
    id: 'golden-bell',
    name: '幸運金鈴鐺',
    category: 'neck',
    description: '走動時會發出清脆叮噹聲的閃耀金鈴',
    price: 0,
    currency: 'coins',
    previewIcon: '🔔',
  },
  {
    id: 'red-scarf',
    name: '暖心紅圍巾',
    category: 'neck',
    description: '柔軟蓬鬆的羊毛紅圍巾，溫暖整個冬天',
    price: 8,
    currency: 'styleTickets',
    previewIcon: '🧣',
  },
];

/* ============================================================================
 * 2. 經驗值與升級數學模型 (Level Curve Logic)
 * ============================================================================ */

/**
 * 計算指定等級 (level -> level + 1) 所需的 XP
 * 
 * 規則說明：
 * - Lv 1~20 實作平滑升級曲線：
 *   採用冪次漸進公式：Math.round(100 + 900 * Math.pow((level - 1) / 19, 1.25))
 *   • Lv 1 -> Lv 2: 需 100 XP
 *   • Lv 2 -> Lv 3: 需 123 XP
 *   • Lv 5 -> Lv 6: 需 226 XP
 *   • Lv 10 -> Lv 11: 需 443 XP
 *   • Lv 15 -> Lv 16: 需 704 XP
 *   • Lv 19 -> Lv 20: 需 934 XP
 *   • Lv 20 -> Lv 21: 剛好為 1000 XP
 * - Lv 20 以上：固定每級皆需 1000 XP
 */
export function getRequiredXpForLevel(level: number): number {
  if (level <= 1) {
    return 100;
  }
  if (level >= 20) {
    return 1000;
  }
  const ratio = (level - 1) / 19;
  return Math.round(100 + 900 * Math.pow(ratio, 1.25));
}

/* ============================================================================
 * 3. 實體與生產鏈資料結構 (Entities State Types)
 * ============================================================================ */

/** 土地地塊資料結構 */
export interface Plot {
  readonly id: string;
  /** 'empty' 代表尚未播種，其餘為對應的作物 ID */
  type: 'empty' | CropType;
  /** 播種的絕對時間戳記 (毫秒數，例如 Date.now())，若為空地則為 null */
  plantedAt: number | null;
  /** 是否已生長成熟，可供玩家收成 */
  isReady: boolean;
}

/** 動物裝備層插槽配置 */
export interface AnimalEquipment {
  head?: 'straw-hat' | 'flower-crown' | string;
  neck?: 'golden-bell' | 'red-scarf' | string;
}

/** 牧場動物資料結構 */
export interface Animal {
  readonly id: string;
  readonly type: AnimalType;
  /** 上次餵食/產出開始的絕對時間戳記 (毫秒數)，尚未餵食則為 null */
  fedAt: number | null;
  /** 是否已產出完畢，可供玩家收取產品 (雞蛋、牛奶、羊毛) */
  isReadyToProduce: boolean;
  /** 動物插槽式外觀裝備 (如草帽、鈴鐺) */
  equipment?: AnimalEquipment;
}

/** 倉庫物資儲存 (記錄農作物、禽畜產物、資材等數量) */
export type Inventory = Record<string, number>;

/** 裝備中的造型 mapping (部位 key -> 造型 ID) */
export type EquippedSkins = Record<SkinCategory, string>;

/** 升級事件回饋結構 */
export interface LevelUpReward {
  level: number;
  type: 'feature_unlock' | 'style_tickets';
  ticketsReward?: number;
  feature?: LevelFeatureUnlock;
  message: string;
}

/** addXp 執行後的結果報告 */
export interface AddXpResult {
  levelsGained: number;
  oldLevel: number;
  newLevel: number;
  currentXp: number;
  xpNeededForNext: number;
  rewards: LevelUpReward[];
}

/* ============================================================================
 * 4. FarmStore 狀態與操作方法介面 (State & Actions Interface)
 * ============================================================================ */

export interface FarmState {
  /* --- 1. 玩家基本狀態 --- */
  level: number;             // 當前等級 (無上限，初始為 1)
  xp: number;                // 當前經驗值 (0 ~ 當級所需 XP)
  coins: number;             // 金幣 (用於購買種子、飼料、開墾土地)
  styleTickets: number;      // 造型幣 (用於購買特殊外觀與景觀)
  unlockedFeatures: string[]; // 已解鎖的功能/特權 featureId 陣列

  /* --- 2. 實體與生產鏈狀態 --- */
  plots: Plot[];             // 土地陣列
  animals: Animal[];         // 動物陣列
  inventory: Inventory;      // 倉庫 (作物、牛奶、雞蛋等物資)

  /* --- 3. 造型與商店系統 --- */
  unlockedSkins: string[];   // 已購買/已解鎖的造型 ID 陣列
  equippedSkins: EquippedSkins; // 當前各部位裝備的造型

  /* --- 4. 系統中繼資料 --- */
  lastUpdatedTimestamp: number; // 上次更新/檢查生長時間的絕對時間戳記
}

export interface FarmActions {
  /* --- 等級與經驗值系統 Actions --- */
  /**
   * 增加經驗值，支援一次性獲取巨額 XP 跨級升級。
   * - 若升級後 level <= 20：解鎖新功能並給予對應獎勵
   * - 若升級後 level > 20：每升 1 級給予 5 枚 styleTickets
   */
  addXp: (amount: number) => AddXpResult;

  /** 取得升至下一級所需的經驗值總量 */
  getXpRequiredForNextLevel: () => number;

  /** 取得當前經驗值百分比 (0 ~ 100) */
  getXpPercentage: () => number;

  /* --- 現實時間生長邏輯 Actions --- */
  /**
   * 根據現實時間 Timestamp 全面檢查並更新土地作物與動物產出的成熟狀態。
   * 可傳入指定時間（預設為 Date.now()）。
   */
  updateGrowthState: (currentTime?: number) => void;

  /** 取得特定地塊的生長進度資訊 (百分比、剩餘毫秒數、是否成熟) */
  getPlotGrowthStatus: (
    plotId: string,
    currentTime?: number
  ) => { progressPercent: number; remainingMs: number; isReady: boolean } | null;

  /** 取得特定動物的生產進度資訊 (百分比、剩餘毫秒數、是否可收) */
  getAnimalProduceStatus: (
    animalId: string,
    currentTime?: number
  ) => { progressPercent: number; remainingMs: number; isReadyToProduce: boolean } | null;

  /* --- 農田土地 Actions --- */
  /** 在指定土地播種 (檢查是否為空地、扣除種子金幣、記錄絕對時間戳記) */
  plantCrop: (plotId: string, cropType: CropType, currentTime?: number) => { success: boolean; message: string };

  /** 收成指定地塊成熟的作物 (收割入庫、給予經驗值、重置為空地) */
  harvestPlot: (plotId: string, currentTime?: number) => { success: boolean; cropYield?: number; xpGained?: number; message: string };

  /** 開墾新土地 (需消耗金幣與符合等級條件) */
  expandPlot: () => { success: boolean; message: string };

  /* --- 牧場動物 Actions --- */
  /** 餵食動物 (開始計算生產週期 Timestamp) */
  feedAnimal: (animalId: string, currentTime?: number) => { success: boolean; message: string };

  /** 收取動物副產物 (雞蛋、牛奶、羊毛入庫、給予 XP) */
  collectAnimalProduct: (animalId: string, currentTime?: number) => { success: boolean; productYield?: number; xpGained?: number; message: string };

  /** 購買新動物 (需消耗金幣與符合等級限制) */
  purchaseAnimal: (type: AnimalType) => { success: boolean; message: string };

  /* --- 倉庫與交易 Actions --- */
  /** 出售倉庫中的農產品/禽畜產品獲取金幣 */
  sellItem: (itemId: string, quantity?: number) => { success: boolean; earnedCoins?: number; message: string };

  /** 手動增加/消耗庫存 (資材擴充用) */
  addInventoryItem: (itemId: string, quantity: number) => void;
  removeInventoryItem: (itemId: string, quantity: number) => boolean;

  /* --- 貨幣 Actions --- */
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addStyleTickets: (amount: number) => void;
  spendStyleTickets: (amount: number) => boolean;

  /* --- 造型與外觀商店 Actions --- */
  /** 購買造型 (檢查貨幣、扣款、加入 unlockedSkins) */
  buySkin: (skinId: string) => { success: boolean; message: string };

  /** 裝備指定部位的造型 (需已解鎖該造型) */
  equipSkin: (category: SkinCategory, skinId: string) => { success: boolean; message: string };

  /** 卸下指定部位的造型 */
  unequipSkin: (category: SkinCategory) => void;

  /** 為指定動物穿戴或卸除插槽外觀 (head / neck) */
  equipAnimal: (animalId: string, slot: 'head' | 'neck', itemId: string) => void;

  /** 重置農場為初始狀態 (用於測試或重新開始) */
  resetFarm: () => void;
}

export type FarmStore = FarmState & FarmActions;

/* ============================================================================
 * 5. 初始狀態預設值 (Default Initial State)
 * ============================================================================ */

const INITIAL_STATE: FarmState = {
  level: 1,
  xp: 0,
  coins: 150,           // 給予新手農夫初始資金
  styleTickets: 0,
  unlockedFeatures: ['crop-wheat'],

  // 初始提供 3 塊農田：1 塊已種植小麥（示範新手體驗），2 塊為空地
  plots: [
    {
      id: 'plot-1',
      type: 'wheat',
      plantedAt: Date.now() - 30 * 1000, // 播種 30 秒前 (剩餘 30 秒即可收成)
      isReady: false,
    },
    {
      id: 'plot-2',
      type: 'empty',
      plantedAt: null,
      isReady: false,
    },
    {
      id: 'plot-3',
      type: 'empty',
      plantedAt: null,
      isReady: false,
    },
  ],

  // 初始提供小雞 (配戴草帽) 與小乳牛 (繫著金鈴鐺)
  animals: [
    {
      id: 'animal-chicken-1',
      type: 'chicken',
      fedAt: Date.now() - 50 * 1000, // 餵食 50 秒前
      isReadyToProduce: false,
      equipment: {
        head: 'straw-hat',
      },
    },
    {
      id: 'animal-cow-1',
      type: 'cow',
      fedAt: Date.now() - 120 * 1000, // 餵食 2 分鐘前
      isReadyToProduce: false,
      equipment: {
        neck: 'golden-bell',
      },
    },
  ],

  // 初始倉庫庫存
  inventory: {
    wheat: 3,
    egg: 1,
  },

  // 預設已解鎖造型
  unlockedSkins: [
    'house-default',
    'fence-wood',
    'scarecrow-default',
    'straw-hat',
    'golden-bell',
  ],

  // 當前裝備的造型
  equippedSkins: {
    house: 'house-default',
    fieldBorder: 'fence-wood',
    scarecrow: 'scarecrow-default',
    animalStyle: '',
    head: '',
    neck: '',
  },

  lastUpdatedTimestamp: Date.now(),
};

/* ============================================================================
 * 6. useFarmStore 具體實作 (Zustand Implementation)
 * ============================================================================ */

export const useFarmStore = create<FarmStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      /* ----------------------------------------------------------------------
       * 等級與經驗值系統
       * ---------------------------------------------------------------------- */

      addXp: (amount: number): AddXpResult => {
        if (amount <= 0) {
          const currentLevel = get().level;
          const currentXp = get().xp;
          return {
            levelsGained: 0,
            oldLevel: currentLevel,
            newLevel: currentLevel,
            currentXp,
            xpNeededForNext: getRequiredXpForLevel(currentLevel),
            rewards: [],
          };
        }

        const oldLevel = get().level;
        let currentLevel = oldLevel;
        let currentXp = get().xp + amount;
        let currentStyleTickets = get().styleTickets;
        let currentCoins = get().coins;
        const currentUnlockedFeatures = [...get().unlockedFeatures];
        const rewards: LevelUpReward[] = [];
        let levelsGained = 0;

        // 支援連續升級邏輯
        while (true) {
          const neededXp = getRequiredXpForLevel(currentLevel);
          if (currentXp >= neededXp) {
            currentXp -= neededXp;
            currentLevel += 1;
            levelsGained += 1;

            if (currentLevel <= 20) {
              // 升級等級 <= 20：解鎖新功能
              const feature = LEVEL_FEATURES.find((f) => f.level === currentLevel);
              if (feature) {
                if (!currentUnlockedFeatures.includes(feature.featureId)) {
                  currentUnlockedFeatures.push(feature.featureId);
                }
                if (feature.bonusCoins && feature.bonusCoins > 0) {
                  currentCoins += feature.bonusCoins;
                }
                rewards.push({
                  level: currentLevel,
                  type: 'feature_unlock',
                  feature,
                  message: `🎉 升至 Lv.${currentLevel}！解鎖新功能：【${feature.title}】（${feature.description}）`,
                });
              } else {
                rewards.push({
                  level: currentLevel,
                  type: 'feature_unlock',
                  message: `🎉 升至 Lv.${currentLevel}！農場生產效率進一步提升！`,
                });
              }
            } else {
              // 升級等級 > 20：固定獎勵 5 枚造型幣
              const TICKET_REWARD = 5;
              currentStyleTickets += TICKET_REWARD;
              rewards.push({
                level: currentLevel,
                type: 'style_tickets',
                ticketsReward: TICKET_REWARD,
                message: `✨ 升至 Lv.${currentLevel}！榮獲 ${TICKET_REWARD} 枚造型幣！可在外觀商店兌換限定風格！`,
              });
            }
          } else {
            break;
          }
        }

        set({
          level: currentLevel,
          xp: currentXp,
          coins: currentCoins,
          styleTickets: currentStyleTickets,
          unlockedFeatures: currentUnlockedFeatures,
        });

        return {
          levelsGained,
          oldLevel,
          newLevel: currentLevel,
          currentXp,
          xpNeededForNext: getRequiredXpForLevel(currentLevel),
          rewards,
        };
      },

      getXpRequiredForNextLevel: () => {
        return getRequiredXpForLevel(get().level);
      },

      getXpPercentage: () => {
        const { level, xp } = get();
        const required = getRequiredXpForLevel(level);
        if (required <= 0) return 100;
        return Math.min(100, Math.floor((xp / required) * 100));
      },

      /* ----------------------------------------------------------------------
       * 現實時間 Timestamp 生長計算
       * ---------------------------------------------------------------------- */

      updateGrowthState: (currentTime = Date.now()) => {
        const { plots, animals } = get();
        let plotsChanged = false;
        let animalsChanged = false;

        // 1. 檢查所有土地作物的生長狀態
        const updatedPlots = plots.map((plot) => {
          if (plot.type === 'empty' || plot.plantedAt === null || plot.isReady) {
            return plot;
          }
          const cropConfig = CROP_CONFIGS[plot.type];
          if (!cropConfig) return plot;

          const elapsedMs = currentTime - plot.plantedAt;
          if (elapsedMs >= cropConfig.growDurationMs) {
            plotsChanged = true;
            return {
              ...plot,
              isReady: true,
            };
          }
          return plot;
        });

        // 2. 檢查所有牧場動物的生產狀態
        const updatedAnimals = animals.map((animal) => {
          if (animal.fedAt === null || animal.isReadyToProduce) {
            return animal;
          }
          const animalConfig = ANIMAL_CONFIGS[animal.type];
          if (!animalConfig) return animal;

          const elapsedMs = currentTime - animal.fedAt;
          if (elapsedMs >= animalConfig.produceDurationMs) {
            animalsChanged = true;
            return {
              ...animal,
              isReadyToProduce: true,
            };
          }
          return animal;
        });

        if (plotsChanged || animalsChanged) {
          set({
            plots: updatedPlots,
            animals: updatedAnimals,
            lastUpdatedTimestamp: currentTime,
          });
        }
      },

      getPlotGrowthStatus: (plotId: string, currentTime = Date.now()) => {
        const plot = get().plots.find((p) => p.id === plotId);
        if (!plot || plot.type === 'empty' || plot.plantedAt === null) {
          return null;
        }

        if (plot.isReady) {
          return { progressPercent: 100, remainingMs: 0, isReady: true };
        }

        const cropConfig = CROP_CONFIGS[plot.type];
        if (!cropConfig) {
          return { progressPercent: 100, remainingMs: 0, isReady: true };
        }

        const elapsed = Math.max(0, currentTime - plot.plantedAt);
        const duration = cropConfig.growDurationMs;

        if (elapsed >= duration) {
          return { progressPercent: 100, remainingMs: 0, isReady: true };
        }

        const remainingMs = duration - elapsed;
        const progressPercent = Math.min(99, Math.floor((elapsed / duration) * 100));

        return { progressPercent, remainingMs, isReady: false };
      },

      getAnimalProduceStatus: (animalId: string, currentTime = Date.now()) => {
        const animal = get().animals.find((a) => a.id === animalId);
        if (!animal || animal.fedAt === null) {
          return null;
        }

        if (animal.isReadyToProduce) {
          return { progressPercent: 100, remainingMs: 0, isReadyToProduce: true };
        }

        const animalConfig = ANIMAL_CONFIGS[animal.type];
        if (!animalConfig) {
          return { progressPercent: 100, remainingMs: 0, isReadyToProduce: true };
        }

        const elapsed = Math.max(0, currentTime - animal.fedAt);
        const duration = animalConfig.produceDurationMs;

        if (elapsed >= duration) {
          return { progressPercent: 100, remainingMs: 0, isReadyToProduce: true };
        }

        const remainingMs = duration - elapsed;
        const progressPercent = Math.min(99, Math.floor((elapsed / duration) * 100));

        return { progressPercent, remainingMs, isReadyToProduce: false };
      },

      /* ----------------------------------------------------------------------
       * 農田土地 Actions
       * ---------------------------------------------------------------------- */

      plantCrop: (plotId: string, cropType: CropType, currentTime = Date.now()) => {
        const { plots, coins, level } = get();
        const plotIndex = plots.findIndex((p) => p.id === plotId);

        if (plotIndex === -1) {
          return { success: false, message: '找不到該塊農地' };
        }

        const targetPlot = plots[plotIndex];
        if (!targetPlot || targetPlot.type !== 'empty') {
          return { success: false, message: '此農地已有作物在生長中' };
        }

        const config = CROP_CONFIGS[cropType];
        if (!config) {
          return { success: false, message: '未知的作物種類' };
        }

        if (level < config.unlockLevel) {
          return { success: false, message: `農場等級未達 Lv.${config.unlockLevel}，尚未解鎖此種子` };
        }

        if (coins < config.seedCost) {
          return { success: false, message: `金幣不足！購買 ${config.name} 種子需 ${config.seedCost} 金幣` };
        }

        // 扣除種子金幣並播種
        const newPlots = [...plots];
        newPlots[plotIndex] = {
          ...targetPlot,
          type: cropType,
          plantedAt: currentTime,
          isReady: false,
        };

        set({
          coins: coins - config.seedCost,
          plots: newPlots,
        });

        return { success: true, message: `成功播種 ${config.name}！預計 ${Math.round(config.growDurationMs / 1000)} 秒後成熟` };
      },

      harvestPlot: (plotId: string, currentTime = Date.now()) => {
        const { plots, inventory } = get();
        const plotIndex = plots.findIndex((p) => p.id === plotId);

        if (plotIndex === -1) {
          return { success: false, message: '找不到該塊農地' };
        }

        const targetPlot = plots[plotIndex];
        if (!targetPlot || targetPlot.type === 'empty') {
          return { success: false, message: '此土地目前為空地' };
        }

        const config = CROP_CONFIGS[targetPlot.type];
        if (!config) {
          return { success: false, message: '作物設定異常' };
        }

        // 驗證是否已成熟 (若經過時間滿足生長時長亦可收成)
        const isMatured =
          targetPlot.isReady ||
          (targetPlot.plantedAt !== null && currentTime - targetPlot.plantedAt >= config.growDurationMs);

        if (!isMatured) {
          return { success: false, message: '作物尚未成熟，請耐心等待！' };
        }

        // 土地重置為空地
        const newPlots = [...plots];
        newPlots[plotIndex] = {
          ...targetPlot,
          type: 'empty',
          plantedAt: null,
          isReady: false,
        };

        // 作物進入倉庫
        const cropId = config.id;
        const currentCount = inventory[cropId] ?? 0;
        const newInventory = {
          ...inventory,
          [cropId]: currentCount + config.harvestYield,
        };

        set({
          plots: newPlots,
          inventory: newInventory,
        });

        // 收割給予 XP
        get().addXp(config.xpReward);

        return {
          success: true,
          cropYield: config.harvestYield,
          xpGained: config.xpReward,
          message: `收成 ${config.name} x${config.harvestYield}！獲得 ${config.xpReward} XP`,
        };
      },

      expandPlot: () => {
        const { plots, level, coins } = get();
        const currentCount = plots.length;

        // 依據農場等級判斷可擁有的土地上限
        // 基礎 3 塊；Lv 4 -> 4 塊；Lv 6 -> 5 塊；Lv 9 -> 6 塊；Lv 13 -> 7 塊；Lv 16 -> 8 塊
        let allowedMaxPlots = 3;
        if (level >= 16) allowedMaxPlots = 8;
        else if (level >= 13) allowedMaxPlots = 7;
        else if (level >= 9) allowedMaxPlots = 6;
        else if (level >= 6) allowedMaxPlots = 5;
        else if (level >= 4) allowedMaxPlots = 4;

        if (currentCount >= allowedMaxPlots) {
          return { success: false, message: `目前等級已達農地開墾上限 (${allowedMaxPlots} 塊)，請提升等級！` };
        }

        // 擴建成本隨著土地數量遞增
        const cost = 100 * (currentCount - 2);
        if (coins < cost) {
          return { success: false, message: `金幣不足！開墾第 ${currentCount + 1} 塊土地需 ${cost} 金幣` };
        }

        const newPlotId = `plot-${currentCount + 1}`;
        const newPlot: Plot = {
          id: newPlotId,
          type: 'empty',
          plantedAt: null,
          isReady: false,
        };

        set({
          coins: coins - cost,
          plots: [...plots, newPlot],
        });

        // 開墾新地給予大量 XP
        get().addXp(50);

        return { success: true, message: `開墾成功！獲得新土地第 ${currentCount + 1} 塊！` };
      },

      /* ----------------------------------------------------------------------
       * 牧場動物 Actions
       * ---------------------------------------------------------------------- */

      feedAnimal: (animalId: string, currentTime = Date.now()) => {
        const { animals, coins } = get();
        const animalIndex = animals.findIndex((a) => a.id === animalId);

        if (animalIndex === -1) {
          return { success: false, message: '找不到該動物' };
        }

        const targetAnimal = animals[animalIndex];
        if (!targetAnimal) {
          return { success: false, message: '動物狀態異常' };
        }

        if (targetAnimal.isReadyToProduce) {
          return { success: false, message: '產物已就緒，請先收取再進行餵食！' };
        }

        const config = ANIMAL_CONFIGS[targetAnimal.type];
        if (!config) {
          return { success: false, message: '未知的動物種類' };
        }

        // 正在生產中檢查
        if (
          targetAnimal.fedAt !== null &&
          currentTime - targetAnimal.fedAt < config.produceDurationMs
        ) {
          return { success: false, message: `${config.name} 正在開心消化與生產中！` };
        }

        if (coins < config.feedCost) {
          return { success: false, message: `金幣不足！購買 ${config.name} 飼料需 ${config.feedCost} 金幣` };
        }

        const newAnimals = [...animals];
        newAnimals[animalIndex] = {
          ...targetAnimal,
          fedAt: currentTime,
          isReadyToProduce: false,
        };

        set({
          coins: coins - config.feedCost,
          animals: newAnimals,
        });

        return { success: true, message: `已餵食 ${config.name}！將於 ${Math.round(config.produceDurationMs / 1000)} 秒後產出 ${config.productName}` };
      },

      collectAnimalProduct: (animalId: string, currentTime = Date.now()) => {
        const { animals, inventory } = get();
        const animalIndex = animals.findIndex((a) => a.id === animalId);

        if (animalIndex === -1) {
          return { success: false, message: '找不到該動物' };
        }

        const targetAnimal = animals[animalIndex];
        if (!targetAnimal) {
          return { success: false, message: '動物資料異常' };
        }

        const config = ANIMAL_CONFIGS[targetAnimal.type];
        if (!config) {
          return { success: false, message: '動物設定異常' };
        }

        const isReady =
          targetAnimal.isReadyToProduce ||
          (targetAnimal.fedAt !== null && currentTime - targetAnimal.fedAt >= config.produceDurationMs);

        if (!isReady) {
          return { success: false, message: `${config.name} 尚未產出，請耐心等候！` };
        }

        // 重置動物狀態為待餵食
        const newAnimals = [...animals];
        newAnimals[animalIndex] = {
          ...targetAnimal,
          fedAt: null,
          isReadyToProduce: false,
        };

        // 產物入庫
        const currentCount = inventory[config.productType] ?? 0;
        const newInventory = {
          ...inventory,
          [config.productType]: currentCount + config.productYield,
        };

        set({
          animals: newAnimals,
          inventory: newInventory,
        });

        // 收集獎勵 XP
        get().addXp(config.xpReward);

        return {
          success: true,
          productYield: config.productYield,
          xpGained: config.xpReward,
          message: `收取到 ${config.productName} x${config.productYield}！獲得 ${config.xpReward} XP`,
        };
      },

      purchaseAnimal: (type: AnimalType) => {
        const { animals, coins, level } = get();
        const config = ANIMAL_CONFIGS[type];

        if (!config) {
          return { success: false, message: '無效的動物種類' };
        }

        if (level < config.unlockLevel) {
          return { success: false, message: `農場等級未達 Lv.${config.unlockLevel}，尚未解鎖領養 ${config.name}` };
        }

        if (coins < config.buyCost) {
          return { success: false, message: `金幣不足！領養 ${config.name} 需要 ${config.buyCost} 金幣` };
        }

        const newAnimal: Animal = {
          id: `animal-${type}-${Date.now()}`,
          type,
          fedAt: null,
          isReadyToProduce: false,
        };

        set({
          coins: coins - config.buyCost,
          animals: [...animals, newAnimal],
        });

        get().addXp(config.xpReward);

        return { success: true, message: `成功領養了一隻可愛的【${config.name}】！` };
      },

      /* ----------------------------------------------------------------------
       * 倉庫與物資交易 Actions
       * ---------------------------------------------------------------------- */

      sellItem: (itemId: string, quantity = 1) => {
        const { inventory, coins } = get();
        const available = inventory[itemId] ?? 0;

        if (available < quantity || quantity <= 0) {
          return { success: false, message: '倉庫內該物品數量不足！' };
        }

        // 計算售價 (作物或動物產物)
        let unitPrice = 10;
        const crop = CROP_CONFIGS[itemId as CropType];
        if (crop) {
          unitPrice = crop.sellPrice;
        } else {
          const animalConfig = Object.values(ANIMAL_CONFIGS).find((a) => a.productType === itemId);
          if (animalConfig) {
            unitPrice = animalConfig.productSellPrice;
          }
        }

        const totalEarned = unitPrice * quantity;
        const newCount = available - quantity;
        const newInventory = { ...inventory };

        if (newCount <= 0) {
          delete newInventory[itemId];
        } else {
          newInventory[itemId] = newCount;
        }

        set({
          inventory: newInventory,
          coins: coins + totalEarned,
        });

        return {
          success: true,
          earnedCoins: totalEarned,
          message: `成功出售 ${quantity} 件物資，賺取 ${totalEarned} 金幣！`,
        };
      },

      addInventoryItem: (itemId: string, quantity: number) => {
        if (quantity <= 0) return;
        const { inventory } = get();
        const current = inventory[itemId] ?? 0;
        set({
          inventory: {
            ...inventory,
            [itemId]: current + quantity,
          },
        });
      },

      removeInventoryItem: (itemId: string, quantity: number): boolean => {
        if (quantity <= 0) return true;
        const { inventory } = get();
        const current = inventory[itemId] ?? 0;
        if (current < quantity) return false;

        const newInventory = { ...inventory };
        const updated = current - quantity;
        if (updated <= 0) {
          delete newInventory[itemId];
        } else {
          newInventory[itemId] = updated;
        }

        set({ inventory: newInventory });
        return true;
      },

      /* ----------------------------------------------------------------------
       * 貨幣增減 Actions
       * ---------------------------------------------------------------------- */

      addCoins: (amount: number) => {
        if (amount > 0) {
          set((state) => ({ coins: state.coins + amount }));
        }
      },

      spendCoins: (amount: number): boolean => {
        if (amount <= 0) return true;
        const { coins } = get();
        if (coins < amount) return false;
        set({ coins: coins - amount });
        return true;
      },

      addStyleTickets: (amount: number) => {
        if (amount > 0) {
          set((state) => ({ styleTickets: state.styleTickets + amount }));
        }
      },

      spendStyleTickets: (amount: number): boolean => {
        if (amount <= 0) return true;
        const { styleTickets } = get();
        if (styleTickets < amount) return false;
        set({ styleTickets: styleTickets - amount });
        return true;
      },

      /* ----------------------------------------------------------------------
       * 造型外觀與商店 Actions
       * ---------------------------------------------------------------------- */

      buySkin: (skinId: string) => {
        const { unlockedSkins, coins, styleTickets } = get();

        if (unlockedSkins.includes(skinId)) {
          return { success: false, message: '您已經擁有此造型！' };
        }

        const skin = AVAILABLE_SKINS.find((s) => s.id === skinId);
        if (!skin) {
          return { success: false, message: '造型商品不存在' };
        }

        // 依貨幣類型檢查餘額並扣除
        if (skin.currency === 'coins') {
          if (coins < skin.price) {
            return { success: false, message: `金幣不足！購買需 ${skin.price} 金幣` };
          }
          set({
            coins: coins - skin.price,
            unlockedSkins: [...unlockedSkins, skinId],
          });
        } else {
          if (styleTickets < skin.price) {
            return { success: false, message: `造型幣不足！購買需 ${skin.price} 枚造型幣` };
          }
          set({
            styleTickets: styleTickets - skin.price,
            unlockedSkins: [...unlockedSkins, skinId],
          });
        }

        return { success: true, message: `恭喜解鎖限定造型：【${skin.name}】！` };
      },

      equipSkin: (category: SkinCategory, skinId: string) => {
        const { unlockedSkins, equippedSkins } = get();

        if (!unlockedSkins.includes(skinId)) {
          return { success: false, message: '尚未解鎖該造型，無法裝備！' };
        }

        const skin = AVAILABLE_SKINS.find((s) => s.id === skinId);
        if (!skin || skin.category !== category) {
          return { success: false, message: '造型分類與部位不相符' };
        }

        set({
          equippedSkins: {
            ...equippedSkins,
            [category]: skinId,
          },
        });

        return { success: true, message: `已成功換上【${skin.name}】外觀！` };
      },

      unequipSkin: (category: SkinCategory) => {
        const { equippedSkins } = get();
        set({
          equippedSkins: {
            ...equippedSkins,
            [category]: '',
          },
        });
      },

      equipAnimal: (animalId: string, slot: 'head' | 'neck', itemId: string) => {
        const { animals } = get();
        const updated = animals.map((a) => {
          if (a.id !== animalId) return a;
          const currentEq = a.equipment || {};
          return {
            ...a,
            equipment: {
              ...currentEq,
              [slot]: itemId || undefined,
            },
          };
        });
        set({ animals: updated });
      },

      /* ----------------------------------------------------------------------
       * 存檔重置 Actions
       * ---------------------------------------------------------------------- */

      resetFarm: () => {
        set({
          ...INITIAL_STATE,
          lastUpdatedTimestamp: Date.now(),
        });
      },
    }),
    {
      name: 'ustwo-farm-storage',
      // 定義持久化白名單
      partialize: (state) => ({
        level: state.level,
        xp: state.xp,
        coins: state.coins,
        styleTickets: state.styleTickets,
        unlockedFeatures: state.unlockedFeatures,
        plots: state.plots,
        animals: state.animals,
        inventory: state.inventory,
        unlockedSkins: state.unlockedSkins,
        equippedSkins: state.equippedSkins,
        lastUpdatedTimestamp: state.lastUpdatedTimestamp,
      }),
    }
  )
);
