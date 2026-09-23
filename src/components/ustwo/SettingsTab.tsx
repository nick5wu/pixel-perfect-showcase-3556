import { useState } from "react";
import { Heart, Sparkles } from "lucide-react";
import { PEOPLE, money, toKey, useUsTwo } from "@/lib/ustwo";
import { Avatar, SectionTitle } from "./shared";
import { WidgetPreview } from "./WidgetPreview";
import { cn } from "@/lib/utils";

export function SettingsTab() {
  const { visible, anniversary } = useUsTwo();
  const [showWidget, setShowWidget] = useState(true);
  const [recap, setRecap] = useState<"month" | "year">("month");

  const days = Math.floor(
    (Date.now() - new Date(anniversary).getTime()) / (1000 * 60 * 60 * 24),
  );

  const prefix = recap === "month" ? toKey(new Date()).slice(0, 7) : toKey(new Date()).slice(0, 4);
  const rows = visible.filter((t) => t.date.startsWith(prefix) && t.kind === "expense");
  const spent = rows.reduce((s, t) => s + t.amount, 0);
  const top = rows.slice().sort((a, b) => b.amount - a.amount)[0];

  return (
    <div className="space-y-5">
      <section className="glass rounded-[2rem] p-5">
        <SectionTitle zh="我們倆" en="Partner profiles" />
        <div className="flex items-center justify-center gap-6">
          {(["me", "her"] as const).map((u) => (
            <div key={u} className="flex flex-col items-center gap-1.5">
              <Avatar who={u} size="lg" />
              <p className="text-sm font-bold">{PEOPLE[u].zh}</p>
              <p className="text-[11px] text-muted-foreground">{PEOPLE[u].name}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="ambient-glow rounded-[2rem] p-5 text-center"
        style={{ boxShadow: "var(--shadow-soft)" }}
      >
        <Heart className="mx-auto h-6 w-6 text-primary" fill="currentColor" />
        <p className="mt-1 text-xs font-semibold text-muted-foreground">在一起紀念日</p>
        <p className="text-3xl font-extrabold tabular-nums">{days} 天</p>
        <p className="mt-1 text-xs text-muted-foreground">自 {anniversary} 起 🧡</p>
      </section>

      <section className="glass flex items-center justify-between rounded-[1.75rem] px-5 py-4">
        <span className="text-sm font-bold">桌面小工具預覽</span>
        <button
          onClick={() => setShowWidget((s) => !s)}
          className="relative h-7 w-12 rounded-full transition-colors"
          style={{ backgroundColor: showWidget ? "var(--caramel)" : "var(--border)" }}
          aria-label="Toggle widget preview"
        >
          <span
            className="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all"
            style={{ left: showWidget ? "1.55rem" : "0.25rem" }}
          />
        </button>
      </section>

      {showWidget && <WidgetPreview />}

      <section>
        <SectionTitle zh="回顧故事卡片" en="Recap" />
        <div className="glass mb-3 grid grid-cols-2 gap-1 rounded-[1.5rem] p-1.5">
          {(
            [
              ["month", "月回顧"],
              ["year", "年回顧"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setRecap(m)}
              className={cn(
                "bouncy rounded-2xl py-2 text-sm font-bold",
                recap === m ? "text-primary-foreground" : "text-muted-foreground",
              )}
              style={
                recap === m
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

        <div className="ambient-glow rounded-[2rem] p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <Sparkles className="h-5 w-5 text-primary" />
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            {recap === "month" ? "這個月" : "今年"}我們一起花了
          </p>
          <p className="text-4xl font-extrabold tabular-nums">{money(spent)}</p>
          <p className="mt-3 text-sm">
            共 {rows.length} 筆甜甜的紀錄
            {top ? `，最難忘的是「${top.note}」（${money(top.amount)}）` : ""}。
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            繼續一起存錢、一起吃好吃的，下個月見 🧡
          </p>
        </div>
      </section>
    </div>
  );
}
