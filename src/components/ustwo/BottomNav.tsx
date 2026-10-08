import { PiggyBank, ListFilter, House, ChartPie, Settings, Sprout } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type Tab = "savings" | "overview" | "home" | "farm" | "stats" | "settings";

const TABS: { id: Tab; zh: string; icon: typeof House }[] = [
  { id: "savings", zh: "存錢", icon: PiggyBank },
  { id: "overview", zh: "總覽", icon: ListFilter },
  { id: "home", zh: "首頁", icon: House },
  { id: "farm", zh: "農場", icon: Sprout },
  { id: "stats", zh: "統計", icon: ChartPie },
  { id: "settings", zh: "設定", icon: Settings },
];

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pointer-events-none"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
      }}
    >
      <div className="glass-strong flex w-full max-w-md items-center justify-between gap-1 rounded-[2rem] p-2 pointer-events-auto shadow-lg">
        {TABS.map(({ id, zh, icon: Icon }) => {
          const active = tab === id;
          return (
            <motion.button
              key={id}
              whileTap={{ scale: 0.92 }}
              onClick={() => onChange(id)}
              className={cn(
                "bouncy flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-3xl py-1.5 text-[11px] font-semibold transition-all select-none",
                active ? "text-primary-foreground font-black" : "text-muted-foreground hover:text-foreground",
              )}
              style={
                active
                  ? {
                      backgroundImage:
                        "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
                      boxShadow: "var(--shadow-pop)",
                    }
                  : {}
              }
              aria-label={zh}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.6 : 2.2} />
              <span className="truncate">{zh}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
