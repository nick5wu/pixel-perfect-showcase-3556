import { useMemo, useState } from "react";
import { Lock, Sparkles, ShieldCheck, Calendar, Trophy, Award, Crown } from "lucide-react";
import { toast } from "sonner";
import { money, iconOf, toKey, useUsTwo, type Category, type Txn } from "@/lib/ustwo";
import { Avatar, SectionTitle, EmptyNote, TxnCard, Lightbox, useLightbox } from "./shared";
import { MonthlyRecapModal } from "./MonthlyRecapModal";
import { PinModal } from "./PinModal";
import { useVaultLock } from "@/lib/vaultLock";
import { cn } from "@/lib/utils";

type Mode = "joint" | "private";
type Period = "today" | "week" | "month";

function Donut({ slices }: { slices: { color: string; value: number }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const stops = slices
    .map((s) => {
      const start = (acc / total) * 100;
      acc += s.value;
      const end = (acc / total) * 100;
      return `${s.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="relative mx-auto h-44 w-44">
      <div
        className="h-full w-full rounded-full"
        style={{ backgroundImage: `conic-gradient(${stops})`, boxShadow: "var(--shadow-soft)" }}
      />
      <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full neu">
        <span className="text-[10px] font-semibold text-muted-foreground">總支出</span>
        <span className="text-base font-extrabold tabular-nums">{money(total)}</span>
      </div>
    </div>
  );
}

export function StatsTab({ onEdit }: { onEdit?: (t: Txn) => void }) {
  const { txns, visible, activeUser, getCat, resolveCat, people } = useUsTwo();
  const [mode, setMode] = useState<Mode>("joint");
  const [period, setPeriod] = useState<Period>("today");
  const [recapOpen, setRecapOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const { hasPin, isUnlocked, lock } = useVaultLock();
  const lb = useLightbox();

  const handleModeSwitch = (m: Mode) => {
    if (m === "private" && hasPin && !isUnlocked) {
      setPinModalOpen(true);
      return;
    }
    setMode(m);
  };

  // Joint: all public expense txns
  // Private: ONLY current activeUser's private expense txns (only if unlocked or no PIN)
  const rows = useMemo(() => {
    if (mode === "private" && hasPin && !isUnlocked) return [];
    return txns.filter(
      (t) =>
        t.kind === "expense" &&
        (mode === "joint" ? !t.isPrivate : t.isPrivate && t.payer === activeUser),
    );
  }, [txns, mode, activeUser, hasPin, isUnlocked]);

  const byCat = useMemo(() => {
    const m = new Map<Category, number>();
    for (const t of rows) {
      // 依解析後的大類別群組進行歸納，完美整併新舊單複層資料
      const resolved = resolveCat(t.category, t.subCategory);
      const catKey = resolved.group.id;
      m.set(catKey, (m.get(catKey) ?? 0) + t.amount);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows, resolveCat]);

  const total = rows.reduce((s, t) => s + t.amount, 0);

  // Period-based payment duel calculations
  const periodPaid = useMemo(() => {
    const today = toKey(new Date());
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfWeekKey = toKey(startOfWeek);
    const monthKey = today.slice(0, 7);

    const paid = { me: 0, her: 0 };
    for (const t of visible) {
      if (t.kind !== "expense" || t.isPrivate) continue;
      if (period === "today" && t.date === today) {
        paid[t.payer] += t.amount;
      } else if (period === "week" && t.date >= startOfWeekKey && t.date <= today) {
        paid[t.payer] += t.amount;
      } else if (period === "month" && t.date.startsWith(monthKey)) {
        paid[t.payer] += t.amount;
      }
    }
    return paid;
  }, [visible, period]);

  const periodTotal = periodPaid.me + periodPaid.her;
  const periodPct = periodTotal ? Math.round((periodPaid.me / periodTotal) * 100) : 50;

  const duelComment = useMemo(() => {
    if (periodTotal === 0) {
      return period === "today"
        ? "今天還沒有人花錢，好棒！"
        : period === "week"
          ? "本週還沒有支出紀錄"
          : "本月還沒有支出紀錄";
    }
    if (periodPaid.me === periodPaid.her) {
      return "雙方出資平手，默契滿分 💖";
    }
    const winner = periodPaid.me > periodPaid.her ? people.me.zh : people.her.zh;
    const diff = Math.abs(periodPaid.me - periodPaid.her);
    return `${period === "today" ? "今天" : period === "week" ? "本週" : "本月"}由 ${winner} 多付了 ${money(diff)} 🌟`;
  }, [periodTotal, periodPaid, period, people]);

  return (
    <div className="space-y-5">
      {/* Mode switcher */}
      <div className="glass grid grid-cols-2 gap-1 rounded-[1.75rem] p-1.5">
        {(
          [
            ["joint", "共同支出統計"],
            ["private", hasPin && !isUnlocked ? "私房錢 (🔒已上鎖)" : "個人私房錢統計"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => handleModeSwitch(m)}
            className={cn(
              "bouncy rounded-3xl py-2.5 text-sm font-bold flex items-center justify-center gap-1.5",
              mode === m ? "text-primary-foreground" : "text-muted-foreground",
            )}
            style={
              mode === m
                ? {
                    backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
                    boxShadow: "var(--shadow-pop)",
                  }
                : undefined
            }
          >
            {m === "private" && hasPin && (isUnlocked ? "🔓" : "🔒")}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Privacy Notice in Private Mode */}
      {mode === "private" && (
        <section className="glass rounded-[1.75rem] p-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold">
              <ShieldCheck className="h-4 w-4" />
              <span>私密帳本隔離保護中</span>
            </div>
            {hasPin && isUnlocked && (
              <button
                onClick={() => {
                  lock();
                  setMode("joint");
                  toast.info("🔒 私密帳本已重新上鎖");
                }}
                className="bouncy flex items-center gap-1 rounded-xl neu px-2.5 py-1 text-[11px] font-bold text-muted-foreground active:scale-95"
              >
                <Lock className="h-3 w-3" />
                立即上鎖
              </button>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
            這是 <span className="font-bold text-foreground">{people[activeUser].zh}</span> 的專屬秘密小帳本。另一半在首頁、日曆、總覽與圖表完全看不到這些紀錄，亦不計入共同預算。
          </p>
        </section>
      )}

      {/* Period Duel (Joint mode) */}
      {mode === "joint" && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <SectionTitle zh="情侶付款對決" en="Couple's duel" />
            <div className="flex rounded-2xl neu p-1 gap-1 text-[11px]">
              {(
                [
                  ["today", "今日"],
                  ["week", "本週"],
                  ["month", "本月"],
                ] as [Period, string][]
              ).map(([p, label]) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "bouncy rounded-xl px-2.5 py-1 font-bold transition-all",
                    period === p ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-[1.75rem] p-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              {(["me", "her"] as const).map((who, i) => (
                <div key={who} className={cn("flex min-w-0 items-center gap-2.5", i === 1 && "order-3 flex-row-reverse text-right")}>
                  <div className="relative shrink-0">
                    <Avatar who={who} size="md" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-muted-foreground truncate">
                      {people[who]?.zh || (who === "me" ? "我" : "對方")} 付了
                    </p>
                    <p className="truncate text-lg font-extrabold tabular-nums" style={{ color: people[who].color }}>
                      {money(periodPaid[who])}
                    </p>
                  </div>
                </div>
              ))}
              <span className="order-2 flex h-8 w-8 items-center justify-center rounded-full neu text-[10px] font-extrabold text-muted-foreground">VS</span>
            </div>

            <div className="mt-3 flex h-3 overflow-hidden rounded-full neu-inset">
              <div
                className="transition-[width] duration-700"
                style={{ width: `${periodPct}%`, backgroundColor: people.me.color }}
              />
              <div
                className="flex-1 transition-[width] duration-700"
                style={{ backgroundColor: periodTotal ? people.her.color : "transparent" }}
              />
            </div>

            <p className="mt-2 text-center text-[11px] font-semibold text-muted-foreground">
              {duelComment}
            </p>

            <button
              onClick={() => setRecapOpen(true)}
              className="bouncy mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl neu py-2.5 text-xs font-bold text-foreground active:scale-95"
            >
              <Sparkles className="h-4 w-4 text-[var(--caramel)]" />
              <span>查看情侶月度財務小報卡片 💌</span>
            </button>
          </div>
        </section>
      )}

      {/* Main Charts */}
      {rows.length === 0 ? (
        <EmptyNote text={mode === "private" ? "你還沒有私房錢紀錄 🤫" : "還沒有共同支出紀錄"} />
      ) : (
        <>
          <section className="glass rounded-[2rem] p-5">
            <Donut
              slices={byCat.map(([c, v]) => ({ color: getCat(c).tint, value: v }))}
            />
            <div className="mt-5 space-y-2.5">
              {byCat.map(([c, v]) => {
                const pct = Math.round((v / total) * 100);
                const cd = getCat(c);
                const Icon = iconOf(cd);
                return (
                  <div key={c} className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `color-mix(in oklch, ${cd.tint} 26%, white)` }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: `color-mix(in oklch, ${cd.tint} 80%, black)` }}
                      />
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{cd.zh}</span>
                        <span className="tabular-nums">
                          {money(v)} · {pct}%
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full neu-inset">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: cd.tint }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Joint breakdown comparison */}
          {mode === "joint" && (
            <section>
              <SectionTitle zh="誰付得多？" en="Who paid more" />
              <div className="glass rounded-[1.75rem] p-4">
                <div className="flex h-5 overflow-hidden rounded-full neu-inset">
                  <div
                    style={{ width: `${(periodPaid.me / (periodTotal || 1)) * 100}%`, backgroundColor: people.me.color }}
                  />
                  <div
                    style={{ width: `${(periodPaid.her / (periodTotal || 1)) * 100}%`, backgroundColor: people.her.color }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs font-bold">
                  <span>🐻 {people.me.zh} {money(periodPaid.me)}</span>
                  <span>🐰 {people.her.zh} {money(periodPaid.her)}</span>
                </div>
              </div>
            </section>
          )}

          {/* Private Mode: List of private records with edit support */}
          {mode === "private" && (
            <section>
              <SectionTitle zh="私房錢明細列表" en="Private records" />
              <div className="space-y-2.5">
                {rows.map((t, i) => (
                  <TxnCard
                    key={t.id}
                    t={t}
                    index={i}
                    onPhoto={lb.setPhoto}
                    {...(onEdit ? { onEdit } : {})}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {lb.photo && <Lightbox src={lb.photo} onClose={lb.close} />}

      {/* 4 位數 PIN 碼解鎖彈窗 */}
      <PinModal
        open={pinModalOpen}
        mode="unlock"
        title="解鎖私房錢帳本"
        description="請輸入 4 位數 PIN 碼以解鎖個人私密花費"
        onSuccess={() => {
          setPinModalOpen(false);
          setMode("private");
        }}
        onCancel={() => setPinModalOpen(false)}
      />

      {/* 情侶月度財務小報卡片 */}
      <MonthlyRecapModal
        open={recapOpen}
        onClose={() => setRecapOpen(false)}
      />
    </div>
  );
}
