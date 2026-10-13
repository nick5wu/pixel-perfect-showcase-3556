/**
 * ============================================================================
 * UsTwo Ledger - 主次類別管理系統 (Nested Category Settings Modal)
 * ============================================================================
 * 
 * 核心特色：
 * 1. 支援大類別（如：餐飲美食、居家生活）展開展示底下小類別（如：早餐、午餐、咖啡）。
 * 2. 溫暖燕麥奶手帳黏土風格，符合 Android-First 與 Safe Area 規範。
 * 3. 支援即時新增自訂大類別（自選 Icon 與色調）與動態新增/刪除子類別。
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Check,
  Tag,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  ICONS,
  TINTS,
  useUsTwo,
  type CategoryGroup,
  type SubCategory,
  type Kind,
} from "@/lib/ustwo";
import { cn, useBodyScrollLock } from "@/lib/utils";

function StampBadge({
  iconName,
  tint,
  size = "md",
}: {
  iconName?: string;
  tint: string;
  size?: "sm" | "md" | "lg";
}) {
  const IconComponent = (iconName && ICONS[iconName]) || Sparkles;
  const sizeClasses =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const iconSize =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-2xl border border-white/70 shadow-xs",
        sizeClasses,
      )}
      style={{
        backgroundColor: `color-mix(in oklch, ${tint} 24%, white)`,
      }}
    >
      <IconComponent
        className={cn(iconSize, "stroke-[2.2]")}
        style={{ color: `color-mix(in oklch, ${tint} 75%, black)` }}
      />
    </span>
  );
}

export function CategorySettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useBodyScrollLock(open);

  const {
    categoryGroups,
    addCategoryGroup,
    updateCategoryGroup,
    removeCategoryGroup,
    addSubCategory,
    removeSubCategory,
  } = useUsTwo();

  const [kind, setKind] = useState<Kind>("expense");
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  // New Subcategory inline creation
  const [addingSubGroupId, setAddingSubGroupId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState("");

  // New Group modal
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupIcon, setGroupIcon] = useState("sparkles");
  const [groupTint, setGroupTint] = useState<string>("var(--cat-1)");

  const filteredGroups = categoryGroups.filter((g) => g.kind === kind);

  const toggleExpand = (id: string) => {
    setExpandedGroupId((prev) => (prev === id ? null : id));
  };

  const handleOpenCreateGroup = () => {
    setEditingGroupId(null);
    setGroupName("");
    setGroupIcon("sparkles");
    setGroupTint(TINTS[Math.floor(Math.random() * TINTS.length)] ?? "var(--cat-1)");
    setShowGroupDialog(true);
  };

  const handleOpenEditGroup = (g: CategoryGroup) => {
    setEditingGroupId(g.id);
    setGroupName(g.zh);
    setGroupIcon(g.icon);
    setGroupTint(g.tint);
    setShowGroupDialog(true);
  };

  const handleSaveGroup = () => {
    const trimmed = groupName.trim();
    if (!trimmed) {
      toast("請輸入類別名稱 ✨");
      return;
    }

    if (editingGroupId) {
      updateCategoryGroup(editingGroupId, {
        zh: trimmed,
        icon: groupIcon,
        tint: groupTint,
      });
      setShowGroupDialog(false);
      return;
    }

    const newGroup: CategoryGroup = {
      id: `cg_${Date.now().toString(36)}`,
      zh: trimmed,
      kind,
      icon: groupIcon,
      tint: groupTint,
      subCategories: [
        {
          id: `sub_${Date.now().toString(36)}_gen`,
          zh: "一般",
          icon: groupIcon,
        },
      ],
      custom: true,
    };

    addCategoryGroup(newGroup);
    setExpandedGroupId(newGroup.id);
    setShowGroupDialog(false);
  };

  const handleCreateSub = (groupId: string) => {
    const trimmed = newSubName.trim();
    if (!trimmed) {
      toast("請輸入細項名稱 ✨");
      return;
    }

    const parent = categoryGroups.find((g) => g.id === groupId);
    const sub: SubCategory = {
      id: `sub_${Date.now().toString(36)}`,
      zh: trimmed,
      icon: parent?.icon || "sparkles",
    };

    addSubCategory(groupId, sub);
    setNewSubName("");
    setAddingSubGroupId(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[65] flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[oklch(0.22_0.02_55/0.45)] backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="glass-strong relative max-h-[92vh] w-full max-w-md overflow-hidden rounded-t-[2.5rem] shadow-2xl flex flex-col"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
            }}
          >
            {/* Grab handle */}
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-3 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl neu text-primary">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-foreground">
                    記帳類別管理
                  </h3>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    主次類別架構 · 自訂細項
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bouncy flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full neu active:scale-95"
                aria-label="關閉"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Kind Switcher (Expense / Income) */}
            <div className="px-6 py-2 shrink-0">
              <div className="glass grid grid-cols-2 gap-1 rounded-full p-1 shadow-inner">
                {(["expense", "income"] as Kind[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      setKind(k);
                      setExpandedGroupId(null);
                    }}
                    className={cn(
                      "bouncy min-h-[48px] rounded-full py-2.5 text-xs font-black transition-all flex items-center justify-center",
                      kind === k ? "text-primary-foreground shadow-md" : "text-muted-foreground",
                    )}
                    style={
                      kind === k
                        ? {
                            backgroundColor: k === "expense" ? "var(--caramel)" : "var(--cat-9)",
                            boxShadow: "var(--shadow-soft)",
                          }
                        : undefined
                    }
                  >
                    {k === "expense" ? "支出分類 Expense" : "收入分類 Income"}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories List Scroll Area (pb-12 for Android Edge-to-Edge) */}
            <div className="flex-1 overflow-y-auto px-6 py-3 pb-12 space-y-3 no-scrollbar overscroll-contain">
              {filteredGroups.map((group) => {
                const isExpanded = expandedGroupId === group.id;
                const isAddingSub = addingSubGroupId === group.id;

                return (
                  <div
                    key={group.id}
                    className="glass rounded-3xl p-3.5 transition-all shadow-[var(--shadow-soft)] border border-white/60 dark:border-white/10"
                  >
                    {/* Main Category Header Row */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleExpand(group.id)}
                      className="flex items-center gap-3 cursor-pointer select-none"
                    >
                      <StampBadge iconName={group.icon} tint={group.tint} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-base font-bold text-foreground">
                            {group.zh}
                          </p>
                          {group.custom && (
                            <span className="shrink-0 rounded-xl bg-secondary/80 px-2 py-0.5 text-[9px] font-bold text-secondary-foreground">
                              自訂
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {group.subCategories.length} 個子項目
                        </p>
                      </div>

                      {/* Header Actions (>= 48px touch targets) */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEditGroup(group)}
                          aria-label={`編輯大類別 ${group.zh}`}
                          className="bouncy flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl neu text-muted-foreground hover:text-foreground active:scale-95"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {group.custom && (
                          <button
                            onClick={() => {
                              if (confirm(`確定要刪除「${group.zh}」大類別嗎？`)) {
                                removeCategoryGroup(group.id);
                              }
                            }}
                            aria-label={`刪除大類別 ${group.zh}`}
                            className="bouncy flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl neu text-destructive hover:bg-destructive/10 active:scale-95"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleExpand(group.id)}
                          aria-label={isExpanded ? "收合子項目" : "展開子項目"}
                          className="bouncy flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl text-muted-foreground active:scale-95"
                        >
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ type: "spring", damping: 22, stiffness: 300 }}
                            className="flex items-center justify-center"
                          >
                            <ChevronDown className="h-5 w-5" />
                          </motion.div>
                        </button>
                      </div>
                    </div>

                    {/* Subcategories Accordion Content (overflow-hidden without margin collapse) */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ type: "spring", damping: 26, stiffness: 320 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3">
                            <div className="neu-inset rounded-2xl p-3 space-y-3">
                              <div className="flex items-center justify-between px-1">
                                <span className="text-xs font-bold text-muted-foreground">
                                  子類別項目 ({group.subCategories.length})
                                </span>
                                {!isAddingSub && (
                                  <button
                                    onClick={() => {
                                      setAddingSubGroupId(group.id);
                                      setNewSubName("");
                                    }}
                                    className="bouncy flex min-h-[48px] px-3 items-center gap-1.5 text-xs font-bold text-primary active:scale-95"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>新增子項</span>
                                  </button>
                                )}
                              </div>

                              {/* Subcategories Chips Grid */}
                              <div className="flex flex-wrap gap-2">
                                {group.subCategories.map((sub) => (
                                  <div
                                    key={sub.id}
                                    className="group flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs border border-white/60 dark:border-white/10"
                                  >
                                    <span>{sub.zh}</span>
                                    {group.subCategories.length > 1 && (
                                      <button
                                        onClick={() => removeSubCategory(group.id, sub.id)}
                                        aria-label={`刪除子類別 ${sub.zh}`}
                                        className="bouncy flex min-h-[36px] min-w-[36px] items-center justify-center -mr-1.5 rounded-full text-muted-foreground hover:bg-destructive hover:text-destructive-foreground active:scale-90"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Inline Add Subcategory input */}
                              {isAddingSub && (
                                <div className="flex items-center gap-2 pt-1">
                                  <input
                                    autoFocus
                                    value={newSubName}
                                    onChange={(e) => setNewSubName(e.target.value.slice(0, 8))}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleCreateSub(group.id);
                                      if (e.key === "Escape") setAddingSubGroupId(null);
                                    }}
                                    placeholder="例如：下午茶、宵夜"
                                    className="h-11 flex-1 rounded-xl bg-background/90 px-3 text-xs font-medium outline-none border border-border focus:border-primary"
                                  />
                                  <button
                                    onClick={() => handleCreateSub(group.id)}
                                    className="bouncy flex min-h-[48px] px-4 items-center justify-center rounded-2xl bg-primary text-xs font-bold text-primary-foreground shadow active:scale-95"
                                  >
                                    儲存
                                  </button>
                                  <button
                                    onClick={() => setAddingSubGroupId(null)}
                                    className="bouncy flex min-h-[48px] px-3.5 items-center justify-center rounded-2xl neu text-xs font-bold text-muted-foreground active:scale-95"
                                  >
                                    取消
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Add New Group Button */}
              <button
                onClick={handleOpenCreateGroup}
                className="bouncy flex min-h-[52px] w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border py-3 text-sm font-bold text-muted-foreground hover:text-foreground active:scale-95"
              >
                <Plus className="h-4 w-4" />
                新增{kind === "expense" ? "支出" : "收入"}大類別
              </button>
            </div>
          </motion.div>

          {/* Add / Edit Main Category Dialog */}
          <AnimatePresence>
            {showGroupDialog && (
              <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowGroupDialog(false)}
                  className="absolute inset-0 bg-[oklch(0.22_0.02_55/0.45)] backdrop-blur-md"
                />
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 16 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 16 }}
                  transition={{ type: "spring", damping: 28, stiffness: 300 }}
                  className="glass-strong relative w-full max-w-sm rounded-[2.5rem] p-5 shadow-2xl space-y-4"
                  style={{
                    paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-black">
                      {editingGroupId ? "編輯大類別" : "新增大類別"}
                    </h4>
                    <button
                      onClick={() => setShowGroupDialog(false)}
                      aria-label="關閉"
                      className="bouncy flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full neu active:scale-95"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Preview & Name Input */}
                  <div className="flex items-center gap-3">
                    <StampBadge iconName={groupIcon} tint={groupTint} size="lg" />
                    <input
                      autoFocus
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value.slice(0, 8))}
                      placeholder="大類別名稱 (如：毛孩、旅行)"
                      className="h-12 flex-1 rounded-2xl neu-inset px-4 text-sm font-bold outline-none"
                    />
                  </div>

                  {/* Tint Color Picker (>= 48px touch target) */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground px-1 mb-1.5 block">
                      代表色系
                    </label>
                    <div className="flex justify-between items-center py-1">
                      {TINTS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setGroupTint(t)}
                          aria-label="選擇色票"
                          className="bouncy flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full active:scale-95"
                        >
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-full transition-all"
                            style={{
                              backgroundColor: `color-mix(in oklch, ${t} 45%, white)`,
                              boxShadow: groupTint === t ? `0 0 0 2.5px ${t}` : "none",
                            }}
                          >
                            {groupTint === t && (
                              <Check
                                className="h-3.5 w-3.5"
                                style={{ color: `color-mix(in oklch, ${t} 70%, black)` }}
                              />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Icon Picker (>= 48px touch target) */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground px-1 mb-1.5 block">
                      專屬圖示
                    </label>
                    <div className="grid max-h-36 grid-cols-7 gap-1 overflow-y-auto no-scrollbar p-1 neu-inset rounded-2xl">
                      {Object.entries(ICONS).map(([key, IconComp]) => {
                        const isSelected = groupIcon === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setGroupIcon(key)}
                            aria-label={key}
                            className={cn(
                              "bouncy flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl transition-all active:scale-90",
                              isSelected ? "bg-card shadow-sm ring-2 ring-primary" : "hover:bg-muted/40",
                            )}
                          >
                            <IconComp
                              className="h-5 w-5 stroke-[2.2]"
                              style={{
                                color: isSelected
                                  ? `color-mix(in oklch, ${groupTint} 75%, black)`
                                  : "var(--muted-foreground)",
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowGroupDialog(false)}
                      className="bouncy flex min-h-[48px] h-12 flex-1 items-center justify-center rounded-2xl neu text-xs font-bold text-muted-foreground active:scale-95"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveGroup}
                      className="bouncy flex min-h-[48px] h-12 flex-1 items-center justify-center rounded-2xl text-xs font-extrabold text-primary-foreground shadow-md active:scale-95"
                      style={{
                        backgroundImage:
                          "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
                        boxShadow: "var(--shadow-soft)",
                      }}
                    >
                      儲存設定
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
