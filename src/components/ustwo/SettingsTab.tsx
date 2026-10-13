import { useState, useRef } from "react";
import { Heart, Sparkles, Pencil, Check, X, Sun, Moon, Monitor, Download, Upload, Wallet, Cloud, FileJson, Lock, Unlock, KeyRound, ShieldCheck, Tag, CalendarDays, Palette, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { money, toKey, useUsTwo, THEMES, type UserId, type DarkMode } from "@/lib/ustwo";
import { useFarmStore } from "@/store/useFarmStore";
import { useVaultLock } from "@/lib/vaultLock";
import { PinModal } from "./PinModal";
import { BackupRestoreModal, type UsTwoBackupData } from "./BackupRestoreModal";
import { CategorySettingsModal } from "./CategorySettingsModal";
import { FixedExpenseModal } from "./FixedExpenseModal";
import { ThemeSettingsModal } from "./ThemeSettingsModal";
import { AvatarSettingsModal } from "./AvatarSettingsModal";
import { Avatar, SectionTitle } from "./shared";
import { WidgetPreview } from "./WidgetPreview";
import { DatePicker } from "./DatePicker";
import { cn, useBodyScrollLock } from "@/lib/utils";

// ─── Emoji picker options ─────────────────────────────────────────────────────

const EMOJI_OPTIONS = [
  "🐻","🐰","🐼","🐨","🐯","🦊","🐶","🐱","🐸","🐧",
  "🌸","🌻","🍓","🍭","☀️","🌙","⭐","💫","🧸","🎀",
  "🍀","🌈","🐝","🦋","🐬","🦄","🎸","🍕","🧋","🎹",
];

// ─── 5. Nickname & Profile Modal (Modal 化，避免外層版面跑位) ──────────────────

function NicknameModal({
  open,
  who,
  onClose,
}: {
  open: boolean;
  who: UserId | null;
  onClose: () => void;
}) {
  useBodyScrollLock(open);
  const { people, setPerson } = useUsTwo();
  return (
    <AnimatePresence>
      {open && who && (
        <NicknameModalInner who={who} p={people[who]} onClose={onClose} onSave={setPerson} />
      )}
    </AnimatePresence>
  );
}

function NicknameModalInner({
  who,
  p,
  onClose,
  onSave,
}: {
  who: UserId;
  p: { zh: string; name: string; emoji: string; color: string };
  onClose: () => void;
  onSave: (who: UserId, patch: Partial<{ zh: string; name: string; emoji: string }>) => void;
}) {
  const [zh, setZh] = useState(p.zh);
  const [name, setName] = useState(p.name);
  const [emoji, setEmoji] = useState(p.emoji);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const save = () => {
    const trimmedZh = zh.trim() || p.zh;
    const trimmedName = name.trim() || p.name;
    onSave(who, { zh: trimmedZh, name: trimmedName, emoji });
    toast.success(`已儲存「${trimmedZh}」的暱稱設定 ✨`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-[oklch(0.22_0.02_55/0.45)] backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 16 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="glass-strong relative w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl overflow-hidden overscroll-contain touch-pan-y"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="bouncy absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full neu active:scale-95"
          aria-label="關閉"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-center text-lg font-bold">
          修改暱稱 · {p.zh}
        </h3>
        <p className="mt-0.5 text-center text-xs text-muted-foreground">
          修改顯示暱稱與頭像表情，不會影響版面排版
        </p>

        {/* Avatar / Emoji section */}
        <div className="my-5 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            className="bouncy relative active:scale-95"
            aria-label="點擊更換頭像表情"
          >
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/80 text-3xl shadow-[var(--shadow-soft)]"
              style={{ backgroundColor: `color-mix(in oklch, ${p.color} 24%, white)` }}
            >
              {emoji}
            </span>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
              <Pencil className="h-3 w-3" />
            </span>
          </button>
          <span className="mt-2 text-[11px] font-semibold text-muted-foreground">
            點擊頭像更換表情符號
          </span>

          {emojiOpen && (
            <div className="glass-strong pop-in mt-3 w-full rounded-2xl p-3 shadow-md">
              <div className="grid max-h-36 grid-cols-6 gap-1.5 overflow-y-auto no-scrollbar">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      setEmoji(e);
                      setEmojiOpen(false);
                    }}
                    className={cn(
                      "bouncy flex h-11 w-11 items-center justify-center rounded-xl text-xl active:scale-90",
                      e === emoji && "neu font-bold",
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label className="px-1 text-xs font-bold text-muted-foreground">中文暱稱</label>
            <input
              value={zh}
              onChange={(e) => setZh(e.target.value.slice(0, 8))}
              placeholder="例如：我 / 寶貝 / 親愛的"
              className="mt-1 h-12 w-full rounded-2xl neu-inset px-4 text-sm font-semibold outline-none"
            />
          </div>
          <div>
            <label className="px-1 text-xs font-bold text-muted-foreground">英文名稱 / 代稱</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 12))}
              placeholder="例如：Me / Darling"
              className="mt-1 h-12 w-full rounded-2xl neu-inset px-4 text-sm font-semibold outline-none"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="bouncy flex min-h-[48px] h-12 flex-1 items-center justify-center rounded-2xl neu text-sm font-bold text-muted-foreground active:scale-95"
          >
            取消
          </button>
          <button
            type="button"
            onClick={save}
            className="bouncy flex min-h-[48px] h-12 flex-1 items-center justify-center rounded-2xl text-sm font-extrabold text-primary-foreground active:scale-95 shadow-md"
            style={{
              backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            儲存修改
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Person card (Stable layout with Avatar & actions) ─────────────────────────

function PersonCard({
  who,
  onEditNickname,
  onEditAvatar,
}: {
  who: UserId;
  onEditNickname: () => void;
  onEditAvatar: () => void;
}) {
  const { people } = useUsTwo();
  const p = people[who];

  return (
    <div className="glass flex-1 rounded-[1.75rem] p-4 text-center transition-all shadow-sm border border-white/60 dark:border-white/10 flex flex-col justify-between">
      <div>
        <div
          onClick={onEditAvatar}
          role="button"
          tabIndex={0}
          className="bouncy group relative mx-auto flex h-16 w-16 cursor-pointer items-center justify-center rounded-full active:scale-95"
          title="更換頭像"
        >
          <Avatar who={who} size="lg" />
          <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow ring-2 ring-card">
            <Pencil className="h-3 w-3" />
          </span>
        </div>

        <div className="mt-3">
          <p className="truncate text-sm font-extrabold text-foreground">{p.zh}</p>
          <p className="truncate text-xs font-semibold text-muted-foreground">{p.name}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={onEditAvatar}
          className="bouncy flex min-h-[38px] flex-1 items-center justify-center rounded-xl bg-secondary px-2 py-1 text-[11px] font-bold text-secondary-foreground transition-all active:scale-95"
        >
          更換頭像
        </button>
        <button
          type="button"
          onClick={onEditNickname}
          className="bouncy flex min-h-[38px] flex-1 items-center justify-center rounded-xl neu px-2 py-1 text-[11px] font-bold text-muted-foreground transition-all active:scale-95"
        >
          暱稱
        </button>
      </div>
    </div>
  );
}

// ─── Anniversary editor ───────────────────────────────────────────────────────

function AnniversaryEdit() {
  const { anniversary, setAnniversary } = useUsTwo();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(anniversary);

  const days = Math.floor((Date.now() - new Date(anniversary).getTime()) / (1000 * 60 * 60 * 24));

  const commit = () => {
    if (draft) setAnniversary(draft);
    setEditing(false);
  };

  return (
    <section className="ambient-glow rounded-[2rem] p-5 text-center" style={{ boxShadow: "var(--shadow-soft)" }}>
      <Heart className="mx-auto h-6 w-6 text-primary" fill="currentColor" />
      <p className="mt-1 text-xs font-semibold text-muted-foreground">在一起紀念日</p>
      <p className="text-3xl font-extrabold tabular-nums">{days} 天</p>
      {editing ? (
        <div className="mt-3 flex items-center justify-center gap-2">
          <DatePicker
            value={draft}
            onChange={setDraft}
            max={toKey(new Date())}
            showQuickPresets={false}
            className="flex-1 max-w-[220px]"
          />
          <button onClick={commit} className="bouncy flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-4 w-4" />
          </button>
          <button onClick={() => { setDraft(anniversary); setEditing(false); }} className="bouncy flex h-9 w-9 shrink-0 items-center justify-center rounded-full neu">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-center gap-2">
          <p className="text-xs text-muted-foreground">自 {anniversary} 起 🧡</p>
          <button onClick={() => setEditing(true)} className="bouncy flex h-7 w-7 items-center justify-center rounded-full neu">
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
    </section>
  );
}

// ─── Appearance & Themes section ─────────────────────────────────────────────

const DARK_OPTIONS: { value: DarkMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "淺色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟系統", icon: Monitor },
];

function AppearanceSection({
  onOpenThemeSettings,
  onOpenAvatarSettings,
}: {
  onOpenThemeSettings: () => void;
  onOpenAvatarSettings: () => void;
}) {
  const { darkMode, setDarkMode, currentTheme } = useUsTwo();
  const themeDef = THEMES.find((t) => t.id === currentTheme) || THEMES[0]!;

  return (
    <section className="glass rounded-[2rem] p-5 space-y-3.5">
      <SectionTitle zh="個人化與外觀" en="Themes & Appearance" />

      {/* Grid with Theme Card & Avatar Card */}
      <div className="grid grid-cols-2 gap-3">
        {/* Theme Settings Card */}
        <button
          type="button"
          onClick={onOpenThemeSettings}
          className="bouncy flex flex-col justify-between rounded-3xl neu p-4 text-left transition-all active:scale-95 hover:shadow-md min-h-[140px] cursor-pointer"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary mb-2.5">
              <Palette className="h-5 w-5" />
            </div>
            <p className="text-sm font-black text-foreground">主題風格</p>
            <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">
              {themeDef.zh} · {themeDef.tag}
            </p>
          </div>

          {/* 3 color swatches */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-border/30">
            <div
              className="h-4.5 w-4.5 rounded-full border border-card shadow-xs"
              style={{ backgroundColor: themeDef.previewColors.primary }}
              title="主色調"
            />
            <div
              className="h-4.5 w-4.5 rounded-full border border-card shadow-xs"
              style={{ backgroundColor: themeDef.previewColors.background }}
              title="背景色"
            />
            <div
              className="h-4.5 w-4.5 rounded-full border border-card shadow-xs"
              style={{ backgroundColor: themeDef.previewColors.surface }}
              title="卡片色"
            />
            <span className="text-[10px] font-bold text-primary ml-auto">切換</span>
          </div>
        </button>

        {/* Avatar Settings Card */}
        <button
          type="button"
          onClick={onOpenAvatarSettings}
          className="bouncy flex flex-col justify-between rounded-3xl neu p-4 text-left transition-all active:scale-95 hover:shadow-md min-h-[140px] cursor-pointer"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400 mb-2.5">
              <User className="h-5 w-5" />
            </div>
            <p className="text-sm font-black text-foreground">雙人頭像</p>
            <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">
              自訂相片 / Q 版動物
            </p>
          </div>

          {/* Avatar previews */}
          <div className="flex items-center -space-x-1.5 pt-2 border-t border-border/30">
            <Avatar who="me" size="sm" />
            <Avatar who="her" size="sm" />
            <span className="text-[10px] font-bold text-primary ml-auto pl-2">設定</span>
          </div>
        </button>
      </div>

      {/* Dark mode pills */}
      <div className="pt-1">
        <div className="glass flex items-center justify-between rounded-2xl p-1.5">
          <span className="px-3 text-xs font-bold text-muted-foreground">深淺模式</span>
          <div className="flex items-center gap-1">
            {DARK_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setDarkMode(value)}
                className={cn(
                  "bouncy flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                  darkMode === value ? "text-primary-foreground" : "text-muted-foreground"
                )}
                style={
                  darkMode === value
                    ? {
                        backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
                        boxShadow: "var(--shadow-soft)",
                      }
                    : undefined
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Budget editor ────────────────────────────────────────────────────────────

function BudgetEditor() {
  const { budget, setBudget } = useUsTwo();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(budget > 0 ? String(budget) : "");

  const commit = () => {
    const n = Number(draft.replace(/,/g, ""));
    setBudget(isNaN(n) || n < 0 ? 0 : n);
    setEditing(false);
  };

  return (
    <section className="glass rounded-[1.75rem] px-5 py-4">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold">每月共同預算</span>
      </div>
      {editing ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">NT$</span>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
            placeholder="例如：30000"
            className="h-10 flex-1 rounded-2xl neu-inset px-3 text-sm outline-none"
          />
          <button onClick={commit} className="bouncy flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-4 w-4" />
          </button>
          <button onClick={() => setEditing(false)} className="bouncy flex h-9 w-9 items-center justify-center rounded-full neu">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-lg font-extrabold tabular-nums">
            {budget > 0 ? money(budget) : <span className="text-muted-foreground text-sm font-semibold">未設定</span>}
          </p>
          <button onClick={() => { setDraft(budget > 0 ? String(budget) : ""); setEditing(true); }} className="bouncy flex h-8 w-8 items-center justify-center rounded-full neu">
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
      {budget > 0 && (
        <p className="mt-1 text-[11px] text-muted-foreground">私人花費不計入預算 · 超過 80% 時顯示警示</p>
      )}
    </section>
  );
}

// ─── Vault PIN Lock Section ──────────────────────────────────────────────────

function VaultPinSection() {
  const { hasPin, isUnlocked, lock, removePin } = useVaultLock();
  const [pinModal, setPinModal] = useState<{ open: boolean; mode: "unlock" | "setup" }>({
    open: false,
    mode: "setup",
  });
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <section className="glass rounded-[1.75rem] px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold">私房錢防窺 PIN 碼</span>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-bold",
            hasPin
              ? isUnlocked
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
              : "bg-muted text-muted-foreground",
          )}
        >
          {hasPin ? (isUnlocked ? "🔓 已解鎖 (使用中)" : "🔒 已上鎖保護") : "未啟用"}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {hasPin
          ? "已啟用 4 碼 PIN 密碼保護。查看個人私房錢專區或切換身分時需驗證密碼，避免另一半意外看見驚喜禮物或個人秘密開銷。"
          : "為同一設備上的個人花費設定 4 位數 PIN 碼。未解鎖前將自動隱蔽所有私房錢紀錄，守護驚喜與個人隱私。"}
      </p>

      {hasPin ? (
        <div className="space-y-2 pt-1">
          <div className="flex gap-2">
            {isUnlocked ? (
              <button
                type="button"
                onClick={() => {
                  lock();
                  toast.success("🔒 私房錢保險箱已立即上鎖！");
                }}
                className="bouncy flex min-h-[48px] h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl neu text-xs font-bold text-amber-800 dark:text-amber-200 active:scale-95"
              >
                <Lock className="h-4 w-4" />
                立即上鎖
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPinModal({ open: true, mode: "unlock" })}
                className="bouncy flex min-h-[48px] h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl neu text-xs font-bold text-emerald-700 dark:text-emerald-300 active:scale-95"
              >
                <KeyRound className="h-4 w-4" />
                解鎖保險箱
              </button>
            )}

            <button
              type="button"
              onClick={() => setPinModal({ open: true, mode: "setup" })}
              className="bouncy flex min-h-[48px] h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl neu text-xs font-bold text-muted-foreground active:scale-95"
            >
              <Pencil className="h-3.5 w-3.5" />
              修改密碼
            </button>
          </div>

          {confirmRemove ? (
            <div className="flex items-center gap-2 rounded-2xl bg-destructive/10 p-2.5">
              <span className="flex-1 text-[11px] font-bold text-destructive">
                確定關閉 PIN 密碼保護嗎？
              </span>
              <button
                type="button"
                onClick={() => {
                  removePin();
                  setConfirmRemove(false);
                  toast.success("已清除 PIN 碼保護 🔓");
                }}
                className="bouncy min-h-[36px] rounded-xl bg-destructive px-3 text-xs font-bold text-destructive-foreground active:scale-95"
              >
                確定關閉
              </button>
              <button
                type="button"
                onClick={() => setConfirmRemove(false)}
                className="bouncy min-h-[36px] rounded-xl neu px-3 text-xs font-bold text-muted-foreground active:scale-95"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              className="w-full text-center text-[11px] font-semibold text-muted-foreground hover:text-destructive py-1 transition-colors"
            >
              關閉 / 清除 PIN 密碼保護
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPinModal({ open: true, mode: "setup" })}
          className="bouncy flex min-h-[48px] h-12 w-full items-center justify-center gap-2 rounded-2xl text-xs font-extrabold text-primary-foreground active:scale-95 shadow-md"
          style={{
            backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <Lock className="h-4 w-4" />
          啟用 4 位數 PIN 碼保護
        </button>
      )}

      {/* Pin modal dialog */}
      <PinModal
        open={pinModal.open}
        mode={pinModal.mode}
        title={pinModal.mode === "setup" ? "設定私房錢防窺 PIN 碼" : "解鎖私密保險箱"}
        description={
          pinModal.mode === "setup"
            ? "請設定 4 位數安全密碼（需輸入兩次確認）"
            : "請輸入 4 位數 PIN 碼以解鎖私房錢帳本"
        }
        onSuccess={() => setPinModal({ open: false, mode: "setup" })}
        onCancel={() => setPinModal({ open: false, mode: "setup" })}
      />
    </section>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function csvEscape(v: string | number | boolean): string {
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function ExportSection({ onImportClick }: { onImportClick: () => void }) {
  const {
    txns,
    goals,
    categories,
    categoryGroups,
    fixedExpenses,
    anniversary,
    budget,
    people,
    getCat,
  } = useUsTwo();

  const exportCSV = () => {
    const rows = [
      ["日期", "金額", "類型", "分類", "備註", "付款人", "私人"],
      ...txns
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((t) => [
          t.date,
          t.amount,
          t.kind === "expense" ? "支出" : "收入",
          getCat(t.category).zh,
          t.note,
          people[t.payer].zh,
          t.isPrivate ? "是" : "否",
        ]),
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `UsTwo記帳_${toKey(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const farmState = useFarmStore.getState();
    const backup: UsTwoBackupData = {
      version: "1.0",
      appName: "UsTwo Ledger",
      exportDate: new Date().toISOString(),
      txns,
      goals,
      categories,
      categoryGroups,
      fixedExpenses,
      anniversary,
      budget,
      people,
      farm: {
        level: farmState.level,
        xp: farmState.xp,
        coins: farmState.coins,
        styleTickets: farmState.styleTickets,
        unlockedFeatures: farmState.unlockedFeatures,
        plots: farmState.plots,
        animals: farmState.animals,
        inventory: farmState.inventory,
        unlockedSkins: farmState.unlockedSkins,
        equippedSkins: farmState.equippedSkins,
      },
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `UsTwo小窩完整備份_${toKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("已成功匯出完整小窩 JSON 備份檔 📦✨");
  };

  return (
    <section className="glass rounded-[1.75rem] px-5 py-4 space-y-3.5">
      <div>
        <p className="text-sm font-bold">資料備份與還原</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">完整備份包含記帳明細、存錢夢想與小窩農場存檔</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={exportJSON}
          className="bouncy flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold text-primary-foreground"
          style={{ backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))", boxShadow: "var(--shadow-soft)" }}
        >
          <Download className="h-4 w-4" />
          匯出完整 JSON
        </button>
        <button
          onClick={onImportClick}
          className="bouncy flex items-center justify-center gap-1.5 rounded-2xl neu py-2.5 text-xs font-bold text-foreground active:scale-95"
        >
          <Upload className="h-4 w-4 text-primary" />
          匯入還原備份
        </button>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border/30 text-xs">
        <span className="text-[11px] text-muted-foreground">需要試算表格式？</span>
        <button
          onClick={exportCSV}
          className="text-xs font-semibold text-primary underline hover:opacity-80"
        >
          下載 CSV 報表
        </button>
      </div>
    </section>
  );
}

// ─── Cloud Sync Section ───────────────────────────────────────────────────────

function CloudSection({ onOpenCloud }: { onOpenCloud?: (() => void) | undefined }) {
  const { cloudStatus, coupleCode, isPaired } = useUsTwo();

  return (
    <section className="glass rounded-[1.75rem] px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-primary-foreground"
            style={{ backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))" }}
          >
            <Cloud className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold">雲端雙人同步</p>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  isPaired && cloudStatus === "connected"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {isPaired && cloudStatus === "connected" ? "雙人連線中" : "尚未綁定"}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {isPaired ? `小窩邀請碼：${coupleCode}` : "Supabase 雲端資料庫與照片儲存"}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenCloud}
          className="bouncy rounded-2xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow"
        >
          {isPaired ? "小窩設定" : "設定連線"}
        </button>
      </div>
    </section>
  );
}

// ─── SettingsTab ──────────────────────────────────────────────────────────────

export function SettingsTab({ onOpenCloud }: { onOpenCloud?: () => void }) {
  const { visible, categoryGroups, fixedExpenses } = useUsTwo();
  const [showWidget, setShowWidget] = useState(true);
  const [recap, setRecap] = useState<"month" | "year">("month");
  const [editingWho, setEditingWho] = useState<UserId | null>(null);
  const [openCategorySettings, setOpenCategorySettings] = useState(false);
  const [openFixedExpenses, setOpenFixedExpenses] = useState(false);
  const [openThemeSettings, setOpenThemeSettings] = useState(false);
  const [openAvatarSettings, setOpenAvatarSettings] = useState(false);
  const [avatarInitialUser, setAvatarInitialUser] = useState<UserId>("me");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupModalData, setBackupModalData] = useState<UsTwoBackupData | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== "object" || (!parsed.txns && !parsed.farm && !parsed.version)) {
          toast.error("此檔案非有效的 UsTwo Ledger 備份檔 ⚠️");
          return;
        }
        setBackupModalData(parsed);
      } catch {
        toast.error("無法解析 JSON 檔案，請確認檔案格式 ⚠️");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const prefix = recap === "month" ? toKey(new Date()).slice(0, 7) : toKey(new Date()).slice(0, 4);
  const rows = visible.filter((t) => t.date.startsWith(prefix) && t.kind === "expense");
  const spent = rows.reduce((s, t) => s + t.amount, 0);
  const top = rows.slice().sort((a, b) => b.amount - a.amount)[0];

  return (
    <div className="space-y-5">
      {/* 隱藏的檔案上傳輸入框 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
      {/* Cloud Sync section */}
      <CloudSection onOpenCloud={onOpenCloud} />

      {/* Partner profiles */}
      <section className="glass rounded-[2rem] p-5">
        <SectionTitle zh="我們倆" en="Partner profiles" />
        <div className="flex gap-3">
          <PersonCard
            who="me"
            onEditNickname={() => setEditingWho("me")}
            onEditAvatar={() => {
              setAvatarInitialUser("me");
              setOpenAvatarSettings(true);
            }}
          />
          <PersonCard
            who="her"
            onEditNickname={() => setEditingWho("her")}
            onEditAvatar={() => {
              setAvatarInitialUser("her");
              setOpenAvatarSettings(true);
            }}
          />
        </div>
      </section>

      {/* Nickname Modal Dialog */}
      <NicknameModal
        open={Boolean(editingWho)}
        who={editingWho}
        onClose={() => setEditingWho(null)}
      />

      {/* Anniversary */}
      <AnniversaryEdit />

      {/* Personalization & Appearance (Themes, Avatars, Dark mode) */}
      <AppearanceSection
        onOpenThemeSettings={() => setOpenThemeSettings(true)}
        onOpenAvatarSettings={() => {
          setAvatarInitialUser("me");
          setOpenAvatarSettings(true);
        }}
      />

      {/* Budget */}
      <BudgetEditor />

      {/* 模組一：財務核心管理 (主次類別 & 固定支出) */}
      <section className="glass rounded-[2rem] p-5 space-y-3">
        <SectionTitle zh="財務核心管理" en="Financial settings" />
        <div className="grid grid-cols-2 gap-3">
          {/* 記帳類別管理卡片 */}
          <button
            onClick={() => setOpenCategorySettings(true)}
            className="bouncy flex flex-col items-start gap-2.5 rounded-3xl neu p-4 text-left transition-all active:scale-95 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground">記帳類別管理</p>
              <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                主次類別 · {categoryGroups.length} 個大類
              </p>
            </div>
          </button>

          {/* 固定支出與訂閱卡片 */}
          <button
            onClick={() => setOpenFixedExpenses(true)}
            className="bouncy flex flex-col items-start gap-2.5 rounded-3xl neu p-4 text-left transition-all active:scale-95 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-700 dark:text-blue-400">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground">固定支出與訂閱</p>
              <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                自動扣款 · {fixedExpenses.length} 個項目
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Vault PIN Lock */}
      <VaultPinSection />

      {/* Widget */}
      <section className="glass flex items-center justify-between rounded-[1.75rem] px-5 py-4">
        <span className="text-sm font-bold">桌面小工具預覽</span>
        <button
          onClick={() => setShowWidget((s) => !s)}
          className="relative h-7 w-12 rounded-full transition-colors"
          style={{ backgroundColor: showWidget ? "var(--caramel)" : "var(--border)" }}
          aria-label="Toggle widget preview"
        >
          <span
            className="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all"
            style={{ left: showWidget ? "1.55rem" : "0.25rem" }}
          />
        </button>
      </section>
      {showWidget && <WidgetPreview />}

      {/* Export & Import Backup */}
      <ExportSection onImportClick={() => fileInputRef.current?.click()} />

      {/* Recap */}
      <section>
        <SectionTitle zh="回顧故事卡片" en="Recap" />
        <div className="glass mb-3 grid grid-cols-2 gap-1 rounded-[1.5rem] p-1.5">
          {(
            [
              ["month", "月回顧"],
              ["year", "年回顧"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setRecap(m)}
              className={cn(
                "bouncy rounded-2xl py-2 text-sm font-bold",
                recap === m ? "text-primary-foreground" : "text-muted-foreground",
              )}
              style={
                recap === m
                  ? { backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))", boxShadow: "var(--shadow-pop)" }
                  : undefined
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ambient-glow rounded-[2rem] p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <Sparkles className="h-5 w-5 text-primary" />
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            {recap === "month" ? "這個月" : "今年"}我們一起花了
          </p>
          <p className="text-4xl font-extrabold tabular-nums">{money(spent)}</p>
          <p className="mt-3 text-sm">
            共 {rows.length} 筆甜甜的紀錄
            {top ? `，最難忘的是「${top.note}」（${money(top.amount)}）` : ""}。
          </p>
          <p className="mt-4 text-xs text-muted-foreground">繼續一起存錢、一起吃好吃的，下個月見 🧡</p>
        </div>
      </section>

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        open={Boolean(backupModalData)}
        backupData={backupModalData}
        onClose={() => setBackupModalData(null)}
      />

      {/* Category Settings Modal */}
      <CategorySettingsModal
        open={openCategorySettings}
        onClose={() => setOpenCategorySettings(false)}
      />

      {/* Fixed Expenses Modal */}
      <FixedExpenseModal
        open={openFixedExpenses}
        onClose={() => setOpenFixedExpenses(false)}
      />

      {/* Theme Settings Modal */}
      <ThemeSettingsModal
        open={openThemeSettings}
        onClose={() => setOpenThemeSettings(false)}
      />

      {/* Avatar Settings Modal */}
      <AvatarSettingsModal
        open={openAvatarSettings}
        initialUserId={avatarInitialUser}
        onClose={() => setOpenAvatarSettings(false)}
      />
    </div>
  );
}
