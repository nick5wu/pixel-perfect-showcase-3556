/**
 * ============================================================================
 * UsTwo Ledger - 情侶月度財務小報卡片 (Monthly Recap Modal)
 * ============================================================================
 * 
 * 解決痛點：
 * 解決記帳缺乏週期結算與儀式感的問題。
 * 每月結算時，為兩人生成一張溫暖、浪漫且具趣味對決稱號的分享卡片。
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, Heart, Calendar, Share2, Copy, X, ArrowLeft, ArrowRight, Award, Crown } from "lucide-react";
import { toast } from "sonner";
import { money, toKey, useUsTwo, type Txn } from "@/lib/ustwo";
import { useFarmStore } from "@/store/useFarmStore";
import { useResolvedPhoto } from "@/lib/photoStorage";
import { useBodyScrollLock } from "@/lib/utils";

export function MonthlyRecapModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useBodyScrollLock(open);

  const { txns, budget, people } = useUsTwo();
  const farm = useFarmStore();

  // Current year-month e.g. "2026-10"
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });

  // Calculate previous and next months
  const [yearStr = "2026", monthStr = "1"] = selectedMonth.split("-");
  const year = parseInt(yearStr || "2026", 10);
  const month = parseInt(monthStr || "1", 10);

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const nextMonth = () => {
    const d = new Date(year, month, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  // Filter transactions for selected month
  const monthTxns = useMemo(() => {
    return txns.filter((t) => t.date.startsWith(selectedMonth) && t.kind === "expense");
  }, [txns, selectedMonth]);

  const jointTxns = useMemo(() => {
    return monthTxns.filter((t) => !t.isPrivate);
  }, [monthTxns]);

  const totalJoint = jointTxns.reduce((s, t) => s + t.amount, 0);
  const paidByMe = jointTxns.filter((t) => t.payer === "me").reduce((s, t) => s + t.amount, 0);
  const paidByHer = totalJoint - paidByMe;

  const pctMe = totalJoint > 0 ? Math.round((paidByMe / totalJoint) * 100) : 50;
  const pctHer = 100 - pctMe;

  // Top memorable expense
  const topExpense = useMemo(() => {
    return [...jointTxns].sort((a, b) => b.amount - a.amount)[0] || null;
  }, [jointTxns]);

  const topPhoto = useResolvedPhoto(topExpense?.photo);

  // Sweet duel titles
  const duelTitle = useMemo(() => {
    if (totalJoint === 0) return { title: "🌱 平靜安穩之月", desc: "本月共同支出為 0，兩人一起度過了自律極簡的生活！" };
    if (paidByMe > paidByHer) {
      return {
        winner: "me",
        title: `👑 本月金牌請客王：${people.me.zh}`,
        desc: `${people.me.zh} 付了 ${pctMe}% 的共同開銷，慷慨指數破表！❤️`,
        sub: `🏅 備受寵愛小福星：${people.her.zh} (${pctHer}%)`,
      };
    }
    if (paidByHer > paidByMe) {
      return {
        winner: "her",
        title: `👑 本月慷慨女王：${people.her.zh}`,
        desc: `${people.her.zh} 付了 ${pctHer}% 的共同開銷，感謝女王大人的照顧！👸`,
        sub: `🏅 幸福賢內助：${people.me.zh} (${pctMe}%)`,
      };
    }
    return {
      winner: "both",
      title: "💖 默契滿分五五波！",
      desc: "兩人各出資 50%，心有靈犀的最佳神仙伴侶！",
      sub: "感情與荷包都平分秋色",
    };
  }, [totalJoint, paidByMe, paidByHer, pctMe, pctHer, people]);

  const copyShareText = () => {
    const text = `💌 【UsTwo 情侶月度小報 · ${year}年${month}月】\n` +
      `---------------------------------\n` +
      `💰 本月共同花費：${money(totalJoint)}\n` +
      (budget > 0 ? `📊 預算目標：${money(budget)} (達成率 ${Math.min(100, Math.round((totalJoint / budget) * 100))}%\n` : "") +
      `🐻 ${people.me.zh}付了：${money(paidByMe)} (${pctMe}%)\n` +
      `🐰 ${people.her.zh}付了：${money(paidByHer)} (${pctHer}%)\n` +
      `🏆 ${duelTitle.title}\n` +
      (topExpense ? `🌟 最難忘的開銷：「${topExpense.note}」(${money(topExpense.amount)})\n` : "") +
      `🌾 小窩農場進度：Lv.${farm.level} (擁有 ${farm.animals.length} 隻動物夥伴)\n` +
      `---------------------------------\n` +
      `下個月也要一起甜甜記帳、一起過好每一天！✨`;

    navigator.clipboard.writeText(text);
    toast.success("已複製小報文字到剪貼簿！可貼到 LINE 或 IG 分享 📋✨");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-foreground/45 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="glass-strong relative z-10 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
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

        {/* Month Selector */}
        <div className="flex items-center justify-between px-2 pt-1">
          <button
            onClick={prevMonth}
            className="bouncy flex h-9 w-9 items-center justify-center rounded-full neu active:scale-95"
            aria-label="上個月"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <span className="text-xs font-bold text-muted-foreground">情侶月度財務小報</span>
            <h3 className="text-lg font-black tracking-tight">{year} 年 {month} 月</h3>
          </div>
          <button
            onClick={nextMonth}
            className="bouncy flex h-9 w-9 items-center justify-center rounded-full neu active:scale-95"
            aria-label="下個月"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Shareable Card Body */}
        <div className="mt-4 rounded-[2rem] bg-background/60 p-5 border border-border/40 shadow-sm space-y-4">
          {/* Header Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐻</span>
              <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
              <span className="text-xl">🐰</span>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
              {jointTxns.length} 筆甜蜜紀錄
            </span>
          </div>

          {/* Total Spending & Budget */}
          <div className="text-center py-1">
            <p className="text-xs text-muted-foreground font-semibold">本月共同花費總計</p>
            <p className="text-3xl font-black tabular-nums tracking-tight text-foreground mt-0.5">
              {money(totalJoint)}
            </p>
            {budget > 0 && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                預算 {money(budget)} · {totalJoint > budget ? (
                  <span className="text-destructive font-bold">超支 {money(totalJoint - budget)}</span>
                ) : (
                  <span className="text-emerald-600 font-bold">尚餘 {money(budget - totalJoint)}</span>
                )}
              </p>
            )}
          </div>

          {/* Duel Winner Award */}
          <div className="rounded-2xl neu p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-xs font-extrabold text-foreground">{duelTitle.title}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed pl-6">
              {duelTitle.desc}
            </p>

            {/* Visual ratio bar */}
            <div className="mt-2 h-2.5 overflow-hidden rounded-full neu-inset flex">
              <div
                className="transition-[width] duration-700"
                style={{ width: `${pctMe}%`, backgroundColor: people.me.color }}
              />
              <div
                className="flex-1 transition-[width] duration-700"
                style={{ backgroundColor: totalJoint > 0 ? people.her.color : "transparent" }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold px-1 text-muted-foreground">
              <span>{people.me.zh} {money(paidByMe)} ({pctMe}%)</span>
              <span>{people.her.zh} {money(paidByHer)} ({pctHer}%)</span>
            </div>
          </div>

          {/* Top Memory */}
          {topExpense && (
            <div className="rounded-2xl bg-primary/5 p-3.5 border border-primary/10">
              <span className="text-[10px] font-bold text-primary block">🌟 本月最深刻開銷</span>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-xs font-extrabold truncate">{topExpense.note || "無備註"}</span>
                <span className="text-xs font-black tabular-nums text-foreground">{money(topExpense.amount)}</span>
              </div>
              {topPhoto && (
                <div className="mt-2.5 flex justify-center">
                  <div className="polaroid max-w-[120px] rounded-md rotate-[-2deg]">
                    <img src={topPhoto} alt="紀念相片" className="h-20 w-20 object-cover rounded-sm" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Farm Achievement */}
          <div className="flex items-center justify-between rounded-2xl neu p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">🏡</span>
              <div>
                <span className="font-bold block">小窩農場</span>
                <span className="text-[10px] text-muted-foreground">目前 Lv.{farm.level} · {farm.animals.length} 隻小動物</span>
              </div>
            </div>
            <span className="font-extrabold text-amber-600">{farm.coins} 🪙</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={copyShareText}
            className="bouncy flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-bold text-primary-foreground"
            style={{ backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))", boxShadow: "var(--shadow-soft)" }}
          >
            <Copy className="h-4 w-4" />
            複製分享文字
          </button>
        </div>
      </motion.div>
    </div>
  );
}
