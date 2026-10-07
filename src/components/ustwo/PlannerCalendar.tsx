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
        "pointer-events-auto p-1 [--cell-size:2.25rem] [&_.rdp-dropdown_root]:rounded-xl [&_.rdp-dropdown_root]:border-border [&_.rdp-dropdown_root]:bg-background/80 [&_.rdp-caption_label]:font-bold [&_.rdp-weekday]:font-semibold [&_.rdp-button_previous]:rounded-full [&_.rdp-button_next]:rounded-full [&_.rdp-day_button]:rounded-full [&_.rdp-day_button]:font-semibold",
        className,
      )}
      {...props}
    />
  );
}