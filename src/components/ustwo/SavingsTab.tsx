import { Plus } from "lucide-react";
import { toast } from "sonner";
import { money, useUsTwo } from "@/lib/ustwo";
import { SectionTitle } from "./shared";

export function SavingsTab() {
  const { goals, addToGoal } = useUsTwo();
  const total = goals.reduce((s, g) => s + g.saved, 0);
  const target = goals.reduce((s, g) => s + g.target, 0);

  return (
    <div className="space-y-5">
      <section className="glass rounded-[2rem] p-5 text-center">
        <p className="text-xs font-semibold text-muted-foreground">我們一起存了</p>
        <p className="mt-1 text-4xl font-extrabold tabular-nums">{money(total)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          目標總額 {money(target)} · 完成 {Math.round((total / target) * 100)}%
        </p>
      </section>

      <section>
        <SectionTitle zh="夢想撲滿" en="Dream piggy banks" />
        <div className="space-y-3">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
            return (
              <div key={g.id} className="glass rounded-[1.75rem] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl neu text-xl">
                    {g.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{g.zh}</p>
                    <p className="text-xs text-muted-foreground">{g.title}</p>
                  </div>
                  <button
                    onClick={() => {
                      addToGoal(g.id, 1000);
                      toast.success(`往 ${g.zh} 投了 NT$1,000 🐷`);
                    }}
                    className="bouncy flex h-10 items-center gap-1 rounded-2xl px-3 text-xs font-bold text-primary-foreground"
                    style={{
                      backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
                      boxShadow: "var(--shadow-pop)",
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    存 1,000
                  </button>
                </div>

                <div className="mt-3 h-4 w-full overflow-hidden rounded-full neu-inset">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{
                      width: `${pct}%`,
                      backgroundImage:
                        "linear-gradient(90deg, var(--caramel), var(--caramel-soft))",
                    }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs font-semibold">
                  <span className="tabular-nums">{money(g.saved)}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {pct}% · 目標 {money(g.target)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
