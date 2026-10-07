import { useState, useRef } from "react";
import { Heart, Sparkles, Pencil, Check, X, Sun, Moon, Monitor, Download, Wallet, Cloud } from "lucide-react";
import { money, toKey, useUsTwo, type UserId, type DarkMode } from "@/lib/ustwo";
import { Avatar, SectionTitle } from "./shared";
import { WidgetPreview } from "./WidgetPreview";
import { cn } from "@/lib/utils";

// ─── Inline editable field ────────────────────────────────────────────────────

function InlineEdit({
  label,
  value,
  onSave,
  maxLen = 8,
  placeholder,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  maxLen?: number;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = () => {
    if (draft.trim()) onSave(draft.trim());
    else setDraft(value);
    setEditing(false);
  };
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 shrink-0 text-[11px] font-semibold text-muted-foreground">{label}</span>
      {editing ? (
        <div className="flex flex-1 items-center gap-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, maxLen))}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setDraft(value); setEditing(false); }
            }}
            className="h-8 flex-1 rounded-2xl neu-inset px-3 text-sm outline-none"
            placeholder={placeholder}
          />
          <button onClick={commit} className="bouncy flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => { setDraft(value); setEditing(false); }} className="bouncy flex h-7 w-7 items-center justify-center rounded-full neu">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-between">
          <span className="text-sm font-semibold">{value}</span>
          <button onClick={() => { setDraft(value); setEditing(true); }} className="bouncy flex h-7 w-7 items-center justify-center rounded-full neu">
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Emoji picker ─────────────────────────────────────────────────────────────

const EMOJI_OPTIONS = [
  "🐻","🐰","🐼","🐨","🐯","🦊","🐶","🐱","🐸","🐧",
  "🌸","🌻","🍓","🍭","☀️","🌙","⭐","💫","🧸","🎀",
  "🍀","🌈","🐝","🦋","🐬","🦄","🎸","🍕","🧋","🎹",
];

function EmojiPicker({ current, onPick, onClose }: { current: string; onPick: (e: string) => void; onClose: () => void }) {
  return (
    <div className="pop-in absolute left-0 top-full z-20 mt-2 w-60 rounded-3xl glass-strong p-3 shadow-lg">
      <div className="grid grid-cols-8 gap-1">
        {EMOJI_OPTIONS.map((e) => (
          <button
            key={e}
            onClick={() => { onPick(e); onClose(); }}
            className={cn("bouncy flex h-8 w-8 items-center justify-center rounded-xl text-base", e === current && "neu")}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Person card editor ───────────────────────────────────────────────────────

function PersonCard({ who }: { who: UserId }) {
  const { people, setPerson } = useUsTwo();
  const p = people[who];
  const [emojiOpen, setEmojiOpen] = useState(false);

  return (
    <div className="glass flex-1 rounded-[1.75rem] p-4">
      <div className="relative flex flex-col items-center gap-2">
        <button
          onClick={() => setEmojiOpen((o) => !o)}
          className="relative bouncy"
          aria-label="變更頭像"
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full border border-white/70 text-2xl shadow-[var(--shadow-soft)]"
            style={{ backgroundColor: `color-mix(in oklch, ${p.color} 22%, white)` }}
          >
            {p.emoji}
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Pencil className="h-2.5 w-2.5" />
          </span>
        </button>
        {emojiOpen && (
          <EmojiPicker
            current={p.emoji}
            onPick={(e) => setPerson(who, { emoji: e })}
            onClose={() => setEmojiOpen(false)}
          />
        )}
      </div>
      <div className="mt-3 space-y-2">
        <InlineEdit label="暱稱" value={p.zh} onSave={(v) => setPerson(who, { zh: v })} maxLen={6} placeholder="輸入暱稱" />
        <InlineEdit label="EN" value={p.name} onSave={(v) => setPerson(who, { name: v })} maxLen={10} placeholder="English name" />
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

function CloudSection({ onOpenCloud }: { onOpenCloud?: () => void }) {
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
          <PersonCard who="me" />
          <PersonCard who="her" />
        </div>
      </section>

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
