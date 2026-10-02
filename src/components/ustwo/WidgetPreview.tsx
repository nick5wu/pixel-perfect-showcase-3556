import { money, toKey, useUsTwo } from "@/lib/ustwo";

export function WidgetPreview() {
  const { visible, goals } = useUsTwo();
  const month = toKey(new Date()).slice(0, 7);
  const spent = visible
    .filter((t) => t.date.startsWith(month) && t.kind === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const goal = goals[0] ?? { zh: "還沒有目標", saved: 0, target: 1 };
  const pct = Math.round((goal.saved / goal.target) * 100);

  return (
    <section className="ambient-glow float-soft rounded-[2rem] p-4">
      <p className="mb-2 px-1 text-[11px] font-bold text-muted-foreground">
        iOS 桌面小工具預覽 · Widget preview
      </p>
      <div className="flex gap-3">
        <div className="glass-strong flex-1 rounded-[1.6rem] p-3.5">
          <p className="text-[10px] font-bold text-muted-foreground">本月共同支出</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{money(spent)}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">UsTwo Ledger 🧡</p>
        </div>
        <div className="glass-strong w-[42%] rounded-[1.6rem] p-3.5">
          <p className="text-[10px] font-bold text-muted-foreground">
            {goal.zh}
          </p>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full neu-inset">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                backgroundImage: "linear-gradient(90deg, var(--caramel), var(--caramel-soft))",
              }}
            />
          </div>
          <p className="mt-1.5 text-[11px] font-bold">{pct}%</p>
        </div>
      </div>
    </section>
  );
}
