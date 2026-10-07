import { useState } from "react";
import { CalendarHeart, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { PlannerCalendar } from "./PlannerCalendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toKey } from "@/lib/ustwo";
import { cn } from "@/lib/utils";

const parse = (s: string) => (s ? new Date(`${s}T00:00:00`) : undefined);
const label = (s: string) => {
  const d = parse(s);
  return d ? `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}` : "";
};

type Props = { from: string; to: string; onChange: (from: string, to: string) => void };

export function DateRangePicker({ from, to, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const presets: [string, () => [Date, Date]][] = [
    ["最近 7 天", () => { const a = new Date(); a.setDate(a.getDate() - 6); return [a, now]; }],
    ["本月", () => [new Date(now.getFullYear(), now.getMonth(), 1), now]],
    ["上個月", () => [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0)]],
    ["今年", () => [new Date(now.getFullYear(), 0, 1), now]],
  ];
  const range: DateRange | undefined = from ? { from: parse(from), to: parse(to) } : undefined;
  const text = from ? (to && to !== from ? `${label(from)} – ${label(to)}` : label(from)) : "全部日期";

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" aria-label="選擇日期範圍" className={cn("bouncy flex h-11 min-w-0 flex-1 justify-start items-center gap-2 rounded-2xl neu px-4 text-sm font-bold", !from && "text-muted-foreground")}>
            <CalendarHeart className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{text}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="glass-strong pointer-events-auto z-[90] w-auto max-w-[calc(100vw-1rem)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto rounded-[2rem] border border-primary/15 p-3 shadow-xl">
          <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
            {presets.map(([name, fn]) => (
              <Button
                variant="ghost"
                key={name}
                onClick={() => { const [a, b] = fn(); onChange(toKey(a), toKey(b)); setOpen(false); }}
                className="bouncy shrink-0 rounded-full neu px-3 py-1.5 text-xs font-bold"
              >
                {name}
              </Button>
            ))}
          </div>
          <PlannerCalendar
            mode="range"
            selected={range}
            defaultMonth={parse(from) ?? now}
            onSelect={(r) => onChange(r?.from ? toKey(r.from) : "", r?.to ? toKey(r.to) : r?.from ? toKey(r.from) : "")}
            className="pointer-events-auto p-1"
          />
          <Button onClick={() => setOpen(false)} className="bouncy mt-2 h-10 w-full rounded-2xl text-sm font-bold text-primary-foreground"
            style={{ backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))" }}>
            完成
          </Button>
        </PopoverContent>
      </Popover>
      {from && (
        <Button variant="ghost" onClick={() => onChange("", "")} className="bouncy flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl neu" aria-label="清除日期">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
