import { useState } from "react";
import { CalendarHeart } from "lucide-react";
import { zhTW } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
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

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="bouncy neu flex h-10 min-w-0 flex-1 items-center gap-2 rounded-2xl px-3.5 text-xs font-bold transition-colors"
          >
            <CalendarHeart className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{formatFriendly(value) || value}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="glass-strong pop-in w-auto rounded-[2rem] border-0 p-3 shadow-xl"
        >
          {showQuickPresets && (
            <div className="mb-2 flex items-center gap-1.5 px-1">
              {[
                { label: "今天", key: todayKey },
                { label: "昨天", key: yesterdayKey },
              ].map(({ label, key }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={cn(
                    "bouncy rounded-full px-3 py-1 text-xs font-bold transition-all",
                    value === key
                      ? "text-primary-foreground shadow-sm"
                      : "neu text-muted-foreground",
                  )}
                  style={
                    value === key
                      ? {
                          backgroundImage:
                            "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
                        }
                      : undefined
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <Calendar
            mode="single"
            locale={zhTW}
            selected={selectedDate}
            defaultMonth={selectedDate ?? now}
            disabled={max ? (date) => toKey(date) > max : undefined}
            onSelect={(d) => {
              if (d) {
                onChange(toKey(d));
                setOpen(false);
              }
            }}
            className="pointer-events-auto p-1"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="bouncy mt-2 h-9 w-full rounded-2xl text-xs font-bold text-primary-foreground"
            style={{
              backgroundImage:
                "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
            }}
          >
            完成
          </button>
        </PopoverContent>
      </Popover>

      {/* 快捷切換按鈕 */}
      {showQuickPresets && (
        <div className="flex shrink-0 items-center gap-1.5">
          <button
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
          </button>
          <button
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
          </button>
        </div>
      )}
    </div>
  );
}
