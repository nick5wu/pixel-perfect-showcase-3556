import { useState, useEffect } from "react";
import {
  Cloud,
  Check,
  Copy,
  Users,
  KeyRound,
  Database,
  RefreshCw,
  Unlink,
  Sparkles,
  X,
  ExternalLink,
  Code2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useUsTwo } from "@/lib/ustwo";
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function CloudModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    cloudStatus,
    coupleCode,
    isPaired,
    createCoupleAccount,
    joinCoupleAccount,
    disconnectCoupleAccount,
    syncLocalToCloud,
    refreshFromCloud,
    txns,
  } = useUsTwo();

  const [tab, setTab] = useState<"pair" | "config" | "sql">("pair");

  // Config tab state
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Pair tab state
  const [joinCode, setJoinCode] = useState("");
  const [pairing, setPairing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (open) {
      const cfg = getSupabaseConfig();
      setUrl(cfg.url);
      setAnonKey(cfg.anonKey);
      setTestResult(null);
    }
  }, [open]);

  const copyCode = () => {
    if (!coupleCode) return;
    navigator.clipboard.writeText(coupleCode);
    toast.success("小窩邀請碼已複製！快發給另一半吧 💌");
  };

  const handleSaveConfig = async () => {
    if (!url.trim() || !anonKey.trim()) {
      toast.error("請輸入完整的 Supabase URL 與 Anon Key");
      return;
    }
    saveSupabaseConfig(url.trim(), anonKey.trim());
    toast.success("已儲存 Supabase 設定 ✨");
    setTesting(true);
    const res = await testSupabaseConnection();
    setTesting(false);
    setTestResult(res);
    if (res.ok) {
      toast.success(res.message);
      refreshFromCloud();
    } else {
      toast.error(res.message);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    const res = await testSupabaseConnection();
    setTesting(false);
    setTestResult(res);
    if (res.ok) toast.success(res.message);
    else toast.error(res.message);
  };

  const handleCreateRoom = async () => {
    setPairing(true);
    const res = await createCoupleAccount();
    setPairing(false);
    if (res.ok) {
      toast.success(`成功建立小窩！邀請碼為：${res.code} 🎉`);
    } else {
      toast.error(res.error || "建立失敗");
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      toast("請先輸入另一半的小窩邀請碼 ✍️");
      return;
    }
    setPairing(true);
    const res = await joinCoupleAccount(joinCode.trim());
    setPairing(false);
    if (res.ok) {
      toast.success("成功加入小窩！雙人資料已即時連線同步 💕");
      setJoinCode("");
    } else {
      toast.error(res.error || "加入失敗");
    }
  };

  const handleSyncToCloud = async () => {
    setSyncing(true);
    const res = await syncLocalToCloud();
    setSyncing(false);
    if (res.ok) {
      toast.success(`已將本地 ${res.count} 筆記帳同步至雲端小窩 ☁️✨`);
    } else {
      toast.error(res.error || "同步失敗");
    }
  };

  const copySqlSchema = () => {
    const sql = `-- 請在 Supabase Dashboard -> SQL Editor 執行此腳本
create table if not exists public.couples (
  id text primary key,
  couple_code text unique not null,
  name text not null default '我們倆的記帳小窩',
  anniversary text not null default '2021-10-16',
  budget numeric not null default 0,
  people jsonb not null default '{"me":{"name":"Me","zh":"我","emoji":"🐻","color":"var(--mine)"},"her":{"name":"Her","zh":"她","emoji":"🐰","color":"var(--hers)"}}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.transactions (
  id text primary key,
  couple_id text not null references public.couples(id) on delete cascade,
  date text not null,
  amount numeric not null,
  kind text not null,
  category text not null,
  note text not null default '',
  payer text not null,
  is_private boolean not null default false,
  photo text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.goals (
  id text primary key,
  couple_id text not null references public.couples(id) on delete cascade,
  title text not null,
  zh text not null,
  icon text not null default 'sparkles',
  tint text not null default 'var(--cat-1)',
  target numeric not null default 0,
  saved numeric not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.couples enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;

create policy "couples_all" on public.couples for all using (true) with check (true);
create policy "txns_all" on public.transactions for all using (true) with check (true);
create policy "goals_all" on public.goals for all using (true) with check (true);

begin;
  alter publication supabase_realtime add table public.couples;
  alter publication supabase_realtime add table public.transactions;
  alter publication supabase_realtime add table public.goals;
commit;

insert into storage.buckets (id, name, public) values ('receipts', 'receipts', true) on conflict do nothing;
create policy "receipts_read" on storage.objects for select using (bucket_id = 'receipts');
create policy "receipts_insert" on storage.objects for insert with check (bucket_id = 'receipts');`;

    navigator.clipboard.writeText(sql);
    toast.success("已複製 SQL 腳本！可直接貼至 Supabase SQL Editor 執行 📋");
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[oklch(0.22_0.02_55/0.5)] backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto no-scrollbar rounded-[2.5rem] glass-strong p-6 shadow-2xl"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-primary-foreground shadow-sm"
                  style={{ backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))" }}
                >
                  <Cloud className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold">雲端雙人同步設定</h2>
                  <p className="text-[11px] text-muted-foreground">Supabase Database & Realtime</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bouncy flex h-11 w-11 items-center justify-center rounded-full neu active:scale-95"
                aria-label="關閉"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

        {/* Status banner */}
        <div
          className={cn(
            "mb-4 flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-semibold",
            cloudStatus === "connected" && isPaired
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : cloudStatus === "connecting"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-muted text-muted-foreground",
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full animate-pulse",
                cloudStatus === "connected" && isPaired
                  ? "bg-emerald-500"
                  : cloudStatus === "connecting"
                    ? "bg-amber-500"
                    : "bg-zinc-400",
              )}
            />
            <span>
              {cloudStatus === "connected" && isPaired
                ? "已連線雲端小窩 (雙人即時同步中)"
                : isSupabaseConfigured()
                  ? isPaired
                    ? "雲端連線準備中..."
                    : "Supabase 已連線，尚未綁定小窩"
                  : "尚未設定 Supabase (目前為本機離線模式)"}
            </span>
          </div>
          {isPaired && (
            <button
              onClick={() => {
                disconnectCoupleAccount();
                toast("已解除小窩綁定");
              }}
              className="text-[10px] text-destructive underline"
            >
              解除
            </button>
          )}
        </div>

        {/* Tab switcher */}
        <div className="glass mb-4 grid grid-cols-3 gap-1 rounded-2xl p-1 text-xs font-bold">
          <button
            onClick={() => setTab("pair")}
            className={cn(
              "bouncy rounded-xl py-2",
              tab === "pair" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground",
            )}
          >
            雙人綁定
          </button>
          <button
            onClick={() => setTab("config")}
            className={cn(
              "bouncy rounded-xl py-2",
              tab === "config" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground",
            )}
          >
            連線金鑰
          </button>
          <button
            onClick={() => setTab("sql")}
            className={cn(
              "bouncy rounded-xl py-2",
              tab === "sql" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground",
            )}
          >
            資料表架構
          </button>
        </div>

        {/* TAB 1: PAIRING */}
        {tab === "pair" && (
          <div className="space-y-4">
            {isPaired && coupleCode ? (
              <div className="rounded-3xl neu-inset p-4 text-center">
                <p className="text-xs text-muted-foreground">你們倆的小窩邀請碼</p>
                <p className="my-2 font-mono text-3xl font-black tracking-wider text-primary">
                  {coupleCode}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  把這串代碼發給另一半，她/他輸入即可共同記帳 💕
                </p>
                <div className="mt-3 flex justify-center gap-2">
                  <button
                    onClick={copyCode}
                    className="bouncy flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    複製邀請碼
                  </button>
                  <button
                    onClick={handleSyncToCloud}
                    disabled={syncing}
                    className="bouncy flex items-center gap-1.5 rounded-2xl neu px-4 py-2 text-xs font-bold"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
                    上傳本機資料 ({txns.length})
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-3xl glass p-4 text-center">
                  <p className="text-sm font-bold">還沒有專屬小窩？</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    點擊建立，生成一個小窩專屬邀請碼，兩人輸入同一個代碼即可！
                  </p>
                  <button
                    onClick={handleCreateRoom}
                    disabled={pairing}
                    className="bouncy mt-3 w-full rounded-2xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow"
                  >
                    {pairing ? "建立中..." : "建立新小窩 ✨"}
                  </button>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="h-[1px] w-full bg-border" />
                  <span className="absolute bg-background px-3 text-[11px] font-semibold text-muted-foreground">
                    或是
                  </span>
                </div>

                <div className="rounded-3xl glass p-4">
                  <p className="text-sm font-bold">加入另一半的小窩</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    輸入另一半分享給你的 6 碼邀請碼（例如 USTWO-8823）：
                  </p>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="例如 USTWO-8823"
                      className="h-10 flex-1 rounded-2xl neu-inset px-3 font-mono text-xs font-bold outline-none uppercase"
                    />
                    <button
                      onClick={handleJoinRoom}
                      disabled={pairing}
                      className="bouncy rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow"
                    >
                      {pairing ? "加入中..." : "加入小窩 💕"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-amber-500/10 p-3 text-[11px] text-amber-700 dark:text-amber-300">
              <span className="font-bold">🔒 隱私保護保證：</span>
              記帳時勾選「私人花費」，該筆紀錄在雲端查詢時會被嚴格隔離，另一半的手機首頁、日曆、總覽與圖表完全看不到這筆資料！
            </div>
          </div>
        )}

        {/* TAB 2: CONFIG */}
        {tab === "config" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Supabase Project URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="mt-1 h-10 w-full rounded-2xl neu-inset px-3 text-xs outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground">Supabase Anon Key (Public API)</label>
              <textarea
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                rows={3}
                className="mt-1 w-full rounded-2xl neu-inset p-3 font-mono text-[11px] outline-none"
              />
            </div>

            {testResult && (
              <div
                className={cn(
                  "rounded-2xl p-3 text-xs font-semibold",
                  testResult.ok
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {testResult.message}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveConfig}
                className="bouncy flex-1 rounded-2xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow"
              >
                儲存設定
              </button>
              <button
                onClick={handleTest}
                disabled={testing}
                className="bouncy rounded-2xl neu px-4 py-2.5 text-xs font-bold"
              >
                {testing ? "連線中..." : "測試連線"}
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              💡 也可以在專案根目錄建立 <code className="rounded bg-muted px-1">.env</code> 檔案，設定{" "}
              <code className="rounded bg-muted px-1">VITE_SUPABASE_URL</code> 與{" "}
              <code className="rounded bg-muted px-1">VITE_SUPABASE_ANON_KEY</code>。
            </p>
          </div>
        )}

        {/* TAB 3: SQL SCHEMA */}
        {tab === "sql" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              若第一次使用 Supabase，請前往 Supabase 控制台的{" "}
              <span className="font-bold text-foreground">SQL Editor</span>，貼上此腳本建立表格與 Realtime 廣播：
            </p>
            <div className="max-h-52 overflow-y-auto rounded-2xl neu-inset p-3">
              <pre className="font-mono text-[10px] text-muted-foreground whitespace-pre-wrap">
{`-- couples, transactions, goals 表格與 Storage bucket
create table if not exists public.couples (...);
create table if not exists public.transactions (...);
create table if not exists public.goals (...);
alter publication supabase_realtime add table ...;`}
              </pre>
            </div>
            <button
              onClick={copySqlSchema}
              className="bouncy flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow"
            >
              <Copy className="h-3.5 w-3.5" />
              複製完整 SQL 建立腳本
            </button>
          </div>
        )}
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}
