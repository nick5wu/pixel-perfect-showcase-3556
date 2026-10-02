import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { money, useUsTwo, type Category } from "@/lib/ustwo";
import { EmptyNote, Lightbox, SectionTitle, TxnCard, useLightbox } from "./shared";
import { cn } from "@/lib/utils";

export function OverviewTab() {
  const { visible, categories } = useUsTwo();
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cats, setCats] = useState<Category[]>([]);
  const lb = useLightbox();

  const rows = useMemo(
    () =>
      visible
        .filter((t) => (q ? t.note.toLowerCase().includes(q.toLowerCase()) : true))
        .filter((t) => (from ? t.date >= from : true))
        .filter((t) => (to ? t.date <= to : true))
        .filter((t) => (cats.length ? cats.includes(t.category) : true))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [visible, q, from, to, cats],
  );

  const spent = rows.filter((t) => t.kind === "expense").reduce((s, t) => s + t.amount, 0);
  const groups = rows.reduce<Record<string, typeof rows>>((acc, t) => {
    (acc[t.date] ||= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <section className="glass space-y-3 rounded-[2rem] p-4">
        <div className="flex items-center gap-2 rounded-2xl neu-inset px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋備註，例如：火鍋"
            className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-11 flex-1 rounded-2xl neu-inset px-3 text-xs outline-none"
          />
          <span className="text-xs text-muted-foreground">到</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-11 flex-1 rounded-2xl neu-inset px-3 text-xs outline-none"
          />
        </div>

        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {categories.map(({ id: c, zh, tint }) => {
            const on = cats.includes(c);
            return (
              <button
                key={c}
                onClick={() => setCats((p) => (on ? p.filter((x) => x !== c) : [...p, c]))}
                className={cn(
                  "bouncy shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold",
                  on ? "text-primary-foreground" : "neu text-muted-foreground",
                )}
                style={on ? { backgroundColor: tint } : undefined}
              >
                {zh}
              </button>
            );
          })}
        </div>

        <p className="px-1 text-xs font-semibold text-muted-foreground">
          共 {rows.length} 筆 · 支出 {money(spent)}
        </p>
      </section>

      {Object.keys(groups).length ? (
        Object.entries(groups).map(([date, list]) => (
          <section key={date}>
            <SectionTitle zh={date} en={`${list.length} items`} />
            <div className="space-y-2.5">
              {list.map((t, i) => (
                <TxnCard key={t.id} t={t} index={i} onPhoto={lb.setPhoto} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <EmptyNote text="找不到符合的紀錄，換個條件試試？" />
      )}

      <Lightbox src={lb.photo} onClose={lb.close} />
    </div>
  );
}
