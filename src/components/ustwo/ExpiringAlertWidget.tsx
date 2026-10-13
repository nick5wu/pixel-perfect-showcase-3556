import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronRight, Refrigerator, Clock } from "lucide-react";
import {
  useInventoryStore,
  getDaysUntilExpiry,
  INVENTORY_CATEGORIES,
} from "@/store/useInventoryStore";
import { cn } from "@/lib/utils";

interface ExpiringAlertWidgetProps {
  onOpenInventory: () => void;
}

export function ExpiringAlertWidget({ onOpenInventory }: ExpiringAlertWidgetProps) {
  const { items } = useInventoryStore();

  // Scan items that are not consumed and either expired or <= 3 days to expiry
  const alertItems = useMemo(() => {
    return items
      .filter((item) => !item.isConsumed)
      .map((item) => ({
        ...item,
        daysLeft: getDaysUntilExpiry(item.expiryDate),
      }))
      .filter((item) => item.daysLeft <= 3)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [items]);

  if (alertItems.length === 0) return null;

  const expiredCount = alertItems.filter((i) => i.daysLeft < 0).length;
  const urgentCount = alertItems.filter((i) => i.daysLeft >= 0 && i.daysLeft <= 3).length;

  const title =
    expiredCount > 0
      ? `冰箱有 ${expiredCount} 項物品已過期、${urgentCount} 項即將到期 ⚠️`
      : `冰箱有 ${urgentCount} 項美味即將到期，記得吃掉唷！😋`;

  const topItemsText = alertItems
    .slice(0, 3)
    .map((i) => i.name)
    .join("、");

  const hasExpired = expiredCount > 0;

  return (
    <AnimatePresence>
      <motion.button
        type="button"
        onClick={onOpenInventory}
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "bouncy group relative w-full rounded-[28px] p-4 text-left transition-all",
          "border shadow-[var(--shadow-soft)] cursor-pointer flex items-center justify-between gap-3 overflow-hidden",
          hasExpired
            ? "border-rose-500/35 bg-rose-500/10 dark:bg-rose-950/20"
            : "border-amber-500/35 bg-amber-500/10 dark:bg-amber-950/20"
        )}
      >
        {/* Soft Ambient Glow */}
        <div
          className={cn(
            "absolute -left-10 -top-10 h-28 w-28 rounded-full blur-2xl opacity-40 pointer-events-none",
            hasExpired ? "bg-rose-500" : "bg-amber-500"
          )}
        />

        {/* Left Icon with Pulse */}
        <div
          className={cn(
            "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs border",
            hasExpired
              ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30"
              : "bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30"
          )}
        >
          {hasExpired ? (
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          ) : (
            <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          )}

          {/* Badge count */}
          <span
            className={cn(
              "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black shadow-xs",
              hasExpired
                ? "bg-rose-600 text-white"
                : "bg-amber-600 text-white"
            )}
          >
            {alertItems.length}
          </span>
        </div>

        {/* Center Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-black",
                hasExpired
                  ? "bg-rose-500/20 text-rose-700 dark:text-rose-400"
                  : "bg-amber-500/20 text-amber-800 dark:text-amber-400"
              )}
            >
              {hasExpired ? "急需處理" : "賞味提醒"}
            </span>
            <span className="text-xs font-black text-foreground truncate">
              {title}
            </span>
          </div>

          <p className="mt-1 truncate text-[11px] font-semibold text-muted-foreground">
            包含：{topItemsText} {alertItems.length > 3 ? "等..." : ""}
          </p>
        </div>

        {/* Right Arrow Action */}
        <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-muted-foreground group-hover:text-foreground">
          <span className="hidden sm:inline">檢查庫存</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full neu group-hover:translate-x-0.5 transition-transform">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </motion.button>
    </AnimatePresence>
  );
}
