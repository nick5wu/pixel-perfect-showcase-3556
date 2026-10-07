import { useEffect, useState } from "react";
import { CalendarHeart } from "lucide-react";
import { PlannerCalendar } from "./PlannerCalendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toKey } from "@/lib/ustwo";
import { cn } from "@/lib/utils";

const parse = (s: string) => (s ? new Date(`${s}T00:00:00`) : undefined);

const formatFriendly = (s: string) => {
  const d = parse(s);
  if (!d) return "";
  const now = new Date();
  const todayKey = toKey(now);
  now.setDate(now.getDate() - 1);
  const yesterdayKey = toKey(now);

  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];

  if (s === todayKey) return `${y}/${m}/${day} · 今天 (${weekday})`;
  if (s === yesterdayKey) return `${y}/${m}/${day} · 昨天 (${weekday})`;
  return `${y}/${m}/${day} (${weekday})`;
};

type Props = {
  value: string; // yyyy-MM-dd
  onChange: (d: string) => void;
  max?: string;
  showQuickPresets?: boolean;
  className?: string;
};

/**
 * 手帳風單日日期選擇器 (Planner-style Date Picker)
 * 統一手帳風格，完全取代原生系統 DatePicker，支援快捷預設與可愛的手帳日曆 Popover。
 */
export function DatePicker({
  value,
  onChange,
  max,
  showQuickPresets = true,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const todayKey = toKey(now);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toKey(yesterday);

  const selectedDate = parse(value);
  const [month, setMonth] = useState<Date>(() => selectedDate ?? new Date());

  useEffect(() => {
    if (selectedDate) {
      setMonth(selectedDate);
    }
  }, [value, open]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            aria-label="選擇日期"
            type="button"
            className="bouncy neu flex h-10 min-w-0 flex-1 items-center gap-2 rounded-2xl px-3.5 text-xs font-bold transition-colors"
          >
            <CalendarHeart className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{formatFriendly(value) || value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="planner-popup pointer-events-auto z-[90] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto"
        >
          {showQuickPresets && (
            <div className="mb-5 flex items-center gap-3">
              {[
                { label: "今天", key: todayKey },
                { label: "昨天", key: yesterdayKey },
              ].map(({ label, key }) => (
                <Button
                  variant="ghost"
                  disabled={!!max && key > max}
                  key={key}
                  type="button"
                  aria-pressed={value === key}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className="planner-preset bouncy h-10 rounded-full px-6 text-sm font-semibold"
                >
                  {label}
                </Button>
              ))}
            </div>
          )}
          <PlannerCalendar
            mode="single"
            selected={selectedDate}
            month={month}
            onMonthChange={setMonth}
            disabled={max ? (date) => toKey(date) > max : undefined}
            onSelect={(d) => {
              if (d) {
                onChange(toKey(d));
                setOpen(false);
              }
            }}
          />
          <Button
            type="button"
            onClick={() => setOpen(false)}
            className="planner-complete bouncy w-full text-base font-bold text-primary-foreground"
          >
            完成
          </Button>
        </PopoverContent>
      </Popover>

      {/* 快捷切換按鈕 */}
      {showQuickPresets && (
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="ghost"
            disabled={!!max && todayKey > max}
            type="button"
            onClick={() => onChange(todayKey)}
            className={cn(
              "bouncy rounded-2xl px-3 py-2 text-xs font-bold transition-all",
              value === todayKey
                ? "text-primary-foreground shadow-sm"
                : "neu text-muted-foreground",
            )}
            style={
              value === todayKey
                ? {
                    backgroundImage:
                      "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
                  }
                : undefined
            }
          >
            今天
          </Button>
          <Button
            variant="ghost"
            disabled={!!max && yesterdayKey > max}
            type="button"
            onClick={() => onChange(yesterdayKey)}
            className={cn(
              "bouncy rounded-2xl px-3 py-2 text-xs font-bold transition-all",
              value === yesterdayKey
                ? "text-primary-foreground shadow-sm"
                : "neu text-muted-foreground",
            )}
            style={
              value === yesterdayKey
                ? {
                    backgroundImage:
                      "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
                  }
                : undefined
            }
          >
            昨天
          </Button>
        </div>
      )}
    </div>
  );
}
