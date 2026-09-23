import { useMemo, useState } from "react";
import { CATEGORIES, PEOPLE, money, useUsTwo, type Category } from "@/lib/ustwo";
import { SectionTitle, EmptyNote } from "./shared";
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

export function StatsTab() {
  const { txns, activeUser } = useUsTwo();
  const [mode, setMode] = useState<Mode>("joint");

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

  return (
    <div className="space-y-5">
      <div className="glass grid grid-cols-2 gap-1 rounded-[1.75rem] p-1.5">
        {(
          [
            ["joint", "共同支出"],
            ["private", "個人私房錢"],
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

      {rows.length === 0 ? (
        <EmptyNote text={mode === "private" ? "你還沒有私房錢紀錄 🤫" : "還沒有共同支出紀錄"} />
      ) : (
        <>
          <section className="glass rounded-[2rem] p-5">
            <Donut
              slices={byCat.map(([c, v]) => ({ color: `var(--cat-${catIndex(c)})`, value: v }))}
            />
            <div className="mt-5 space-y-2.5">
              {byCat.map(([c, v]) => {
                const pct = Math.round((v / total) * 100);
                const Icon = CATEGORIES[c].icon;
                return (
                  <div key={c} className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `color-mix(in oklch, ${CATEGORIES[c].tint} 26%, white)` }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: `color-mix(in oklch, ${CATEGORIES[c].tint} 80%, black)` }}
                      />
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{CATEGORIES[c].zh}</span>
                        <span className="tabular-nums">
                          {money(v)} · {pct}%
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full neu-inset">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: CATEGORIES[c].tint }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {mode === "joint" && (
            <section>
              <SectionTitle zh="誰付得多？" en="Who paid more" />
              <div className="glass rounded-[1.75rem] p-4">
                <div className="flex h-5 overflow-hidden rounded-full neu-inset">
                  <div
                    style={{ width: `${(mine / (total || 1)) * 100}%`, backgroundColor: PEOPLE.me.color }}
                  />
                  <div
                    style={{ width: `${(hers / (total || 1)) * 100}%`, backgroundColor: PEOPLE.her.color }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs font-bold">
                  <span>🐻 我 {money(mine)}</span>
                  <span>🐰 她 {money(hers)}</span>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function catIndex(c: Category) {
  const order: Category[] = [
    "food",
    "coffee",
    "grocery",
    "date",
    "transit",
    "fun",
    "pet",
    "home",
    "income",
  ];
  const i = order.indexOf(c === "gift" ? "date" : c);
  return (i < 0 ? 0 : i) + 1;
}
