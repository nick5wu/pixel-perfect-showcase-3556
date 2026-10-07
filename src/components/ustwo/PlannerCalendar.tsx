import type { ComponentProps } from "react";
import { zhTW } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export function PlannerCalendar({ className, ...props }: ComponentProps<typeof Calendar>) {
  return (
    <Calendar
      locale={zhTW}
      captionLayout="dropdown"
      startMonth={new Date(1900, 0)}
      endMonth={new Date(new Date().getFullYear() + 10, 11)}
      formatters={{ formatMonthDropdown: (date) => `${date.getMonth() + 1} 月` }}
      className={cn(
        "planner-calendar pointer-events-auto [&_.rdp-weekday]:font-semibold [&_.rdp-button_previous]:rounded-full [&_.rdp-button_next]:rounded-full",
        className,
      )}
      {...props}
    />
  );
}