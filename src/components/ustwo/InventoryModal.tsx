import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Refrigerator,
  Plus,
  X,
  Camera,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  useInventoryStore,
  INVENTORY_CATEGORIES,
  getDaysUntilExpiry,
  getExpiryTagInfo,
  type InventoryItem,
  type InventoryCategory,
} from "@/store/useInventoryStore";
import { savePhotoBlob, deletePhotoBlob, useResolvedPhoto } from "@/lib/photoStorage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InventoryModalProps {
  open: boolean;
  onClose: () => void;
}

export function InventoryModal({ open, onClose }: InventoryModalProps) {
  const { items, addItem, deleteItem, toggleConsumed } = useInventoryStore();

  const [activeCategory, setActiveCategory] = useState<"all" | InventoryCategory>("all");
  const [showConsumed, setShowConsumed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // New item form state
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<InventoryCategory>("fridge");
  const [newExpiryDate, setNewExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().slice(0, 10);
  });
  const [newQuantity, setNewQuantity] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newPhotoKey, setNewPhotoKey] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (!showConsumed && item.isConsumed) return false;
        if (showConsumed && !item.isConsumed) return false;
        if (activeCategory !== "all" && item.category !== activeCategory) return false;
        return true;
      })
      .sort((a, b) => {
        // Unconsumed items sorted by urgency (expiry date ascending)
        if (!showConsumed) {
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [items, activeCategory, showConsumed]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("請上傳圖片檔案 📷");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // 存入 IndexedDB，完全避免 LocalStorage 5MB 容量暴增問題
      const key = await savePhotoBlob(file);
      setNewPhotoKey(key);
      toast.success("已記錄物品照片 📷");
    } catch (err) {
      console.error("IndexedDB photo save error:", err);
      toast.error("照片儲存失敗，請重試 ⚠️");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleQuickAddDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setNewExpiryDate(d.toISOString().slice(0, 10));
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("請輸入物品名稱！");
      return;
    }
    if (!newExpiryDate) {
      toast.error("請指定保存期限！");
      return;
    }

    addItem({
      name: newName.trim(),
      category: newCategory,
      expiryDate: newExpiryDate,
      quantity: newQuantity.trim() || undefined,
      note: newNote.trim() || undefined,
      photoKey: newPhotoKey || undefined,
      isConsumed: false,
    });

    // Reset form
    setNewName("");
    setNewQuantity("");
    setNewNote("");
    setNewPhotoKey(null);
    setIsAdding(false);
  };

  const handleCancelAdd = () => {
    // 若已上傳暫存照片但取消表單，清理 IndexedDB 釋放空間
    if (newPhotoKey && newPhotoKey.startsWith("idb://")) {
      deletePhotoBlob(newPhotoKey).catch(console.warn);
    }
    setNewName("");
    setNewQuantity("");
    setNewNote("");
    setNewPhotoKey(null);
    setIsAdding(false);
  };

  const handleClose = () => {
    if (isAdding && newPhotoKey && newPhotoKey.startsWith("idb://")) {
      deletePhotoBlob(newPhotoKey).catch(console.warn);
    }
    setNewPhotoKey(null);
    setIsAdding(false);
    onClose();
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
            onClick={handleClose}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: "100%", scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: "100%", scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-card/95 border border-white/60 dark:border-white/10 p-5 sm:p-6 shadow-2xl backdrop-blur-xl max-h-[92vh] flex flex-col"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
            }}
          >
            {/* Header Handle for Android */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/30 sm:hidden shrink-0" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Refrigerator className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-foreground flex items-center gap-1.5">
                    生活庫存與賞味期限
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    冷藏 · 冷凍 · 常溫食材與日用品管理
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="flex h-11 w-11 min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl neu text-muted-foreground transition-all active:scale-95"
                aria-label="關閉"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Filter Tabs & Action Bar */}
            <div className="mt-3.5 space-y-2.5 shrink-0">
              {/* Category selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className={cn(
                    "bouncy flex min-h-[44px] shrink-0 items-center gap-1 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95",
                    activeCategory === "all"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "neu text-muted-foreground hover:text-foreground"
                  )}
                >
                  全部 ({items.filter((i) => !i.isConsumed).length})
                </button>

                {(Object.keys(INVENTORY_CATEGORIES) as InventoryCategory[]).map((catKey) => {
                  const meta = INVENTORY_CATEGORIES[catKey];
                  const count = items.filter((i) => !i.isConsumed && i.category === catKey).length;
                  const isActive = activeCategory === catKey;

                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setActiveCategory(catKey)}
                      className={cn(
                        "bouncy flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "neu text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{meta.icon}</span>
                      <span>{meta.tag}</span>
                      <span className="opacity-70 text-[10px]">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Status Switcher & Add Button Bar */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowConsumed((s) => !s)}
                  className="bouncy flex min-h-[36px] items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-95"
                >
                  {showConsumed ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 text-primary" />
                      <span>查看正在保存中的物品</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>查看已吃完／已用完記錄</span>
                    </>
                  )}
                </button>

                {!isAdding && (
                  <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="bouncy flex min-h-[44px] items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-black text-primary-foreground shadow-sm transition-all active:scale-95"
                    style={{
                      backgroundImage:
                        "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
                      boxShadow: "var(--shadow-soft)",
                    }}
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    <span>新增物品</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="mt-3 flex-1 overflow-y-auto overscroll-contain pr-0.5 space-y-3">
              {/* Add Item Form Sheet (Collapsible) */}
              <AnimatePresence>
                {isAdding && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateItem}
                    className="overflow-hidden rounded-3xl p-4 glass border border-primary/30 shadow-md space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-primary flex items-center gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        填寫庫存物品資訊
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelAdd}
                        className="bouncy flex h-7 w-7 items-center justify-center rounded-full neu text-muted-foreground active:scale-90"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Item Name */}
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground">物品名稱 *</label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="例如：鮮乳坊鮮奶、巴斯克乳酪、面膜"
                        className="mt-1 h-11 w-full rounded-2xl neu-inset px-3 text-sm font-semibold outline-none"
                      />
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground">保存溫層 *</label>
                      <div className="grid grid-cols-4 gap-1.5 mt-1">
                        {(Object.keys(INVENTORY_CATEGORIES) as InventoryCategory[]).map((cat) => {
                          const m = INVENTORY_CATEGORIES[cat];
                          const selected = newCategory === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setNewCategory(cat)}
                              className={cn(
                                "bouncy flex min-h-[44px] flex-col items-center justify-center rounded-2xl py-1.5 text-xs font-bold transition-all active:scale-95",
                                selected
                                  ? "bg-primary text-primary-foreground shadow-xs"
                                  : "neu text-muted-foreground"
                              )}
                            >
                              <span>{m.icon}</span>
                              <span className="text-[10px] mt-0.5">{m.tag}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Expiry Date & Quick Chips */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-muted-foreground">
                          保存期限 / 到期日 *
                        </label>
                        <div className="flex items-center gap-1">
                          {[3, 7, 14, 30].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => handleQuickAddDays(d)}
                              className="bouncy rounded-lg neu px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground hover:text-foreground active:scale-90"
                            >
                              +{d}天
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="relative mt-1">
                        <input
                          type="date"
                          required
                          value={newExpiryDate}
                          onChange={(e) => setNewExpiryDate(e.target.value)}
                          className="h-11 w-full rounded-2xl neu-inset px-3 text-sm font-semibold outline-none appearance-none"
                        />
                        <Calendar className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Quantity & Note */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground">數量 / 規格</label>
                        <input
                          type="text"
                          value={newQuantity}
                          onChange={(e) => setNewQuantity(e.target.value)}
                          placeholder="例如：1 瓶 / 2 包"
                          className="mt-1 h-11 w-full rounded-2xl neu-inset px-3 text-xs font-semibold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground">小備註</label>
                        <input
                          type="text"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="例如：早點吃掉"
                          className="mt-1 h-11 w-full rounded-2xl neu-inset px-3 text-xs font-semibold outline-none"
                        />
                      </div>
                    </div>

                    {/* Photo Upload with IndexedDB */}
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="bouncy flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-2xl neu px-3 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-95"
                        >
                          <Camera className="h-4 w-4 text-primary" />
                          <span>{isUploadingPhoto ? "儲存相片中..." : newPhotoKey ? "更換相片" : "拍照 / 選擇相片"}</span>
                        </button>

                        {newPhotoKey && (
                          <NewPhotoPreview
                            photoKey={newPhotoKey}
                            onRemove={() => setNewPhotoKey(null)}
                          />
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCancelAdd}
                        className="bouncy flex min-h-[48px] flex-1 items-center justify-center rounded-2xl neu text-xs font-bold text-muted-foreground active:scale-95"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="bouncy flex min-h-[48px] flex-1 items-center justify-center rounded-2xl text-xs font-black text-primary-foreground shadow-sm active:scale-95"
                        style={{
                          backgroundImage:
                            "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
                        }}
                      >
                        確認加入
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Items List */}
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-2.5 flex h-16 w-16 items-center justify-center rounded-full neu text-3xl">
                    {showConsumed ? "✨" : "🛒"}
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {showConsumed ? "目前沒有已吃完記錄" : "目前沒有儲存的物品"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {showConsumed ? "吃完物品後點擊勾勾就會記錄在這裡唷！" : "點擊「+ 新增物品」將冰箱美食記錄下來吧！"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredItems.map((item) => (
                    <InventoryItemCard
                      key={item.id}
                      item={item}
                      onDelete={() => deleteItem(item.id)}
                      onToggleConsumed={() => toggleConsumed(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Done Button */}
            <div className="mt-4 pt-2 border-t border-border/30 shrink-0">
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
                完成
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** 預覽剛上傳的照片 */
function NewPhotoPreview({
  photoKey,
  onRemove,
}: {
  photoKey: string;
  onRemove: () => void;
}) {
  const resolved = useResolvedPhoto(photoKey);

  return (
    <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden border border-white/60 dark:border-white/10 shadow-xs">
      {resolved && (
        <img
          src={resolved}
          alt="Preview"
          className="h-full w-full object-cover aspect-square"
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-white shadow-xs"
        title="移除照片"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

/** 庫存卡片呈現元件 */
function InventoryItemCard({
  item,
  onDelete,
  onToggleConsumed,
}: {
  item: InventoryItem;
  onDelete: () => void;
  onToggleConsumed: () => void;
}) {
  const resolvedPhoto = useResolvedPhoto(item.photoKey);
  const meta = INVENTORY_CATEGORIES[item.category];

  const daysLeft = getDaysUntilExpiry(item.expiryDate);
  const tagInfo = getExpiryTagInfo(daysLeft);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "relative flex items-center gap-3 rounded-[26px] p-3.5 glass border border-white/60 dark:border-white/10 shadow-sm transition-all overflow-hidden",
        item.isConsumed && "opacity-60 bg-muted/30"
      )}
    >
      {/* Left Photo or Icon - Perfectly centered and sized */}
      <div className="relative h-14 w-14 shrink-0 rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 shadow-xs flex items-center justify-center bg-card select-none">
        {resolvedPhoto ? (
          <img
            src={resolvedPhoto}
            alt={item.name}
            className="h-full w-full object-cover aspect-square"
            loading="lazy"
          />
        ) : (
          <span className="text-2xl leading-none select-none flex items-center justify-center">{meta.icon}</span>
        )}
      </div>

      {/* Middle Information - Multi-layer overflow defense */}
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0">
          <p
            className={cn(
              "truncate text-sm font-black text-foreground min-w-0 flex-1",
              item.isConsumed && "line-through text-muted-foreground"
            )}
            title={item.name}
          >
            {item.name}
          </p>
          {item.quantity && (
            <span className="shrink-0 max-w-[84px] truncate rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-secondary-foreground">
              {item.quantity}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 min-w-0 flex-wrap">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 shrink-0">
            <span>{meta.icon}</span>
            <span>{meta.tag}</span>
          </span>
          <span className="text-muted-foreground/40 text-[10px] shrink-0">·</span>
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            <span>到期 {item.expiryDate}</span>
          </span>
        </div>

        {item.note && (
          <p className="mt-1 truncate text-[10px] font-medium text-muted-foreground/80 min-w-0" title={item.note}>
            {item.note}
          </p>
        )}
      </div>

      {/* Right Side Traffic Light Tag & Quick Actions */}
      <div className="flex flex-col items-end justify-between gap-1.5 shrink-0 min-w-[76px]">
        {!item.isConsumed ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold tracking-tight shadow-xs shrink-0 select-none",
              tagInfo.badgeClass,
              tagInfo.pulse && "animate-pulse"
            )}
          >
            {(tagInfo.status === "expired" || tagInfo.status === "today") && (
              <AlertTriangle className="h-3 w-3 shrink-0" />
            )}
            <span>{tagInfo.label}</span>
          </span>
        ) : (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground shrink-0 select-none">
            已吃完 ✨
          </span>
        )}

        <div className="flex items-center gap-1">
          {/* Toggle Consumed button - Min 44px touch target on mobile */}
          <button
            type="button"
            onClick={onToggleConsumed}
            className={cn(
              "bouncy flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition-all active:scale-95",
              item.isConsumed
                ? "bg-secondary text-secondary-foreground"
                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25"
            )}
            title={item.isConsumed ? "恢復為保存中" : "標記為已吃完"}
            aria-label={item.isConsumed ? "恢復為保存中" : "標記為已吃完"}
          >
            {item.isConsumed ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          </button>

          {/* Delete item button - Min 44px touch target on mobile */}
          <button
            type="button"
            onClick={onDelete}
            className="bouncy flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl neu text-muted-foreground hover:text-destructive active:scale-95"
            title="刪除項目"
            aria-label="刪除庫存項目"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
