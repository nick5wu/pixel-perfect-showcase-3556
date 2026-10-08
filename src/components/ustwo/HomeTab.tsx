import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { toKey, useUsTwo, type Txn } from "@/lib/ustwo";
import { BudgetBanner } from "./BudgetBanner";
import { EmptyNote, Lightbox, SectionTitle, TxnCard, useLightbox } from "./shared";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function startOfWeek(d: Date) {
  const c = new Date(d);
  c.setDate(c.getDate() - c.getDay());
  return c;
}

export function HomeTab({
  selected,
  onSelect,
  onEdit,
}: {
  selected: string;
  onSelect: (d: string) => void;
  onEdit: (t: Txn) => void;
}) {
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

  return (
    <div className="space-y-5">
      {/* Budget progress banner — only shows when budget is set */}
      <BudgetBanner />

      {/* Calendar */}
      <section className="glass rounded-[2rem] p-4 overscroll-contain">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {expanded && (
              <button
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                className="bouncy flex h-11 w-11 items-center justify-center rounded-full neu active:scale-95"
                aria-label="上個月"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <p className="px-1 text-base font-bold">
              {cursor.getFullYear()} 年 {cursor.getMonth() + 1} 月
            </p>
            {expanded && (
              <button
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                className="bouncy flex h-11 w-11 items-center justify-center rounded-full neu active:scale-95"
                aria-label="下個月"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="bouncy flex min-h-[44px] items-center gap-1.5 rounded-full neu px-4 py-2 text-xs font-bold active:scale-95"
          >
            {expanded ? "收合" : "展開月曆"}
            <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-bold text-muted-foreground">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div
          className="grid grid-cols-7 gap-1 overflow-hidden transition-[max-height] duration-500 ease-out overscroll-contain touch-pan-y"
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

      <section>
        <SectionTitle zh={`${selected.slice(5)} 的花費`} en="Selected date" />
        <div className="space-y-2.5">
          {dayTxns.length ? (
            dayTxns.map((t, i) => (
              <TxnCard key={t.id} t={t} index={i} onPhoto={lb.setPhoto} onEdit={onEdit} />
            ))
          ) : (
            <EmptyNote text="這天還沒有記帳，很省錢喔 🎉" />
          )}
        </div>
      </section>

      <Lightbox src={lb.photo} onClose={lb.close} />
    </div>
  );
}
