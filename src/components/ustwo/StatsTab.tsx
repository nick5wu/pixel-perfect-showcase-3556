import { useMemo, useState } from "react";
import { Lock, Sparkles, ShieldCheck } from "lucide-react";
import { money, iconOf, toKey, useUsTwo, type Category, type Txn } from "@/lib/ustwo";
import { Avatar, SectionTitle, EmptyNote, TxnCard, Lightbox, useLightbox } from "./shared";
import { cn } from "@/lib/utils";

type Mode = "joint" | "private";

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
  const { txns, visible, activeUser, getCat, people } = useUsTwo();
  const [mode, setMode] = useState<Mode>("joint");
  const lb = useLightbox();

  // Joint: all public expense txns
  // Private: ONLY current activeUser's private expense txns
  const rows = useMemo(
    () =>
      txns.filter((t) =>
        t.kind === "expense" &&
        (mode === "joint" ? !t.isPrivate : t.isPrivate && t.payer === activeUser),
      ),
    [txns, mode, activeUser],
  );

  const byCat = useMemo(() => {
    const m = new Map<Category, number>();
    for (const t of rows) m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const total = rows.reduce((s, t) => s + t.amount, 0);
  const mine = rows.filter((t) => t.payer === "me").reduce((s, t) => s + t.amount, 0);
  const hers = total - mine;

  const today = toKey(new Date());
  const todayPaid = { me: 0, her: 0 };
  for (const t of visible) if (t.date === today && t.kind === "expense") todayPaid[t.payer] += t.amount;
  const todayTotal = todayPaid.me + todayPaid.her;
  const todayPct = todayTotal ? (todayPaid.me / todayTotal) * 100 : 50;

  return (
    <div className="space-y-5">
      {/* Mode switcher */}
      <div className="glass grid grid-cols-2 gap-1 rounded-[1.75rem] p-1.5">
        {(
          [
            ["joint", "共同支出統計"],
            ["private", "個人私房錢統計"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "bouncy rounded-3xl py-2.5 text-sm font-bold",
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
            {label}
          </button>
        ))}
      </div>

      {/* Privacy Notice in Private Mode */}
      {mode === "private" && (
        <section className="glass rounded-[1.75rem] p-4 text-xs">
          <div className="flex items-center gap-2 text-primary font-bold">
            <ShieldCheck className="h-4 w-4" />
            <span>私密帳本隔離保護中</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
            這是 <span className="font-bold text-foreground">{people[activeUser].zh}</span> 的專屬秘密小帳本。另一半在首頁、日曆、總覽與圖表完全看不到這些紀錄，亦不計入共同預算。
          </p>
        </section>
      )}

      {/* Today's duel (Only shown in joint mode) */}
      {mode === "joint" && (
        <section>
          <SectionTitle zh="今日付款對決" en="Today's duel" />
          <div className="glass rounded-[1.75rem] p-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              {(["me", "her"] as const).map((who, i) => (
                <div key={who} className={cn("flex min-w-0 items-center gap-2.5", i === 1 && "order-3 flex-row-reverse text-right")}>
                  <Avatar who={who} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-muted-foreground">{who === "me" ? "我今天付了" : "另一半今天付了"}</p>
                    <p className="truncate text-lg font-extrabold tabular-nums" style={{ color: people[who].color }}>
                      {money(todayPaid[who])}
                    </p>
                  </div>
                </div>
              ))}
              <span className="order-2 flex h-8 w-8 items-center justify-center rounded-full neu text-[10px] font-extrabold text-muted-foreground">VS</span>
            </div>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full neu-inset">
              <div className="transition-[width] duration-700" style={{ width: `${todayPct}%`, backgroundColor: people.me.color }} />
              <div className="flex-1 transition-[width] duration-700" style={{ backgroundColor: todayTotal ? people.her.color : "transparent" }} />
            </div>
            <p className="mt-2 text-center text-[11px] font-semibold text-muted-foreground">
              {todayTotal === 0 ? "今天還沒有人花錢，好棒！" : todayPaid.me === todayPaid.her ? "今天平手，默契滿分" : `今天${todayPaid.me > todayPaid.her ? "我" : "她"}多付了 ${money(Math.abs(todayPaid.me - todayPaid.her))}`}
            </p>
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
                    style={{ width: `${(mine / (total || 1)) * 100}%`, backgroundColor: people.me.color }}
                  />
                  <div
                    style={{ width: `${(hers / (total || 1)) * 100}%`, backgroundColor: people.her.color }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs font-bold">
                  <span>🐻 {people.me.zh} {money(mine)}</span>
                  <span>🐰 {people.her.zh} {money(hers)}</span>
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
    </div>
  );
}
