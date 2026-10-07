import { useMemo } from "react";
import { money, toKey, useUsTwo } from "@/lib/ustwo";
import { cn } from "@/lib/utils";

/** Monthly joint-expense budget progress banner shown at the top of HomeTab. */
export function BudgetBanner() {
  const { txns, budget } = useUsTwo();

  const spent = useMemo(() => {
    const month = toKey(new Date()).slice(0, 7);
    return txns
      .filter((t) => !t.isPrivate && t.kind === "expense" && t.date.startsWith(month))
      .reduce((s, t) => s + t.amount, 0);
  }, [txns]);

  if (budget <= 0) return null;

  const pct = Math.min(100, Math.round((spent / budget) * 100));
  const over80 = pct >= 80;
  const over100 = pct >= 100;

  return (
    <section
      className={cn(
        "glass pop-in rounded-[1.75rem] px-5 py-4",
        over100 && "ring-1 ring-destructive/50",
      )}
    >
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-bold text-muted-foreground">本月共同支出預算</p>
        <p
          className={cn(
            "text-xs font-extrabold tabular-nums",
            over100 ? "text-destructive" : over80 ? "text-[var(--caramel)]" : "text-foreground",
          )}
        >
          {money(spent)} / {money(budget)}
        </p>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full neu-inset">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${pct}%`,
            backgroundImage: over100
              ? "linear-gradient(90deg, var(--destructive), oklch(0.65 0.22 28))"
              : over80
                ? "linear-gradient(90deg, var(--caramel), oklch(0.72 0.20 32))"
                : "linear-gradient(90deg, var(--caramel), var(--caramel-soft))",
          }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] font-semibold">
        <span className="text-muted-foreground">{pct}% 已使用</span>
        {over100 ? (
          <span className="text-destructive">已超出預算 {money(spent - budget)}</span>
        ) : over80 ? (
          <span style={{ color: "var(--caramel)" }}>快要超支，省著點 🥺</span>
        ) : (
          <span className="text-muted-foreground">還剩 {money(budget - spent)}</span>
        )}
      </div>
    </section>
  );
}
