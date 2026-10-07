import { useEffect, useState } from "react";
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

  const [month, setMonth] = useState<Date>(() => parse(from) ?? now);
  useEffect(() => {
    if (from) {
      const parsed = parse(from);
      if (parsed) setMonth(parsed);
    }
  }, [from, open]);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" aria-label="選擇日期範圍" className={cn("bouncy flex h-11 min-w-0 flex-1 justify-start items-center gap-2 rounded-2xl neu px-4 text-sm font-bold", !from && "text-muted-foreground")}>
            <CalendarHeart className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{text}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="planner-popup pointer-events-auto z-[90] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto">
          <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
            {presets.map(([name, fn]) => (
              <Button
                variant="ghost"
                key={name}
                onClick={() => { const [a, b] = fn(); onChange(toKey(a), toKey(b)); setOpen(false); }}
                className="planner-preset bouncy h-10 shrink-0 rounded-full px-3 text-xs font-semibold"
              >
                {name}
              </Button>
            ))}
          </div>
          <PlannerCalendar
            mode="range"
            selected={range}
            month={month}
            onMonthChange={setMonth}
            onSelect={(r) => onChange(r?.from ? toKey(r.from) : "", r?.to ? toKey(r.to) : r?.from ? toKey(r.from) : "")}
          />
          <Button onClick={() => setOpen(false)} className="planner-complete bouncy w-full text-base font-bold text-primary-foreground">
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
