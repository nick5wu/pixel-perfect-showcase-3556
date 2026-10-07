import { useState, useRef } from "react";
import { Heart, Sparkles, Pencil, Check, X, Sun, Moon, Monitor, Download, Wallet, Cloud } from "lucide-react";
import { toast } from "sonner";
import { money, toKey, useUsTwo, type UserId, type DarkMode } from "@/lib/ustwo";
import { Avatar, SectionTitle } from "./shared";
import { WidgetPreview } from "./WidgetPreview";
import { cn } from "@/lib/utils";

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
  const { people, setPerson } = useUsTwo();
  if (!open || !who) return null;
  const p = people[who];

  return <NicknameModalInner who={who} p={p} onClose={onClose} onSave={setPerson} />;
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
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/35 backdrop-blur-sm"
      />
      <div className="glass-strong pop-in relative w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="bouncy absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full neu"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
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
            className="bouncy relative"
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
                      "bouncy flex h-9 w-9 items-center justify-center rounded-xl text-lg",
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
              className="mt-1 h-11 w-full rounded-2xl neu-inset px-4 text-sm font-semibold outline-none"
            />
          </div>
          <div>
            <label className="px-1 text-xs font-bold text-muted-foreground">英文名稱 / 代稱</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 12))}
              placeholder="例如：Me / Darling"
              className="mt-1 h-11 w-full rounded-2xl neu-inset px-4 text-sm font-semibold outline-none"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="bouncy h-11 flex-1 rounded-2xl neu text-sm font-bold text-muted-foreground"
          >
            取消
          </button>
          <button
            type="button"
            onClick={save}
            className="bouncy h-11 flex-1 rounded-2xl text-sm font-extrabold text-primary-foreground"
            style={{
              backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            儲存修改
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Person card (Stable layout, opens modal on click) ─────────────────────────

function PersonCard({ who, onEdit }: { who: UserId; onEdit: () => void }) {
  const { people } = useUsTwo();
  const p = people[who];

  return (
    <div
      onClick={onEdit}
      role="button"
      tabIndex={0}
      className="glass bouncy flex-1 cursor-pointer rounded-[1.75rem] p-4 text-center transition-all hover:shadow-md"
    >
      <div
        className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/70 text-2xl shadow-[var(--shadow-soft)]"
        style={{ backgroundColor: `color-mix(in oklch, ${p.color} 22%, white)` }}
      >
        {p.emoji}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          <Pencil className="h-2.5 w-2.5" />
        </span>
      </div>
      <div className="mt-3">
        <p className="truncate text-sm font-bold">{p.zh}</p>
        <p className="truncate text-xs font-medium text-muted-foreground">{p.name}</p>
      </div>
      <div className="mt-2.5">
        <span className="inline-flex items-center gap-1 rounded-full neu px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
          點擊修改
        </span>
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
          <input
            type="date"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            max={toKey(new Date())}
            className="h-9 rounded-2xl neu-inset px-3 text-sm outline-none"
            style={{ colorScheme: "light" }}
          />
          <button onClick={commit} className="bouncy flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-4 w-4" />
          </button>
          <button onClick={() => { setDraft(anniversary); setEditing(false); }} className="bouncy flex h-8 w-8 items-center justify-center rounded-full neu">
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

// ─── Dark mode toggle ─────────────────────────────────────────────────────────

const DARK_OPTIONS: { value: DarkMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "淺色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟系統", icon: Monitor },
];

function DarkModeToggle() {
  const { darkMode, setDarkMode } = useUsTwo();
  return (
    <section className="glass rounded-[1.75rem] px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">外觀主題</span>
      </div>
      <div className="glass mt-3 grid grid-cols-3 gap-1 rounded-full p-1">
        {DARK_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setDarkMode(value)}
            className={cn(
              "bouncy flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold",
              darkMode === value ? "text-primary-foreground" : "text-muted-foreground",
            )}
            style={
              darkMode === value
                ? { backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))", boxShadow: "var(--shadow-soft)" }
                : undefined
            }
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
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

// ─── CSV Export ───────────────────────────────────────────────────────────────

function csvEscape(v: string | number | boolean): string {
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function ExportSection() {
  const { txns, people, getCat } = useUsTwo();

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

  return (
    <section className="glass rounded-[1.75rem] px-5 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">匯出帳本</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">匯出全部 {txns.length} 筆為 CSV（Excel 可讀）</p>
        </div>
        <button
          onClick={exportCSV}
          className="bouncy flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-bold text-primary-foreground"
          style={{ backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))", boxShadow: "var(--shadow-soft)" }}
        >
          <Download className="h-4 w-4" />
          下載 CSV
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
  const { visible } = useUsTwo();
  const [showWidget, setShowWidget] = useState(true);
  const [recap, setRecap] = useState<"month" | "year">("month");
  const [editingWho, setEditingWho] = useState<UserId | null>(null);

  const prefix = recap === "month" ? toKey(new Date()).slice(0, 7) : toKey(new Date()).slice(0, 4);
  const rows = visible.filter((t) => t.date.startsWith(prefix) && t.kind === "expense");
  const spent = rows.reduce((s, t) => s + t.amount, 0);
  const top = rows.slice().sort((a, b) => b.amount - a.amount)[0];

  return (
    <div className="space-y-5">
      {/* Cloud Sync section */}
      <CloudSection onOpenCloud={onOpenCloud} />

      {/* Partner profiles */}
      <section className="glass rounded-[2rem] p-5">
        <SectionTitle zh="我們倆" en="Partner profiles" />
        <div className="flex gap-3">
          <PersonCard who="me" onEdit={() => setEditingWho("me")} />
          <PersonCard who="her" onEdit={() => setEditingWho("her")} />
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

      {/* Dark mode */}
      <DarkModeToggle />

      {/* Budget */}
      <BudgetEditor />

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

      {/* Export */}
      <ExportSection />

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
    </div>
  );
}
