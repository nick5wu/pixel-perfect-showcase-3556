"use client";

import * as React from "react";
import { Check, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames, type DropdownOption } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function CalendarDropdown(props: {
  options?: DropdownOption[];
  value?: number | string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
  [key: string]: unknown;
}) {
  const { options, value, onChange, disabled, className, "aria-label": ariaLabel } = props;
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options?.find((o) => o.value === Number(value));
  const displayLabel = selectedOption?.label ?? (value !== undefined ? String(value) : "");

  // Close when clicking outside
  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  // Auto scroll to active item
  React.useEffect(() => {
    if (open && listRef.current) {
      const activeEl = listRef.current.querySelector<HTMLElement>('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: "center", behavior: "auto" });
      }
    }
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={cn(
          "bouncy neu flex h-7 items-center gap-1 rounded-xl px-2.5 text-xs font-extrabold text-foreground transition-all hover:bg-primary/10 select-none disabled:opacity-40",
          open && "ring-2 ring-primary/40 bg-primary/10 shadow-inner",
        )}
      >
        <span>{displayLabel}</span>
        <ChevronDownIcon
          className={cn(
            "h-3 w-3 text-primary transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          className="pop-in glass-strong absolute left-1/2 top-full z-[120] mt-1.5 max-h-52 min-w-[5.8rem] -translate-x-1/2 overflow-y-auto rounded-2xl border border-white/60 p-1.5 shadow-2xl no-scrollbar backdrop-blur-xl"
          style={{
            boxShadow: "0 12px 32px -4px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-0.5">
            {options?.map((opt) => {
              const isSelected = opt.value === Number(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-selected={isSelected}
                  disabled={opt.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onChange) {
                      const fakeEvent = {
                        target: { value: String(opt.value) },
                        currentTarget: { value: String(opt.value) },
                      } as unknown as React.ChangeEvent<HTMLSelectElement>;
                      onChange(fakeEvent);
                    }
                    setOpen(false);
                  }}
                  className={cn(
                    "bouncy flex items-center justify-between rounded-xl px-2.5 py-1 text-xs font-bold transition-all text-left whitespace-nowrap",
                    isSelected
                      ? "text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-primary/15",
                    opt.disabled && "opacity-30 cursor-not-allowed",
                  )}
                  style={
                    isSelected
                      ? {
                          backgroundImage:
                            "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
                        }
                      : undefined
                  }
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="ml-1.5 h-3 w-3 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  buttonVariant = "ghost",
  formatters,
  components,
  startMonth = new Date(1990, 0),
  endMonth = new Date(new Date().getFullYear() + 5, 11),
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      formatters={{
        formatMonthDropdown: (date) => `${date.getMonth() + 1}月`,
        formatYearDropdown: (date) => `${date.getFullYear()}年`,
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 pointer-events-none [&>button]:pointer-events-auto",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          "bouncy flex h-7 w-7 items-center justify-center rounded-xl neu text-foreground hover:bg-primary/10 transition-all select-none p-0 aria-disabled:opacity-30",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          "bouncy flex h-7 w-7 items-center justify-center rounded-xl neu text-foreground hover:bg-primary/10 transition-all select-none p-0 aria-disabled:opacity-30",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-8",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-(--cell-size) items-center justify-center gap-1.5 text-xs font-bold",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn("relative", defaultClassNames.dropdown_root),
        dropdown: "hidden",
        caption_label: cn(
          "select-none font-bold text-xs text-foreground",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-bold",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center",
          defaultClassNames.day,
        ),
        range_start: cn("rounded-l-xl", defaultClassNames.range_start),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-xl", defaultClassNames.range_end),
        today: cn(
          "font-bold",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground/40 aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn("text-muted-foreground opacity-30 cursor-not-allowed", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className={cn("size-3.5", className)} {...props} />;
          }

          if (orientation === "right") {
            return <ChevronRightIcon className={cn("size-3.5", className)} {...props} />;
          }

          return <ChevronDownIcon className={cn("size-3.5", className)} {...props} />;
        },
        DayButton: CalendarDayButton,
        Dropdown: CalendarDropdown as any,
        MonthsDropdown: CalendarDropdown as any,
        YearsDropdown: CalendarDropdown as any,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers["focused"]) ref.current?.focus();
  }, [modifiers]);

  const isSelected = Boolean(modifiers["selected"]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        isSelected &&
        !modifiers["range_start"] &&
        !modifiers["range_end"] &&
        !modifiers["range_middle"]
      }
      data-range-start={modifiers["range_start"]}
      data-range-end={modifiers["range_end"]}
      data-range-middle={modifiers["range_middle"]}
      className={cn(
        "bouncy flex aspect-square h-auto w-full min-w-(--cell-size) flex-col gap-1 rounded-xl text-xs font-bold leading-none transition-all select-none",
        "hover:bg-primary/15",
        "data-[selected-single=true]:text-primary-foreground data-[range-start=true]:text-primary-foreground data-[range-end=true]:text-primary-foreground",
        "data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-middle=true]:rounded-none",
        modifiers["today"] && !isSelected && "neu font-extrabold text-primary ring-1 ring-primary/40",
        defaultClassNames.day,
        className,
      )}
      style={
        isSelected
          ? {
              backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
              boxShadow: "var(--shadow-soft)",
            }
          : undefined
      }
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
