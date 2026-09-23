import { PiggyBank, ListFilter, House, ChartPie, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab = "savings" | "overview" | "home" | "stats" | "settings";

const TABS: { id: Tab; zh: string; icon: typeof House }[] = [
  { id: "savings", zh: "存錢", icon: PiggyBank },
  { id: "overview", zh: "總覽", icon: ListFilter },
  { id: "home", zh: "首頁", icon: House },
  { id: "stats", zh: "統計", icon: ChartPie },
  { id: "settings", zh: "設定", icon: Settings },
];

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <div className="glass-strong flex w-full max-w-md items-center justify-between gap-1 rounded-[2rem] p-2">
        {TABS.map(({ id, zh, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={cn(
                "bouncy flex flex-1 flex-col items-center gap-0.5 rounded-3xl py-2 text-[11px] font-semibold",
                active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              style={
                active
                  ? {
                      backgroundImage:
                        "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
                      boxShadow: "var(--shadow-pop)",
                    }
                  : undefined
              }
            >
              <Icon className="h-5 w-5" strokeWidth={2.3} />
              {zh}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
