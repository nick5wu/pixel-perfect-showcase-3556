import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ICONS, TINTS, money, useUsTwo, type Goal } from "@/lib/ustwo";
import { SectionTitle, EmptyNote } from "./shared";
import { cn } from "@/lib/utils";

const GOAL_ICONS = ["plane", "home", "umbrella", "cat", "heart", "gift", "car", "bike", "laptop", "phone", "baby", "piggy", "star", "sparkles", "music", "book"];
const QUICK = [500, 1000, 3000, 5000];

const pop = {
  backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
  boxShadow: "var(--shadow-pop)",
};

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-[oklch(0.22_0.02_55/0.45)] backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%", opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="glass-strong relative max-h-[90vh] w-full max-w-md overflow-y-auto no-scrollbar rounded-t-[2.5rem] p-5 shadow-2xl"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
        {children}
      </motion.div>
    </div>
  );
}

function GoalIcon({ g, size = "h-12 w-12" }: { g: Pick<Goal, "icon" | "tint">; size?: string }) {
  const Icon = ICONS[g.icon] ?? ICONS["piggy"]!;
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-2xl", size)}
      style={{ backgroundColor: `color-mix(in oklch, ${g.tint} 26%, white)` }}
    >
      <Icon className="h-5 w-5" style={{ color: `color-mix(in oklch, ${g.tint} 80%, black)` }} />
    </span>
  );
}

function DepositSheet({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { addToGoal } = useUsTwo();
  const [amt, setAmt] = useState("");
  const n = Number(amt);
  const left = goal.target - goal.saved;
  const submit = () => {
    if (!n || n <= 0) { toast.error("請輸入金額"); return; }
    addToGoal(goal.id, n);
    toast.success(`往「${goal.zh}」存了 ${money(Math.min(n, left))}`);
    onClose();
  };
  return (
    <Sheet onClose={onClose}>
      <div className="mb-4 flex items-center gap-3">
        <GoalIcon g={goal} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">存進「{goal.zh}」</p>
          <p className="text-xs text-muted-foreground">還差 {money(left)}</p>
        </div>
        <button
          onClick={onClose}
          className="bouncy flex h-11 w-11 items-center justify-center rounded-full neu active:scale-95"
          aria-label="關閉"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center gap-2 rounded-2xl neu-inset px-4">
        <span className="text-sm font-bold text-muted-foreground">NT$</span>
        <input
          autoFocus
          inputMode="numeric"
          value={amt}
          onChange={(e) => setAmt(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="0"
          className="h-14 flex-1 bg-transparent text-3xl font-extrabold tabular-nums outline-none"
        />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => setAmt(String((Number(amt) || 0) + q))}
            className="bouncy flex min-h-[44px] items-center justify-center rounded-2xl neu px-2 py-2.5 text-xs font-bold active:scale-95"
          >
            +{q.toLocaleString()}
          </button>
        ))}
      </div>
      <button
        onClick={submit}
        className="bouncy mt-4 h-14 w-full rounded-2xl font-bold text-primary-foreground active:scale-95 shadow-md"
        style={pop}
      >
        存進去
      </button>
    </Sheet>
  );
}

