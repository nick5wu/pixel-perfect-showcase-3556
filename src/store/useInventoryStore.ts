import { create } from "zustand";
import { persist } from "zustand/middleware";
import { deletePhotoBlob } from "@/lib/photoStorage";
import { toast } from "sonner";

export type InventoryCategory = "fridge" | "freezer" | "pantry" | "other";

export interface CategoryMeta {
  id: InventoryCategory;
  zh: string;
  icon: string;
  tag: string;
  color: string;
}

export const INVENTORY_CATEGORIES: Record<InventoryCategory, CategoryMeta> = {
  fridge: { id: "fridge", zh: "冷藏保鮮", icon: "❄️", tag: "冷藏", color: "oklch(0.68 0.12 210)" },
  freezer: { id: "freezer", zh: "冷凍庫藏", icon: "🧊", tag: "冷凍", color: "oklch(0.65 0.15 240)" },
  pantry: { id: "pantry", zh: "常溫乾貨", icon: "🥫", tag: "常溫", color: "oklch(0.72 0.14 65)" },
  other: { id: "other", zh: "美妝生活", icon: "🧴", tag: "生活", color: "oklch(0.70 0.14 310)" },
};

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  expiryDate: string; // YYYY-MM-DD
  photoKey?: string | undefined; // IndexedDB URI (e.g. idb://photo_xxx)
  quantity?: string | undefined; // e.g. "1 瓶", "2 包"
  note?: string | undefined;
  isConsumed?: boolean | undefined;
  consumedAt?: string | undefined;
  createdAt: string;
}

/** 計算距離到期日的剩餘天數 (當天為 0，過期為負數) */
export function getDaysUntilExpiry(expiryDate: string): number {
  if (!expiryDate) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = expiryDate.split("-").map(Number);
  if (!y || !m || !d) return 999;

  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export type ExpiryTagStatus = "expired" | "today" | "urgent" | "soon" | "fresh";

export interface ExpiryTagInfo {
  status: ExpiryTagStatus;
  label: string;
  badgeClass: string;
  pulse: boolean;
}

/** 取得生活感燈號標籤 (Traffic Light Tags) */
export function getExpiryTagInfo(daysLeft: number): ExpiryTagInfo {
  if (daysLeft < 0) {
    return {
      status: "expired",
      label: `已過期 ${Math.abs(daysLeft)} 天`,
      badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30",
      pulse: true,
    };
  }
  if (daysLeft === 0) {
    return {
      status: "today",
      label: "今天到期！⚠️",
      badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30",
      pulse: true,
    };
  }
  if (daysLeft <= 3) {
    return {
      status: "urgent",
      label: `⚠️ 即將過期 · 剩 ${daysLeft} 天`,
      badgeClass: "bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30",
      pulse: false,
    };
  }
  if (daysLeft <= 7) {
    return {
      status: "soon",
      label: `剩 ${daysLeft} 天`,
      badgeClass: "bg-orange-500/15 text-orange-800 dark:text-orange-400 border border-orange-500/30",
      pulse: false,
    };
  }
  return {
    status: "fresh",
    label: `新鮮 · 剩 ${daysLeft} 天`,
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
    pulse: false,
  };
}

// 輔助函式：產生相對今天的 YYYY-MM-DD
function getDateStringOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const SEED_INVENTORY: InventoryItem[] = [
  {
    id: "inv_milk",
    name: "瑞穗全脂鮮乳",
    category: "fridge",
    expiryDate: getDateStringOffset(2), // 剩 2 天
    quantity: "1 瓶 (936ml)",
    note: "早餐拿鐵專用，記得先喝完！",
    createdAt: new Date().toISOString(),
  },
  {
    id: "inv_cake",
    name: "巴斯克焦糖乳酪蛋糕",
    category: "fridge",
    expiryDate: getDateStringOffset(1), // 剩 1 天
    quantity: "半顆",
    note: "蓉蓉手作甜點 🍰",
    createdAt: new Date().toISOString(),
  },
  {
    id: "inv_toast",
    name: "手工生吐司",
    category: "fridge",
    expiryDate: getDateStringOffset(-1), // 已過期 1 天測試
    quantity: "2 片",
    note: "看看有沒有發霉，不能吃要丟掉",
    createdAt: new Date().toISOString(),
  },
  {
    id: "inv_chicken",
    name: "好市多嫩雞胸肉",
    category: "freezer",
    expiryDate: getDateStringOffset(18), // 新鮮
    quantity: "3 片",
    note: "健身蛋白質備餐",
    createdAt: new Date().toISOString(),
  },
  {
    id: "inv_ramen",
    name: "日清黑胡椒海鮮杯麵",
    category: "pantry",
    expiryDate: getDateStringOffset(55), // 新鮮
    quantity: "2 碗",
    note: "宵夜儲備糧食 🍜",
    createdAt: new Date().toISOString(),
  },
];

interface InventoryStoreState {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, "id" | "createdAt">) => InventoryItem;
  updateItem: (id: string, patch: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  toggleConsumed: (id: string) => void;
  getExpiringCount: () => number;
}

export const useInventoryStore = create<InventoryStoreState>()(
  persist(
    (set, get) => ({
      items: SEED_INVENTORY,

      addItem: (itemData) => {
        const newItem: InventoryItem = {
          ...itemData,
          id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          items: [newItem, ...state.items],
        }));

        toast.success(`已將「${newItem.name}」加入生活庫存 📦`);
        return newItem;
      },

      updateItem: (id, patch) => {
        set((state) => ({
          items: state.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        }));
        toast.success("已更新庫存項目 ✨");
      },

      deleteItem: (id) => {
        const target = get().items.find((it) => it.id === id);
        if (target?.photoKey && target.photoKey.startsWith("idb://")) {
          // 清理 IndexedDB 離線相片檔案，絕不殘留廢棄二進位數據
          deletePhotoBlob(target.photoKey).catch((err) => {
            console.warn("清理庫存相片失敗:", err);
          });
        }

        set((state) => ({
          items: state.items.filter((it) => it.id !== id),
        }));
        toast.success("已從庫存中移除 🗑️");
      },

      toggleConsumed: (id) => {
        set((state) => ({
          items: state.items.map((it) => {
            if (it.id === id) {
              const nextConsumed = !it.isConsumed;
              return {
                ...it,
                isConsumed: nextConsumed,
                consumedAt: nextConsumed ? new Date().toISOString() : undefined,
              };
            }
            return it;
          }),
        }));
      },

      getExpiringCount: () => {
        const activeItems = get().items.filter((it) => !it.isConsumed);
        return activeItems.filter((it) => {
          const days = getDaysUntilExpiry(it.expiryDate);
          return days <= 3; // <= 3 天或已過期
        }).length;
      },
    }),
    {
      name: "ustwo:inventory_store",
      // LocalStorage 僅儲存輕量文字與 IndexedDB URI，嚴格避免 QuotaExceededError
    }
  )
);
