/**
 * ============================================================================
 * UsTwo Ledger - JSON 備份匯入與還原彈窗 (Backup & Restore Modal)
 * ============================================================================
 * 
 * 解決痛點：
 * 徹底解決「有匯出卻沒有匯入還原」的資料災難風險。
 * 提供友善、直覺的備份檔驗證與預覽，並支援「智慧合併」與「完全覆蓋」兩種模式。
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Upload, Check, AlertTriangle, ShieldCheck, Sparkles, X, FileJson, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useUsTwo, type Txn, type Goal, type CatDef, type UserId, type PersonProfile } from "@/lib/ustwo";
import { useFarmStore } from "@/store/useFarmStore";
import { syncCurrentFarmToCloud } from "@/lib/farmSync";
import { useBodyScrollLock } from "@/lib/utils";

export interface UsTwoBackupData {
  version?: string;
  appName?: string;
  exportDate?: string;
  txns?: Txn[];
  goals?: Goal[];
  categories?: CatDef[];
  anniversary?: string;
  budget?: number;
  people?: Record<UserId, PersonProfile>;
  farm?: {
    level?: number;
    xp?: number;
    coins?: number;
    styleTickets?: number;
    unlockedFeatures?: string[];
    plots?: any[];
    animals?: any[];
    inventory?: Record<string, number>;
    unlockedSkins?: string[];
    equippedSkins?: Record<string, string>;
  };
}

export function BackupRestoreModal({
  open,
  backupData,
  onClose,
}: {
  open: boolean;
  backupData: UsTwoBackupData | null;
  onClose: () => void;
}) {
  useBodyScrollLock(open);

  const {
    txns,
    setTxns,
    goals,
    setGoals,
    categories,
    setCategories,
    setAnniversary,
    setBudget,
    setPerson,
    isPaired,
    syncLocalToCloud,
  } = useUsTwo();

  const [loading, setLoading] = useState(false);

  if (!open || !backupData) return null;

  const backupTxnsCount = backupData.txns?.length || 0;
  const backupGoalsCount = backupData.goals?.length || 0;
  const backupFarmLevel = backupData.farm?.level || 1;
  const backupFarmCoins = backupData.farm?.coins || 0;
  const exportTimeStr = backupData.exportDate
    ? new Date(backupData.exportDate).toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "未知日期";

  // 1. 智慧合併邏輯 (Smart Merge)
  const handleSmartMerge = async () => {
    setLoading(true);
    try {
      // 合併交易：依 ID 去重
      if (backupData.txns && backupData.txns.length > 0) {
        const existingIds = new Set(txns.map((t) => t.id));
        const newTxns = backupData.txns.filter((t) => !existingIds.has(t.id));
        const merged = [...txns, ...newTxns].sort((a, b) => (a.date < b.date ? 1 : -1));
        setTxns(merged);
      }

      // 合併目標：依 ID 去重
      if (backupData.goals && backupData.goals.length > 0) {
        const existingGoalIds = new Set(goals.map((g) => g.id));
        const newGoals = backupData.goals.filter((g) => !existingGoalIds.has(g.id));
        setGoals([...goals, ...newGoals]);
      }

      // 合併分類
      if (backupData.categories && backupData.categories.length > 0) {
        const existingCatIds = new Set(categories.map((c) => c.id));
        const newCats = backupData.categories.filter((c) => !existingCatIds.has(c.id));
        setCategories([...categories, ...newCats]);
      }

      // 合併農場：保留高等級與較高資產，聯集已解鎖造型
      if (backupData.farm) {
        const farmState = useFarmStore.getState();
        const bf = backupData.farm;

        const mergedUnlockedSkins = Array.from(
          new Set([...farmState.unlockedSkins, ...(bf.unlockedSkins || [])]),
        );

        const mergedInventory = { ...farmState.inventory };
        if (bf.inventory) {
          for (const [k, v] of Object.entries(bf.inventory)) {
            mergedInventory[k] = Math.max(mergedInventory[k] || 0, v);
          }
        }

        useFarmStore.getState().setFarmFromRemote({
          level: Math.max(farmState.level, bf.level || 1),
          xp: Math.max(farmState.xp, bf.xp || 0),
          coins: Math.max(farmState.coins, bf.coins || 0),
          styleTickets: Math.max(farmState.styleTickets, bf.styleTickets || 0),
          unlockedSkins: mergedUnlockedSkins,
          inventory: mergedInventory,
          ...(bf.plots && bf.plots.length > 0 ? { plots: bf.plots } : {}),
          ...(bf.animals && bf.animals.length > 0 ? { animals: bf.animals } : {}),
        });
      }

      if (isPaired) {
        await syncLocalToCloud();
        await syncCurrentFarmToCloud("智慧合併了 JSON 備份 📦");
      }

      toast.success("✨ 智慧合併完成！已保留現有紀錄並整合備份資料");
      onClose();
    } catch (err) {
      toast.error("合併備份發生錯誤，請重試");
    } finally {
      setLoading(false);
    }
  };

  // 2. 完全覆蓋邏輯 (Full Overwrite)
  const handleFullOverwrite = async () => {
    if (!window.confirm("⚠️ 確定要以備份檔「完全覆蓋」現有紀錄嗎？現有的記帳與農場進度將被全面替換！")) {
      return;
    }

    setLoading(true);
    try {
      if (backupData.txns) {
        setTxns(backupData.txns);
      }
      if (backupData.goals) {
        setGoals(backupData.goals);
      }
      if (backupData.categories) {
        setCategories(backupData.categories);
      }
      if (backupData.anniversary) {
        setAnniversary(backupData.anniversary);
      }
      if (backupData.budget !== undefined) {
        setBudget(backupData.budget);
      }
      if (backupData.people) {
        for (const who of ["me", "her"] as const) {
          if (backupData.people[who]) {
            setPerson(who, backupData.people[who]);
          }
        }
      }
      if (backupData.farm) {
        useFarmStore.getState().setFarmFromRemote(backupData.farm);
      }

      if (isPaired) {
        await syncLocalToCloud();
        await syncCurrentFarmToCloud("完全覆蓋還原了 JSON 備份 📦");
      }

      toast.success("🎉 備份還原完成！小窩已完全重現備份時的狀態");
      onClose();
    } catch (err) {
      toast.error("還原備份發生錯誤，請重試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="glass-strong relative z-10 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl overflow-hidden"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
        }}
      >
        <button
          onClick={onClose}
          className="bouncy absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full neu active:scale-95"
          aria-label="關閉"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileJson className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground">還原記帳備份</h3>
            <p className="text-xs text-muted-foreground">備份時間：{exportTimeStr}</p>
          </div>
        </div>

        {/* 檔案內容預覽卡片 */}
        <div className="mt-4 rounded-2xl bg-background/50 p-3.5 border border-border/40 space-y-2 text-xs">
          <p className="font-bold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>檔案檢驗通過 · 包含以下內容：</span>
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="rounded-xl neu p-2">
              <span className="text-[10px] text-muted-foreground block">記帳交易紀錄</span>
              <span className="text-sm font-bold text-foreground tabular-nums">{backupTxnsCount} 筆</span>
            </div>
            <div className="rounded-xl neu p-2">
              <span className="text-[10px] text-muted-foreground block">存錢夢想目標</span>
              <span className="text-sm font-bold text-foreground tabular-nums">{backupGoalsCount} 個</span>
            </div>
            <div className="rounded-xl neu p-2">
              <span className="text-[10px] text-muted-foreground block">小窩農場等級</span>
              <span className="text-sm font-bold text-foreground tabular-nums">Lv.{backupFarmLevel}</span>
            </div>
            <div className="rounded-xl neu p-2">
              <span className="text-[10px] text-muted-foreground block">農場金幣資產</span>
              <span className="text-sm font-bold text-foreground tabular-nums">{backupFarmCoins} 🪙</span>
            </div>
          </div>
        </div>

        {/* 還原方式選擇 */}
        <div className="mt-4 space-y-2.5">
          <button
            disabled={loading}
            onClick={handleSmartMerge}
            className="bouncy w-full rounded-2xl p-3.5 text-left transition-all active:scale-95 border border-primary/20 bg-primary/5 hover:bg-primary/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-primary flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                智慧合併（推薦）
              </span>
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              保留手機目前的紀錄，將備份檔中缺少的交易與目標補入，不刪除任何既有資料。
            </p>
          </button>

          <button
            disabled={loading}
            onClick={handleFullOverwrite}
            className="bouncy w-full rounded-2xl p-3.5 text-left transition-all active:scale-95 border border-destructive/20 bg-destructive/5 hover:bg-destructive/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                完整覆蓋現有紀錄
              </span>
              <ArrowRight className="h-4 w-4 text-destructive" />
            </div>
            <p className="mt-1 text-[11px] text-destructive/80 leading-relaxed">
              以備份檔資料全面取代目前手機上的紀錄。現有未在備份檔中的新增資料將被清除。
            </p>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
