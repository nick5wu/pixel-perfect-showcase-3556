import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { PEOPLE, money, toKey, useUsTwo } from "@/lib/ustwo";
import { Avatar, EmptyNote, Lightbox, SectionTitle, TxnCard, useLightbox } from "./shared";
import { WidgetPreview } from "./WidgetPreview";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function startOfWeek(d: Date) {
  const c = new Date(d);
  c.setDate(c.getDate() - c.getDay());
  return c;
}

export function HomeTab({ selected, onSelect }: { selected: string; onSelect: (d: string) => void }) {
  const { visible } = useUsTwo();
  const [expanded, setExpanded] = useState(false);
  const [cursor, setCursor] = useState(() => new Date(selected));
  const lb = useLightbox();

  const byDay = useMemo(() => {
    const map = new Map<string, { inc: number; exp: number }>();
    for (const t of visible) {
      const cur = map.get(t.date) ?? { inc: 0, exp: 0 };
      if (t.kind === "income") cur.inc += t.amount;
      else cur.exp += t.amount;
      map.set(t.date, cur);
    }
    return map;
  }, [visible]);

  const days = useMemo(() => {
    if (!expanded) {
      const s = startOfWeek(new Date(selected));
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(s);
        d.setDate(s.getDate() + i);
        return d;
      });
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [expanded, selected, cursor]);

  const dayTxns = visible.filter((t) => t.date === selected);
  const today = toKey(new Date());
  const paidToday = (who: "me" | "her") =>
    visible
      .filter((t) => t.date === today && t.kind === "expense" && t.payer === who)
      .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5">
      {/* Calendar */}
      <section className="glass rounded-[2rem] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {expanded && (
              <button
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                className="bouncy flex h-8 w-8 items-center justify-center rounded-full neu"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <p className="px-1 text-base font-bold">
              {cursor.getFullYear()} 年 {cursor.getMonth() + 1} 月
            </p>
            {expanded && (
              <button
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                className="bouncy flex h-8 w-8 items-center justify-center rounded-full neu"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="bouncy flex items-center gap-1 rounded-full neu px-3 py-1.5 text-xs font-bold"
          >
            {expanded ? "收合" : "展開月曆"}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-bold text-muted-foreground">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div
          className="grid grid-cols-7 gap-1 overflow-hidden transition-[max-height] duration-500 ease-out"
          style={{ maxHeight: expanded ? "26rem" : "5.5rem" }}
        >
          {days.map((d) => {
            const key = toKey(d);
            const sums = byDay.get(key);
            const isSel = key === selected;
            const dim = expanded && d.getMonth() !== cursor.getMonth();
            return (
              <button
                key={key}
                onClick={() => {
                  onSelect(key);
                  setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                }}
                className={cn(
                  "bouncy flex h-[4.1rem] flex-col items-center justify-start rounded-2xl px-0.5 pt-1.5 text-[11px]",
                  isSel ? "text-primary-foreground" : dim ? "opacity-35" : "neu",
                )}
                style={
                  isSel
                    ? {
                        backgroundImage:
                          "linear-gradient(150deg, var(--caramel), var(--caramel-soft))",
                        boxShadow: "var(--shadow-pop)",
                      }
                    : undefined
                }
              >
                <span className={cn("font-bold", key === today && !isSel && "text-primary")}>
                  {d.getDate()}
                </span>
                {sums?.exp ? (
                  <span className="mt-0.5 text-[9px] font-semibold tabular-nums">
                    -{Math.round(sums.exp)}
                  </span>
                ) : null}
                {sums?.inc ? (
                  <span
                    className="text-[9px] font-semibold tabular-nums"
                    style={{ color: isSel ? "inherit" : "var(--cat-9)" }}
                  >
                    +{Math.round(sums.inc)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {/* Duel cards */}
      <section className="grid grid-cols-2 gap-3">
        {(["me", "her"] as const).map((who) => (
          <div key={who} className="glass flex flex-col items-center gap-1 rounded-[1.75rem] p-4">
            <Avatar who={who} />
            <p className="text-[11px] font-semibold text-muted-foreground">
              {who === "me" ? "我今天付了" : "另一半今天付了"}
            </p>
            <p className="text-xl font-extrabold tabular-nums" style={{ color: PEOPLE[who].color }}>
              {money(paidToday(who))}
            </p>
          </div>
        ))}
      </section>

      <WidgetPreview />

      <section>
        <SectionTitle zh={`${selected.slice(5)} 的花費`} en="Selected date" />
        <div className="space-y-2.5">
          {dayTxns.length ? (
            dayTxns.map((t, i) => <TxnCard key={t.id} t={t} index={i} onPhoto={lb.setPhoto} />)
          ) : (
            <EmptyNote text="這天還沒有記帳，很省錢喔 🎉" />
          )}
        </div>
      </section>

      <Lightbox src={lb.photo} onClose={lb.close} />
    </div>
  );
}
