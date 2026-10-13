/**
 * ============================================================================
 * UsTwo Ledger - 遊戲化激勵閉環橋接器 (Gamification Bridge)
 * ============================================================================
 * 
 * 解決痛點：
 * 徹底打破記帳與農場的「平行宇宙」，將真實世界的自律記帳與存錢行為，
 * 轉化為虛擬小窩農場的成長養分：
 * 
 * 1. 【每日首筆記帳甘霖】：
 *    每天完成第 1 筆記帳 ➜ 召喚「甘霖泉水」（所有農作物與動物加速 30 分鐘）+ 60 XP + 20 金幣。
 * 2. 【自律小農持續激勵】：
 *    當日第 2~5 筆記帳 ➜ 每次獲得 15 XP + 5 金幣（每日上限 5 筆，防止隨意刷單）。
 * 3. 【存錢夢想基金獎勵】：
 *    每次為存錢目標儲蓄 ➜ 獲得 20 XP + 10 金幣。
 *    目標達成圓夢時刻 ➜ 獎勵 5 枚「造型幣」+ 100 XP，用於換裝工坊裝扮小窩與動物！
 */

import { toast } from "sonner";
import { useFarmStore } from "@/store/useFarmStore";
import { toKey, type Txn, type Goal } from "@/lib/ustwo";

const LS_PREFIX = "ustwo:gamify_txns_";

function getTodayKey(): string {
  return toKey(new Date());
}

/**
 * 取得今日已獲取遊戲化獎勵的記帳次數
 */
export function getDailyGamifiedCount(): number {
  if (typeof window === "undefined") return 0;
  const countStr = localStorage.getItem(`${LS_PREFIX}${getTodayKey()}`);
  return countStr ? parseInt(countStr, 10) : 0;
}

/**
 * 檢查今日是否已領取首筆記帳甘霖
 */
export function hasClaimedDailyRain(): boolean {
  return getDailyGamifiedCount() > 0;
}

/**
 * 觸發記帳獎勵閉環
 * @param txn 新增的記帳資料
 */
export function triggerTxnGamification(txn: Omit<Txn, "id"> | Txn) {
  if (typeof window === "undefined") return;

  const today = getTodayKey();
  const storageKey = `${LS_PREFIX}${today}`;
  const currentCount = getDailyGamifiedCount();
  const farm = useFarmStore.getState();

  // 1. 每日第一筆記帳：甘霖降臨 + 大量獎勵
  if (currentCount === 0) {
    const boostDurationMs = 30 * 60 * 1000; // 30 分鐘加速
    const boostResult = farm.applyGrowthBoost(boostDurationMs);
    const xpResult = farm.addXp(60);
    farm.addCoins(20);

    localStorage.setItem(storageKey, "1");

    toast.success("🌱 記帳甘霖降臨！", {
      description: `農場生長加速 30 分鐘！獲得 +60 XP 與 +20 金幣 🪙${
        boostResult.plotsBoosted + boostResult.animalsBoosted > 0
          ? ` (${boostResult.plotsBoosted} 塊田地與 ${boostResult.animalsBoosted} 隻動物已加速)`
          : ""
      }`,
      duration: 4500,
    });

    if (xpResult.levelsGained > 0) {
      toast.success(`🎉 小窩農場升級到 Lv.${xpResult.newLevel}！`, {
        duration: 4000,
      });
    }
    return;
  }

  // 2. 當日第 2~5 筆記帳：持續激勵小獎勵
  if (currentCount < 5) {
    const xpResult = farm.addXp(15);
    farm.addCoins(5);

    const nextCount = currentCount + 1;
    localStorage.setItem(storageKey, String(nextCount));

    toast.success("🌾 勤奮記帳！", {
      description: `小窩農場獲得 +15 XP 與 +5 金幣 🪙 (今日獎勵 ${nextCount}/5)`,
      duration: 3000,
    });

    if (xpResult.levelsGained > 0) {
      toast.success(`🎉 小窩農場升級到 Lv.${xpResult.newLevel}！`, {
        duration: 4000,
      });
    }
    return;
  }

  // 超過 5 筆不重複發放遊戲幣，維持遊戲數值平衡
}

/**
 * 觸發存錢目標獎勵閉環
 * @param goal 目標物件
 * @param addedAmount 本次存入金額
 * @param isCompleted 是否因為本次存入而達成目標
 */
export function triggerGoalGamification(goal: Goal, addedAmount: number, isCompleted: boolean) {
  if (typeof window === "undefined") return;

  const farm = useFarmStore.getState();

  if (isCompleted) {
    // 圓夢大獎：5 枚造型幣 + 100 XP
    farm.addStyleTickets(5);
    const xpResult = farm.addXp(100);

    toast.success(`🎉 達成存錢目標「${goal.zh || goal.title}」！`, {
      description: "獲得 5 枚造型換裝幣 👗 與 +100 農場 XP！快去工坊換新裝～",
      duration: 5500,
    });

    if (xpResult.levelsGained > 0) {
      toast.success(`🎉 小窩農場升級到 Lv.${xpResult.newLevel}！`, {
        duration: 4000,
      });
    }
  } else {
    // 一般存錢激勵：+20 XP + 10 金幣
    farm.addCoins(10);
    const xpResult = farm.addXp(20);

    toast.success(`🐖 存入夢想基金！`, {
      description: `為「${goal.zh || goal.title}」存入 NT$${addedAmount}，農場獲得 +20 XP 與 +10 金幣 🪙`,
      duration: 3000,
    });

    if (xpResult.levelsGained > 0) {
      toast.success(`🎉 小窩農場升級到 Lv.${xpResult.newLevel}！`, {
        duration: 4000,
      });
    }
  }
}