function NewGoalSheet({ onClose }: { onClose: () => void }) {
  const { addGoal } = useUsTwo();
  const [zh, setZh] = useState("");
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [icon, setIcon] = useState("piggy");
  const [tint, setTint] = useState(TINTS[0]!);
  const submit = () => {
    const t = Number(target);
    if (!zh.trim()) { toast.error("請輸入目標名稱"); return; }
    if (!t) { toast.error("請輸入目標金額"); return; }
    addGoal({ zh: zh.trim(), title: title.trim() || zh.trim(), target: t, icon, tint });
    toast.success(`新增目標「${zh.trim()}」`);
    onClose();
  };
  return (
    <Sheet onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-lg font-bold">新增存錢目標</p>
        <button
          onClick={onClose}
          className="bouncy flex h-11 w-11 items-center justify-center rounded-full neu active:scale-95"
          aria-label="關閉"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-2.5">
        <input value={zh} onChange={(e) => setZh(e.target.value)} placeholder="目標名稱，例如：韓國旅行" className="h-11 w-full rounded-2xl neu-inset px-4 text-sm outline-none" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="英文副標（選填）" className="h-11 w-full rounded-2xl neu-inset px-4 text-sm outline-none" />
        <input inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))} placeholder="目標金額 NT$" className="h-11 w-full rounded-2xl neu-inset px-4 text-sm outline-none" />
      </div>
      <p className="mb-2 mt-4 text-xs font-bold text-muted-foreground">圖案</p>
      <div className="grid grid-cols-8 gap-1.5">
        {GOAL_ICONS.map((k) => {
          const Icon = ICONS[k]!;
          return (
            <button key={k} onClick={() => setIcon(k)} className={cn("bouncy flex aspect-square items-center justify-center rounded-xl active:scale-95", icon === k ? "ring-2 ring-primary" : "neu")}
              style={icon === k ? { backgroundColor: `color-mix(in oklch, ${tint} 26%, white)` } : undefined}>
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
      <p className="mb-2 mt-4 text-xs font-bold text-muted-foreground">顏色</p>
      <div className="flex gap-2">
        {TINTS.map((c) => (
          <button key={c} onClick={() => setTint(c)} className={cn("bouncy h-8 w-8 rounded-full active:scale-95", tint === c && "ring-2 ring-foreground/50 ring-offset-2 ring-offset-background")} style={{ backgroundColor: c }} />
        ))}
      </div>
      <button onClick={submit} className="bouncy mt-5 h-14 w-full rounded-2xl font-bold text-primary-foreground active:scale-95 shadow-md" style={pop}>
        建立目標
      </button>
    </Sheet>
  );
}

export function SavingsTab() {
  const { goals, removeGoal } = useUsTwo();
  const [depositId, setDepositId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const total = goals.reduce((s, g) => s + g.saved, 0);
  const target = goals.reduce((s, g) => s + g.target, 0);
  const depositGoal = goals.find((g) => g.id === depositId);

  return (
    <div className="space-y-5">
      <section className="glass rounded-[2rem] p-5 text-center">
        <p className="text-xs font-semibold text-muted-foreground">我們一起存了</p>
        <p className="mt-1 text-4xl font-extrabold tabular-nums">{money(total)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          目標總額 {money(target)} · 完成 {target ? Math.round((total / target) * 100) : 0}%
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <SectionTitle zh="夢想撲滿" en="Dream piggy banks" />
          <button onClick={() => setCreating(true)} className="bouncy mb-3 flex min-h-[44px] items-center gap-1.5 rounded-full neu px-4 py-2 text-xs font-bold active:scale-95">
            <Plus className="h-4 w-4" /> 新增目標
          </button>
        </div>
        <div className="space-y-3">
          {goals.length === 0 && <EmptyNote text="還沒有存錢目標，新增一個吧！" />}
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
            const done = g.saved >= g.target;
            return (
              <div key={g.id} className="glass rounded-[1.75rem] p-4">
                <div className="flex items-center gap-3">
                  <GoalIcon g={g} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{g.zh}</p>
                    <p className="truncate text-xs text-muted-foreground">{g.title}</p>
                  </div>
                  {confirmId === g.id ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button onClick={() => setConfirmId(null)} className="bouncy min-h-[44px] rounded-2xl neu px-4 py-2 text-xs font-bold active:scale-95">取消</button>
                      <button
                        onClick={() => { removeGoal(g.id); setConfirmId(null); toast(`已刪除「${g.zh}」`); }}
                        className="bouncy min-h-[44px] rounded-2xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground active:scale-95"
                      >刪除</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setConfirmId(g.id)} className="bouncy flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground neu active:scale-90" aria-label="刪除目標">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        disabled={done}
                        onClick={() => setDepositId(g.id)}
                        className="bouncy flex h-11 shrink-0 items-center gap-1 rounded-2xl px-3.5 text-xs font-bold text-primary-foreground disabled:opacity-60 active:scale-95 shadow-sm"
                        style={pop}
                      >
                        {done ? "達成！" : (<><Plus className="h-4 w-4" />存錢</>)}
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-3 h-4 w-full overflow-hidden rounded-full neu-inset">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${pct}%`, backgroundImage: "linear-gradient(90deg, var(--caramel), var(--caramel-soft))" }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs font-semibold">
                  <span className="tabular-nums">{money(g.saved)}</span>
                  <span className="text-muted-foreground tabular-nums">{pct}% · 目標 {money(g.target)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <AnimatePresence>
        {depositGoal && <DepositSheet goal={depositGoal} onClose={() => setDepositId(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {creating && <NewGoalSheet onClose={() => setCreating(false)} />}
      </AnimatePresence>
    </div>
  );
}
