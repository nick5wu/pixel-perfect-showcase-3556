/**
 * ============================================================================
 * UsTwo Ledger - 固定支出與訂閱管理 (Fixed Expenses & Subscriptions Modal)
 * ============================================================================
 * 
 * 核心特色：
 * 1. 管理每月固定支出（房租、電信費、Netflix、Spotify等定期訂閱）。
 * 2. 顯示情侶分攤總覽（我負擔 / 她負擔 / 每月總固定開銷）。
 * 3. 清楚標示每筆項目的扣款日、剩餘天數與本月是否已自動入帳。
 * 4. 支援背景/手動自動生成記帳明細（防止重複生成）。
 * 5. 溫暖燕麥手帳黏土風格，符合 Android-First 與 Safe Area 規範。
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Edit3,
  Flame,
  Lock,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  ICONS,
  money,
  toKey,
  useUsTwo,
  type FixedExpense,
  type Kind,
  type UserId,
} from "@/lib/ustwo";
import { cn, useBodyScrollLock } from "@/lib/utils";

function StampBadge({
  iconName,
  tint = "var(--caramel)",
  size = "md",
}: {
  iconName?: string;
  tint?: string;
  size?: "sm" | "md" | "lg";
}) {
  const IconComponent = (iconName && ICONS[iconName]) || CreditCard;
  const sizeClasses =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const iconSize =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-2xl border border-white/70 shadow-xs",
        sizeClasses,
      )}
      style={{
        backgroundColor: `color-mix(in oklch, ${tint} 24%, white)`,
      }}
    >
      <IconComponent
        className={cn(iconSize, "stroke-[2.2]")}
        style={{ color: `color-mix(in oklch, ${tint} 75%, black)` }}
      />
    </span>
  );
}

export function FixedExpenseModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useBodyScrollLock(open);

  const {
    fixedExpenses,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    toggleFixedExpenseActive,
    checkAndGenerateFixedExpenses,
    categoryGroups,
    resolveCat,
    people,
    activeUser,
  } = useUsTwo();

  const [checking, setChecking] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<FixedExpense | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formBillingDay, setFormBillingDay] = useState("5");
  const [formKind, setFormKind] = useState<Kind>("expense");
  const [formGroupId, setFormGroupId] = useState(categoryGroups[0]?.id ?? "home");
  const [formSubId, setFormSubId] = useState("");
  const [formPayer, setFormPayer] = useState<UserId>(activeUser);
  const [formIsShared, setFormIsShared] = useState(true);
  const [formNote, setFormNote] = useState("");

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const currentYearMonth = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}`;
  const currentDay = now.getDate();
  const daysInCurrentMonth = new Date(currentYear, currentMonthNum, 0).getDate();

  // Summary Metrics
  const activeList = fixedExpenses.filter((f) => f.active);
  const totalMonthlyExpense = activeList
    .filter((f) => f.kind === "expense")
    .reduce((sum, f) => sum + f.amount, 0);

  const meTotal = activeList
    .filter((f) => f.kind === "expense" && f.payer === "me")
    .reduce((sum, f) => sum + f.amount, 0);

  const herTotal = activeList
    .filter((f) => f.kind === "expense" && f.payer === "her")
    .reduce((sum, f) => sum + f.amount, 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormAmount("");
    setFormBillingDay(String(Math.min(currentDay, 28)));
    setFormKind("expense");
    const defaultGroup = categoryGroups.find((g) => g.kind === "expense") || categoryGroups[0];
    setFormGroupId(defaultGroup?.id || "home");
    setFormSubId(defaultGroup?.subCategories[0]?.id || "");
    setFormPayer(activeUser);
    setFormIsShared(true);
    setFormNote("");
    setShowFormDialog(true);
  };

  const handleOpenEdit = (item: FixedExpense) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormAmount(String(item.amount));
    setFormBillingDay(String(item.billingDay));
    setFormKind(item.kind);
    setFormGroupId(item.category);
    setFormSubId(item.subCategory || "");
    setFormPayer(item.payer);
    setFormIsShared(!item.isPrivate);
    setFormNote(item.note || "");
    setShowFormDialog(true);
  };

  const handleSaveItem = () => {
    const trimmedName = formName.trim();
    if (!trimmedName) {
      toast("請填寫固定支出名稱 ✨");
      return;
    }
    const parsedAmount = Number(formAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast("請輸入有效金額 ✨");
      return;
    }
    const billingDayNum = Math.min(31, Math.max(1, Number(formBillingDay) || 1));

    const selectedGroup = categoryGroups.find((g) => g.id === formGroupId);

    const payload = {
      name: trimmedName,
      amount: parsedAmount,
      kind: formKind,
      category: formGroupId,
      ...(formSubId ? { subCategory: formSubId } : {}),
      payer: formPayer,
      isPrivate: !formIsShared,
      billingDay: billingDayNum,
      active: editingItem ? editingItem.active : true,
      ...(formNote.trim() ? { note: formNote.trim() } : {}),
      icon: selectedGroup?.icon || "credit-card",
    };

    if (editingItem) {
      updateFixedExpense(editingItem.id, payload);
    } else {
      addFixedExpense(payload);
    }
    setShowFormDialog(false);
  };

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const generated = await checkAndGenerateFixedExpenses();
      if (generated === 0) {
        toast("本月目前無待補扣的固定支出 ✨", {
          description: "所有生效中的扣款項目本月皆已完成入帳或扣款日未到。",
        });
      }
    } finally {
      setChecking(false);
    }
  };

  const selectedGroupObj = categoryGroups.find((g) => g.id === formGroupId);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[65] flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[oklch(0.22_0.02_55/0.45)] backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="glass-strong relative max-h-[92vh] w-full max-w-md overflow-hidden rounded-t-[2.5rem] shadow-2xl flex flex-col"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
            }}
          >
            {/* Grab handle */}
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-3 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl neu text-primary">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-foreground">
                    固定支出與訂閱
                  </h3>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    每月定期開銷 · 自動記帳
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bouncy flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full neu active:scale-95"
                aria-label="關閉"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content (pb-12 for Android Edge-to-Edge) */}
            <div className="flex-1 overflow-y-auto px-6 py-2 pb-12 space-y-4 no-scrollbar overscroll-contain">
              {/* Monthly Overview Card */}
              <div
                className="ambient-glow rounded-[2rem] p-5 shadow-[var(--shadow-soft)] border border-white/60 dark:border-white/10"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in oklch, var(--caramel) 16%, white) 0%, color-mix(in oklch, var(--oat-card) 95%, white) 100%)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-muted-foreground">
                    每月固定開銷總額
                  </span>
                  <button
                    onClick={handleManualCheck}
                    disabled={checking}
                    className="bouncy flex min-h-[48px] items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary active:scale-95 hover:bg-primary/20 transition-all"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", checking && "animate-spin")} />
                    <span>{checking ? "檢查中..." : "檢查本月扣款"}</span>
                  </button>
                </div>

                <p className="mt-2 text-3xl font-black tabular-nums tracking-tight text-foreground">
                  {money(totalMonthlyExpense)}
                  <span className="text-xs font-semibold text-muted-foreground ml-1.5">
                    / 月
                  </span>
                </p>

                {/* Couple Split Breakdown */}
                <div className="mt-4 grid grid-cols-2 gap-2.5 pt-3 border-t border-border/60">
                  <div className="rounded-2xl neu-inset p-2.5">
                    <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <span>{people.me.emoji}</span>
                      <span>{people.me.zh}負擔</span>
                    </p>
                    <p className="text-sm font-black tabular-nums mt-0.5">
                      {money(meTotal)}
                    </p>
                  </div>
                  <div className="rounded-2xl neu-inset p-2.5">
                    <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <span>{people.her.emoji}</span>
                      <span>{people.her.zh}負擔</span>
                    </p>
                    <p className="text-sm font-black tabular-nums mt-0.5">
                      {money(herTotal)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fixed Expenses Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-muted-foreground">
                    扣款項目清單 ({fixedExpenses.length})
                  </span>
                  <button
                    onClick={handleOpenAdd}
                    className="bouncy flex min-h-[48px] items-center gap-1.5 text-xs font-bold text-primary active:scale-95 px-2"
                  >
                    <Plus className="h-4 w-4" />
                    新增固定支出
                  </button>
                </div>

                {fixedExpenses.length === 0 ? (
                  <div className="glass rounded-3xl p-8 text-center space-y-2">
                    <p className="text-3xl">📅</p>
                    <p className="text-sm font-bold text-foreground">目前沒有固定支出</p>
                    <p className="text-xs text-muted-foreground">
                      點擊上方「新增」來加入房租、Netflix 或水電費吧！
                    </p>
                  </div>
                ) : (
                  fixedExpenses.map((item) => {
                    const resolved = resolveCat(item.category, item.subCategory);
                    const isGeneratedThisMonth =
                      item.lastAutoGeneratedMonth === currentYearMonth;
                    const rawBillingDay = Math.floor(Number(item.billingDay)) || 1;
                    const safeBillingDay = Math.min(Math.max(1, rawBillingDay), daysInCurrentMonth);
                    const diffDays = safeBillingDay - currentDay;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "glass rounded-3xl p-4 transition-all shadow-[var(--shadow-soft)] border border-white/60 dark:border-white/10",
                          !item.active && "opacity-60 bg-muted/30",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Left Stamp Badge */}
                          <StampBadge
                            iconName={item.icon || resolved.group.icon}
                            tint={resolved.group.tint}
                          />

                          {/* Center Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="truncate text-base font-black text-foreground">
                                {item.name}
                              </p>
                              {item.isPrivate ? (
                                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-secondary-foreground">
                                  <Lock className="h-2.5 w-2.5" /> 個人
                                </span>
                              ) : (
                                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400">
                                  <Users className="h-2.5 w-2.5" /> 共同
                                </span>
                              )}
                            </div>

                            {/* Category & Payer Subtitle */}
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              <span>{resolved.group.zh}</span>
                              {resolved.sub && <span> · {resolved.sub.zh}</span>}
                              <span className="mx-1.5">|</span>
                              <span>
                                {people[item.payer].emoji} {people[item.payer].zh}付
                              </span>
                            </p>

                            {/* Billing Day Status Tag (with leap-month / 30-day alignment indicator) */}
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-bold text-muted-foreground border border-border">
                                <Clock className="h-3 w-3" />
                                <span>每月 {item.billingDay} 日扣款</span>
                                {item.billingDay > daysInCurrentMonth && (
                                  <span className="text-[var(--caramel)] font-black">
                                    (本月對齊 {safeBillingDay} 日)
                                  </span>
                                )}
                              </span>

                              {item.active ? (
                                isGeneratedThisMonth ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                    <Check className="h-3 w-3" /> 本月已扣款
                                  </span>
                                ) : diffDays > 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400">
                                    還有 {diffDays} 天扣款
                                  </span>
                                ) : diffDays === 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                    今日扣款
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                    本月待補扣
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                                  已暫停扣款
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right Amount & Toggle (>= 48px touch hitbox) */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <p className="text-base font-black tabular-nums text-foreground">
                              {money(item.amount)}
                            </p>

                            {/* Clay Toggle Switch (>= 48px touch container) */}
                            <button
                              onClick={() => toggleFixedExpenseActive(item.id)}
                              aria-label={item.active ? "暫停自動扣款" : "啟用自動扣款"}
                              className="bouncy flex min-h-[48px] min-w-[56px] items-center justify-center active:scale-95"
                            >
                              <span
                                className={cn(
                                  "relative h-7 w-12 rounded-full transition-colors flex items-center p-1",
                                  item.active ? "bg-[var(--caramel)]" : "bg-border",
                                )}
                              >
                                <motion.span
                                  layout
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  className="h-5 w-5 rounded-full bg-white shadow-md block"
                                  style={{ marginLeft: item.active ? "1.25rem" : "0rem" }}
                                />
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Card Footer Actions (>= 48px touch targets) */}
                        <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="bouncy flex min-h-[48px] items-center gap-1.5 rounded-2xl neu px-4 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-95"
                          >
                            <Edit3 className="h-4 w-4" />
                            編輯
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`確定要刪除「${item.name}」固定支出嗎？`)) {
                                deleteFixedExpense(item.id);
                              }
                            }}
                            className="bouncy flex min-h-[48px] items-center gap-1.5 rounded-2xl neu px-4 text-xs font-bold text-destructive hover:bg-destructive/10 active:scale-95"
                          >
                            <Trash2 className="h-4 w-4" />
                            刪除
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>

          {/* Add / Edit Fixed Expense Form Dialog */}
          <AnimatePresence>
            {showFormDialog && (
              <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowFormDialog(false)}
                  className="absolute inset-0 bg-black/45 backdrop-blur-xs"
                />

                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 16 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 16 }}
                  transition={{ type: "spring", damping: 28, stiffness: 300 }}
                  className="glass-strong relative max-h-[90vh] w-full max-w-sm overflow-y-auto no-scrollbar rounded-[2.5rem] p-5 shadow-2xl space-y-4"
                  style={{
                    paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-black">
                      {editingItem ? "編輯固定支出" : "新增固定支出"}
                    </h4>
                    <button
                      onClick={() => setShowFormDialog(false)}
                      aria-label="關閉"
                      className="bouncy flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full neu active:scale-95"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Name & Amount */}
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground px-1 block mb-1">
                        項目名稱
                      </label>
                      <input
                        autoFocus
                        value={formName}
                        onChange={(e) => setFormName(e.target.value.slice(0, 16))}
                        placeholder="例如：房屋租金、Netflix、Spotify"
                        className="h-12 w-full rounded-2xl neu-inset px-4 text-sm font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-foreground px-1 block mb-1">
                        每月金額 (NT$)
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        placeholder="例如：390 或 22000"
                        className="h-12 w-full rounded-2xl neu-inset px-4 text-base font-extrabold outline-none"
                      />
                    </div>
                  </div>

                  {/* Billing Day Selection */}
                  <div>
                    <div className="flex items-center justify-between px-1 mb-1">
                      <label className="text-xs font-bold text-muted-foreground">
                        每月扣款日
                      </label>
                      <span className="text-xs font-black text-primary">
                        每月 {formBillingDay} 日
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="31"
                        value={formBillingDay}
                        onChange={(e) => setFormBillingDay(e.target.value)}
                        className="w-full accent-[var(--caramel)] cursor-pointer h-2 bg-muted rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Payer Selection (>= 48px touch target) */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground px-1 block mb-1">
                      負責付款人
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["me", "her"] as UserId[]).map((u) => {
                        const isSelected = formPayer === u;
                        return (
                          <button
                            key={u}
                            type="button"
                            onClick={() => setFormPayer(u)}
                            className={cn(
                              "bouncy flex min-h-[48px] items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold transition-all active:scale-95",
                              isSelected
                                ? "bg-[var(--caramel)] text-white shadow-md font-black"
                                : "neu text-muted-foreground",
                            )}
                          >
                            <span>{people[u].emoji}</span>
                            <span>{people[u].zh}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Joint vs Private Toggle (>= 48px touch container) */}
                  <div className="flex items-center justify-between rounded-2xl neu-inset p-3">
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {formIsShared ? "共同開銷 (雙方可見)" : "個人私房錢支出"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formIsShared
                          ? "納入每月雙人共同支出統計"
                          : "僅在個人記帳中扣款與顯示"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormIsShared((v) => !v)}
                      aria-label="切換共同或個人開銷"
                      className="bouncy flex min-h-[48px] min-w-[56px] items-center justify-center active:scale-95"
                    >
                      <span
                        className={cn(
                          "relative h-7 w-12 rounded-full transition-colors flex items-center p-1",
                          formIsShared ? "bg-[var(--caramel)]" : "bg-border",
                        )}
                      >
                        <motion.span
                          layout
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="h-5 w-5 rounded-full bg-white shadow-md block"
                          style={{ marginLeft: formIsShared ? "1.25rem" : "0rem" }}
                        />
                      </span>
                    </button>
                  </div>

                  {/* Main Category & Subcategory Selectors */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground px-1 block mb-1.5">
                      歸屬大類別
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {categoryGroups
                        .filter((g) => g.kind === formKind)
                        .map((g) => {
                          const isSelected = formGroupId === g.id;
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => {
                                setFormGroupId(g.id);
                                setFormSubId(g.subCategories[0]?.id || "");
                              }}
                              className={cn(
                                "bouncy flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[10px] font-bold active:scale-95",
                                isSelected ? "neu-inset font-black text-foreground" : "opacity-75",
                              )}
                            >
                              <StampBadge iconName={g.icon} tint={g.tint} size="sm" />
                              <span className="truncate w-full text-center px-1">
                                {g.zh}
                              </span>
                            </button>
                          );
                        })}
                    </div>

                    {/* Subcategories Chips (>= 40px touch area) */}
                    {selectedGroupObj && selectedGroupObj.subCategories.length > 0 && (
                      <div className="mt-2.5 neu-inset rounded-2xl p-2.5">
                        <p className="text-[10px] font-bold text-muted-foreground px-1 mb-1.5">
                          選擇子細項
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedGroupObj.subCategories.map((sub) => {
                            const isSelected = formSubId === sub.id;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => setFormSubId(sub.id)}
                                className={cn(
                                  "bouncy min-h-[40px] flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95",
                                  isSelected
                                    ? "bg-primary text-primary-foreground shadow-xs"
                                    : "bg-background/80 text-muted-foreground hover:text-foreground",
                                )}
                              >
                                {sub.zh}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Note */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground px-1 block mb-1">
                      備註說明 (選填)
                    </label>
                    <input
                      value={formNote}
                      onChange={(e) => setFormNote(e.target.value.slice(0, 30))}
                      placeholder="例如：兩人平分、家庭方案"
                      className="h-11 w-full rounded-2xl neu-inset px-4 text-xs font-semibold outline-none"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowFormDialog(false)}
                      className="bouncy flex min-h-[48px] h-12 flex-1 items-center justify-center rounded-2xl neu text-xs font-bold text-muted-foreground active:scale-95"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveItem}
                      className="bouncy flex min-h-[48px] h-12 flex-1 items-center justify-center rounded-2xl text-xs font-extrabold text-primary-foreground shadow-md active:scale-95"
                      style={{
                        backgroundImage:
                          "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
                        boxShadow: "var(--shadow-soft)",
                      }}
                    >
                      儲存設定
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
