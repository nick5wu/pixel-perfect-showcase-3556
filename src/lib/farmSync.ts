/**
 * ============================================================================
 * UsTwo Ledger - 農場雙人雲端即時同步器 (Farm Cloud Realtime Sync)
 * ============================================================================
 * 
 * 解決痛點：
 * 徹底解決「農場只是本機單機版」的核心矛盾。
 * 讓情侶真正「一起看著同一隻動物長大、合力經營同一片農莊、即時看見對方的收成與換裝」。
 */

import { toast } from "sonner";
import { useFarmStore, setFarmChangeListener } from "@/store/useFarmStore";
import { getStoredCouple, saveFarmInCloud, fetchFarmFromCloud } from "./couple";
import { isSupabaseConfigured } from "./supabase";

// 註冊農場本機變更監聽器，自動非同步同步至雲端
setFarmChangeListener((actionText) => {
  syncCurrentFarmToCloud(actionText).catch(console.warn);
});

/**
 * 將當前本機農場進度同步至 Supabase 雲端
 * @param actionText 觸發動作的敘述 (例如："收成了小麥 🌾"、"換上了新草帽 👒")
 */
export async function syncCurrentFarmToCloud(actionText?: string) {
  if (typeof window === "undefined" || !isSupabaseConfigured()) return;

  const { coupleId } = getStoredCouple();
  if (!coupleId) return;

  const activeUser = localStorage.getItem("ustwo:active_user") || "me";
  const farm = useFarmStore.getState();

  const formattedActionText = actionText
    ? `${activeUser === "me" ? "🐻 我" : "🐰 另一半"}${actionText}`
    : undefined;

  await saveFarmInCloud(
    {
      level: farm.level,
      xp: farm.xp,
      coins: farm.coins,
      styleTickets: farm.styleTickets,
      plots: farm.plots,
      animals: farm.animals,
      inventory: farm.inventory,
      unlockedSkins: farm.unlockedSkins,
      equippedSkins: farm.equippedSkins,
    },
    coupleId,
    activeUser,
    formattedActionText,
  );
}

/**
 * 從雲端載入並覆蓋更新本機農場
 * @param coupleId 伴侶房間 ID
 */
export async function syncFarmFromRemote(coupleId: string) {
  if (!isSupabaseConfigured()) return;

  try {
    const remoteFarm = await fetchFarmFromCloud(coupleId);
    if (!remoteFarm) return;

    useFarmStore.getState().setFarmFromRemote({
      level: remoteFarm.level,
      xp: remoteFarm.xp,
      coins: remoteFarm.coins,
      styleTickets: remoteFarm.styleTickets,
      plots: remoteFarm.plots,
      animals: remoteFarm.animals,
      inventory: remoteFarm.inventory,
      unlockedSkins: remoteFarm.unlockedSkins,
      equippedSkins: remoteFarm.equippedSkins,
    });
  } catch (err) {
    console.warn("syncFarmFromRemote failed:", err);
  }
}
