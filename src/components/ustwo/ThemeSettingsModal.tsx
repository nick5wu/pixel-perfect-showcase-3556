import { motion, AnimatePresence } from "framer-motion";
import { Check, Palette, Sparkles, X } from "lucide-react";
import { THEMES, useUsTwo, type ThemeId } from "@/lib/ustwo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ThemeSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ThemeSettingsModal({ open, onClose }: ThemeSettingsModalProps) {
  const { currentTheme, setCurrentTheme } = useUsTwo();

  const handleSelectTheme = (themeId: ThemeId, themeZh: string) => {
    setCurrentTheme(themeId);
    toast.success(`已套用「${themeZh}」主題風格 🎨`, {
      duration: 1800,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-md"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ opacity: 0, y: "100%", scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: "100%", scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-card/95 border border-white/60 dark:border-white/10 p-6 shadow-2xl backdrop-blur-xl"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
            }}
          >
            {/* Header Handle Bar for Android */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/30 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-foreground flex items-center gap-1.5">
                    系統主題風格
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    即時平滑切換全域主色調、背景與卡片氛圍
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl neu text-muted-foreground transition-all active:scale-95"
                aria-label="關閉"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Theme 2-Column Grid */}
            <div className="mt-5 grid grid-cols-2 gap-3.5 max-h-[62vh] overflow-y-auto overscroll-contain px-0.5 py-1">
              {THEMES.map((t) => {
                const isSelected = currentTheme === t.id;

                return (
                  <motion.button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTheme(t.id, t.zh)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    className={cn(
                      "group relative flex flex-col justify-between rounded-[26px] p-4 text-left transition-all",
                      "border min-h-[148px] cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/8 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.12)] ring-2 ring-primary/40"
                        : "border-border/60 bg-card/60 hover:border-primary/40 hover:bg-card/90 shadow-sm"
                    )}
                  >
                    {/* Top Row: Name & Active Badge */}
                    <div className="flex items-start justify-between gap-1 w-full">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-foreground">
                            {t.zh}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {t.en}
                        </span>
                      </div>

                      {/* Selected Indicator */}
                      {isSelected ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="rounded-full bg-secondary/80 px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                          {t.tag}
                        </span>
                      )}
                    </div>

                    {/* Middle: Description */}
                    <p className="my-2 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                      {t.desc}
                    </p>

                    {/* Bottom: 3 Theme Color Swatches */}
                    <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground/80">
                        配色展示
                      </span>
                      <div className="flex items-center -space-x-1.5">
                        {/* Primary Swatch */}
                        <div
                          className="h-6 w-6 rounded-full border-2 border-card shadow-xs transition-transform group-hover:scale-110"
                          style={{ backgroundColor: t.previewColors.primary }}
                          title="主色調"
                        />
                        {/* Background Swatch */}
                        <div
                          className="h-6 w-6 rounded-full border-2 border-card shadow-xs transition-transform group-hover:scale-110"
                          style={{ backgroundColor: t.previewColors.background }}
                          title="背景色"
                        />
                        {/* Surface Swatch */}
                        <div
                          className="h-6 w-6 rounded-full border-2 border-card shadow-xs transition-transform group-hover:scale-110"
                          style={{ backgroundColor: t.previewColors.surface }}
                          title="卡片色"
                        />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="bouncy flex min-h-[48px] h-12 w-full items-center justify-center rounded-2xl text-sm font-extrabold text-primary-foreground shadow-md transition-all active:scale-95"
                style={{
                  backgroundImage:
                    "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                完成設定
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
