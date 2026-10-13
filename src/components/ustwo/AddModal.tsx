import { useEffect, useRef, useState } from "react";
import { Camera, CalendarDays, Lock, Users, X, Delete, Plus, Check, ImageOff, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ICONS,
  TINTS,
  iconOf,
  toKey,
  useUsTwo,
  type Category,
  type Kind,
  type Txn,
  type UserId,
} from "@/lib/ustwo";
import { uploadReceiptPhoto, isSupabaseConfigured } from "@/lib/supabase";
import { savePhotoBlob, useResolvedPhoto } from "@/lib/photoStorage";
import { DatePicker } from "./DatePicker";
import { cn, useBodyScrollLock } from "@/lib/utils";

const PAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "del"];

function todayStr() {
  return toKey(new Date());
}

// ─── Image compression helpers ────────────────────────────────────────────────

function compressImage(file: File, maxPx = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function compressImageToBlob(file: File, maxPx = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas to Blob conversion failed"));
      }, "image/jpeg", quality);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Stamp badge ──────────────────────────────────────────────────────────────

function Stamp({ tint, big, children }: { tint: string; big?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn("relative flex items-center justify-center rounded-full", big ? "h-12 w-12" : "h-10 w-10")}
      style={{
        backgroundColor: `color-mix(in oklch, ${tint} 30%, white)`,
        boxShadow: `inset 0 -2px 0 color-mix(in oklch, ${tint} 35%, transparent), 0 2px 6px -2px color-mix(in oklch, ${tint} 50%, transparent)`,
      }}
    >
      <span
        className="absolute inset-[3px] rounded-full border border-dashed"
        style={{ borderColor: `color-mix(in oklch, ${tint} 55%, white)` }}
      />
      {children}
    </span>
  );
}

// ─── AddModal (Private First + Safe Area + Centralized Date) ─────────────────

export function AddModal({
  open,
  onClose,
  date: defaultDate,
  initialTxn,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  initialTxn?: Txn; // when set → edit mode
}) {
  const {
    activeUser,
    addTxn,
    updateTxn,
    categoryGroups,
    resolveCat,
    addSubCategory,
    coupleId,
  } = useUsTwo();
  const isEdit = !!initialTxn;

  useBodyScrollLock(open);

  const [amount, setAmount] = useState(isEdit ? String(initialTxn.amount) : "");
  // Date is directly taken from the current selected/today date, no complex picker here
  const [date, setDate] = useState(isEdit ? initialTxn.date : (defaultDate || todayStr()));
  const [kind, setKind] = useState<Kind>(isEdit ? initialTxn.kind : "expense");

  const resolvedInit = initialTxn ? resolveCat(initialTxn.category, initialTxn.subCategory) : null;
  const initialGroup =
    resolvedInit?.group ||
    categoryGroups.find((g) => g.kind === (initialTxn?.kind || "expense")) ||
    categoryGroups[0];

  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroup?.id || "food");
  const [selectedSubId, setSelectedSubId] = useState<string>(
    resolvedInit?.sub?.id || initialGroup?.subCategories[0]?.id || "",
  );
  const [note, setNote] = useState(isEdit ? initialTxn.note : "");

  // 1. Private First: Default is personal expense (isShared = false).
  // Only when user explicitly enables "轉為共同花費" does it become a joint expense.
  const [isShared, setIsShared] = useState(isEdit ? !initialTxn.isPrivate : false);
  const [forPartnerAmount, setForPartnerAmount] = useState(
    isEdit && initialTxn.forPartnerAmount ? String(initialTxn.forPartnerAmount) : "",
  );

  const [photo, setPhoto] = useState<string | null>(isEdit ? (initialTxn.photo ?? null) : null);
  const resolvedPhoto = useResolvedPhoto(photo);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [inlineAddingSub, setInlineAddingSub] = useState(false);
  const [newSubName, setNewSubName] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  // Sync state when open or initialTxn / defaultDate changes
  useEffect(() => {
    if (open) {
      if (initialTxn) {
        const res = resolveCat(initialTxn.category, initialTxn.subCategory);
        setSelectedGroupId(res.group.id);
        setSelectedSubId(res.sub?.id || res.group.subCategories[0]?.id || "");
        setAmount(String(initialTxn.amount));
        setDate(initialTxn.date);
        setKind(initialTxn.kind);
        setNote(initialTxn.note);
        setIsShared(!initialTxn.isPrivate);
        setForPartnerAmount(initialTxn.forPartnerAmount ? String(initialTxn.forPartnerAmount) : "");
        setPhoto(initialTxn.photo ?? null);
      } else {
        setAmount("");
        setDate(defaultDate || todayStr());
        const defGroup = categoryGroups.find((g) => g.kind === "expense") || categoryGroups[0];
        if (defGroup) {
          setSelectedGroupId(defGroup.id);
          setSelectedSubId(defGroup.subCategories[0]?.id || "");
        }
        setKind("expense");
        setNote("");
        setIsShared(false);
        setForPartnerAmount("");
        setPhoto(null);
      }
      setInlineAddingSub(false);
      setNewSubName("");
    }
  }, [open, initialTxn, defaultDate, categoryGroups, resolveCat]);

  const switchKind = (k: Kind) => {
    setKind(k);
    const firstGroup = categoryGroups.find((g) => g.kind === k) || categoryGroups[0];
    if (firstGroup) {
      setSelectedGroupId(firstGroup.id);
      setSelectedSubId(firstGroup.subCategories[0]?.id || "");
    }
    setInlineAddingSub(false);
  };

  const handleQuickAddSub = () => {
    const zh = newSubName.trim();
    if (!zh) {
      toast("請填寫細項名稱 ✨");
      return;
    }
    const newId = `sub_${Date.now().toString(36)}`;
    const curGroup = categoryGroups.find((g) => g.id === selectedGroupId);
    addSubCategory(selectedGroupId, {
      id: newId,
      zh,
      icon: curGroup?.icon || "sparkles",
    });
    setSelectedSubId(newId);
    setNewSubName("");
    setInlineAddingSub(false);
  };

  const press = (k: string) => {
    if (k === "del") setAmount((a) => a.slice(0, -1));
    else setAmount((a) => (a.length > 7 ? a : (a + k).replace(/^0+(?=\d)/, "")));
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    try {
      if (coupleId && isSupabaseConfigured()) {
        const blob = await compressImageToBlob(file);
        const cloudUrl = await uploadReceiptPhoto(blob, coupleId);
        if (cloudUrl) {
          setPhoto(cloudUrl);
          toast.success("照片已上傳至雲端相簿 ☁️");
          setPhotoLoading(false);
          if (fileRef.current) fileRef.current.value = "";
          return;
        }
      }
      // 離線模式：寫入 IndexedDB，避免 LocalStorage 5MB 配額崩潰
      const blob = await compressImageToBlob(file);
      const idbUri = await savePhotoBlob(blob);
      setPhoto(idbUri);
      toast.success("照片已安全存入離線相簿 📷");
    } catch {
      toast.error("照片載入失敗，請再試一次");
    } finally {
      setPhotoLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = () => {
    const value = Number(amount);
    if (!value) {
      toast("先輸入金額唷 ✨");
      return;
    }

    // Private First logic:
    // isShared === true -> isPrivate = false (共同帳本)
    // isShared === false -> isPrivate = true (個人私人帳)
    const isPrivate = !isShared;
    const partnerAmountNum = isShared ? Number(forPartnerAmount || 0) : 0;

    const txnData = {
      date: date || todayStr(),
      amount: value,
      kind,
      category: selectedGroupId,
      ...(selectedSubId ? { subCategory: selectedSubId } : {}),
      note: note.trim(),
      payer: isEdit ? initialTxn.payer : activeUser,
      isPrivate,
      ...(partnerAmountNum > 0 ? { forPartnerAmount: partnerAmountNum } : {}),
      ...(photo ? { photo } : {}),
    };

    if (isEdit && initialTxn) {
      updateTxn(initialTxn.id, txnData);
      toast.success("已更新這筆記帳 ✏️");
    } else {
      addTxn(txnData);
      toast.success(
        isPrivate
          ? "已記錄為個人花費 🔒"
          : partnerAmountNum > 0
            ? `已記錄共同花費（含代墊 NT$${partnerAmountNum}）👥`
            : "已記錄為共同花費 🧡",
      );
    }
    onClose();
  };

  const money_ = (n: number) => `NT$${Math.round(n).toLocaleString()}`;
  const totalVal = Number(amount || 0);
  const partnerVal = Number(forPartnerAmount || 0);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-[oklch(0.22_0.02_55/0.45)] backdrop-blur-md"
          />

          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="glass-strong relative max-h-[92vh] w-full max-w-md overflow-y-auto overscroll-contain touch-pan-y no-scrollbar rounded-t-[2.5rem] p-5 shadow-2xl"
            style={{
              // Safe Area protection for Android gesture pill and navigation keys
              paddingBottom: "max(env(safe-area-inset-bottom), 28px)",
            }}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />

            <button
              onClick={onClose}
              className="bouncy absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full neu active:scale-95"
              aria-label="關閉"
            >
              <X className="h-5 w-5" />
            </button>

            <p className="text-center text-xs font-semibold text-muted-foreground">
              {isEdit ? "編輯這筆 ✏️" : "記一筆 🧡"}
            </p>
            <p className="mt-1 text-center text-4xl font-extrabold tabular-nums">
              {amount ? money_(Number(amount)) : <span className="text-muted-foreground">NT$0</span>}
            </p>

        {/* 4. 手帳風日期選擇器 (統一手帳風格) */}
        <div className="mt-3">
          <DatePicker value={date} onChange={setDate} />
        </div>

        {/* Kind Toggle (Expense / Income) */}
        <div className="glass mt-3.5 grid grid-cols-2 gap-1 rounded-full p-1">
          {(["expense", "income"] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => switchKind(k)}
              className={cn(
                "bouncy rounded-full py-2 text-sm font-extrabold transition-colors",
                kind === k ? "text-primary-foreground" : "text-muted-foreground",
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
              {k === "expense" ? "支出 Expense" : "收入 Income"}
            </button>
          ))}
        </div>

        {/* Nested Categories Selection */}
        {(() => {
          const currentSelectedGroup = categoryGroups.find((g) => g.id === selectedGroupId);
          const currentSelectedSub = currentSelectedGroup?.subCategories.find((s) => s.id === selectedSubId);

          return (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold text-muted-foreground">選擇分類與細項</p>
                {currentSelectedGroup && (
                  <span className="text-[11px] font-extrabold text-primary">
                    {currentSelectedGroup.zh}
                    {currentSelectedSub ? ` · ${currentSelectedSub.zh}` : ""}
                  </span>
                )}
              </div>

              {/* Main Categories 5-column grid */}
              <div className="grid grid-cols-5 gap-1.5">
                {categoryGroups
                  .filter((g) => g.kind === kind)
                  .map((g) => {
                    const Icon = (g.icon && ICONS[g.icon]) || Sparkles;
                    const active = selectedGroupId === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setSelectedGroupId(g.id);
                          setSelectedSubId(g.subCategories[0]?.id || "");
                          setInlineAddingSub(false);
                        }}
                        className="bouncy flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-semibold transition-all active:scale-95"
                        style={{
                          backgroundColor: active
                            ? `color-mix(in oklch, ${g.tint} 22%, white)`
                            : "transparent",
                          boxShadow: active ? "var(--shadow-soft)" : "none",
                        }}
                      >
                        <Stamp tint={g.tint}>
                          <Icon
                            className="h-[18px] w-[18px]"
                            strokeWidth={2.2}
                            style={{ color: `color-mix(in oklch, ${g.tint} 75%, black)` }}
                          />
                        </Stamp>
                        <span
                          className={cn(
                            "w-full truncate px-0.5 text-center",
                            active ? "font-bold text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {g.zh}
                        </span>
                      </button>
                    );
                  })}
              </div>

              {/* Subcategories Inset Tray */}
              {currentSelectedGroup && currentSelectedGroup.subCategories.length > 0 && (
                <div className="neu-inset rounded-2xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {currentSelectedGroup.zh} · 細項選擇
                    </span>
                    {!inlineAddingSub && (
                      <button
                        type="button"
                        onClick={() => setInlineAddingSub(true)}
                        className="bouncy flex items-center gap-0.5 text-[10px] font-bold text-primary active:scale-95"
                      >
                        <Plus className="h-3 w-3" />
                        自訂細項
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {currentSelectedGroup.subCategories.map((sub) => {
                      const isSubActive = selectedSubId === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setSelectedSubId(sub.id)}
                          className={cn(
                            "bouncy rounded-full px-3 py-1 text-xs font-bold transition-all active:scale-95",
                            isSubActive
                              ? "text-primary-foreground shadow-xs font-black"
                              : "bg-background/80 text-muted-foreground hover:text-foreground",
                          )}
                          style={
                            isSubActive
                              ? {
                                  backgroundColor: currentSelectedGroup.tint,
                                  boxShadow: "var(--shadow-soft)",
                                }
                              : undefined
                          }
                        >
                          {sub.zh}
                        </button>
                      );
                    })}
                  </div>

                  {inlineAddingSub && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        autoFocus
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value.slice(0, 8))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleQuickAddSub();
                          if (e.key === "Escape") setInlineAddingSub(false);
                        }}
                        placeholder="輸入新細項名稱..."
                        className="h-8 flex-1 rounded-xl bg-background px-2.5 text-xs font-medium outline-none border border-border focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddSub}
                        className="bouncy flex h-8 px-2.5 items-center justify-center rounded-xl bg-primary text-[11px] font-bold text-primary-foreground shadow active:scale-95"
                      >
                        加入
                      </button>
                      <button
                        type="button"
                        onClick={() => setInlineAddingSub(false)}
                        className="bouncy flex h-8 px-2 items-center justify-center rounded-xl neu text-[11px] font-bold text-muted-foreground active:scale-95"
                      >
                        取消
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Numpad */}
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          {PAD.map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              className="bouncy flex h-12 items-center justify-center rounded-2xl neu text-lg font-bold"
            >
              {k === "del" ? <Delete className="h-5 w-5" /> : k}
            </button>
          ))}
        </div>

        {/* Note + Photo */}
        <div className="mt-3.5 flex items-center gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="寫點備註，例如：巷口鬆餅 🥞"
            className="h-12 flex-1 rounded-2xl neu-inset px-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhoto}
          />
          <button
            onClick={() => (photo ? setPhoto(null) : fileRef.current?.click())}
            className="bouncy flex h-12 w-12 items-center justify-center rounded-2xl neu"
            aria-label={photo ? "移除照片" : "新增照片"}
          >
            {photoLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : photo ? (
              <ImageOff className="h-5 w-5 text-destructive" />
            ) : (
              <Camera className="h-5 w-5 text-primary" />
            )}
          </button>
        </div>

        {/* Polaroid photo preview */}
        {photo && (
          <div className="mt-3 flex justify-center">
            <div className="polaroid rotate-[-2deg] rounded-md">
              <img
                src={resolvedPhoto || photo}
                alt="選取的照片"
                className="h-28 w-28 rounded-sm object-cover"
              />
              <p className="mt-1 text-center text-[10px] text-muted-foreground">點相機圖標可移除 📷</p>
            </div>
          </div>
        )}

        {/* 1. Private First: Shared Expense Switch & Breakdown */}
        <div className="glass mt-4 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl transition-colors"
                style={{
                  backgroundColor: isShared ? "var(--caramel)" : "var(--color-cream)",
                  color: isShared ? "white" : "var(--muted-foreground)",
                  boxShadow: isShared ? "var(--shadow-soft)" : "none",
                }}
              >
                {isShared ? <Users className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-bold">
                  {isShared ? "轉為共同花費 👥" : "純個人花費 🔒"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isShared
                    ? "雙方小窩均可見 · 可記錄代墊明細"
                    : "預設模式：僅自己可見，對方看不到"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsShared((s) => !s)}
              aria-label="切換共同花費模式"
              className="bouncy relative flex h-10 w-16 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors active:scale-95"
              style={{ backgroundColor: isShared ? "var(--caramel)" : "var(--border)" }}
            >
              <span
                className="h-7 w-7 rounded-full bg-[#FAF8F5] shadow-md transition-transform"
                style={{ transform: isShared ? "translateX(1.5rem)" : "translateX(0)" }}
              />
            </button>
          </div>

          {/* Breakdown input: ONLY visible when Shared Expense is toggled ON */}
          {isShared && (
            <div className="pop-in mt-3.5 space-y-2.5 border-t border-border/50 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  包含我幫對方出了多少：
                </label>
                {partnerVal > 0 && totalVal > 0 && (
                  <span className="text-[11px] font-semibold text-primary">
                    我自己負擔 NT${Math.max(0, totalVal - partnerVal)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-12 flex-1 items-center gap-1.5 rounded-2xl neu-inset px-3.5">
                  <span className="text-xs font-bold text-muted-foreground">NT$</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={forPartnerAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, "");
                      setForPartnerAmount(val);
                    }}
                    placeholder="0（若共同均攤或幫出請填寫）"
                    className="h-full w-full bg-transparent text-sm font-bold outline-none placeholder:text-muted-foreground"
                  />
                </div>
                {forPartnerAmount && (
                  <button
                    type="button"
                    onClick={() => setForPartnerAmount("")}
                    className="bouncy flex h-12 min-w-[48px] shrink-0 items-center justify-center rounded-2xl neu text-muted-foreground active:scale-90"
                    title="清空代墊金額"
                    aria-label="清空代墊金額"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Quick breakdown preset buttons (thumb-friendly 44px targets) */}
              {totalVal > 0 && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setForPartnerAmount(String(Math.round(totalVal / 2)))}
                    className="bouncy flex min-h-[44px] flex-1 items-center justify-center rounded-2xl neu px-2 py-2 text-center text-xs font-bold text-muted-foreground hover:text-foreground active:scale-95"
                  >
                    各付一半 ({Math.round(totalVal / 2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setForPartnerAmount(String(totalVal))}
                    className="bouncy flex min-h-[44px] flex-1 items-center justify-center rounded-2xl neu px-2 py-2 text-center text-xs font-bold text-muted-foreground hover:text-foreground active:scale-95"
                  >
                    我全幫出 ({totalVal})
                  </button>
                  <button
                    type="button"
                    onClick={() => setForPartnerAmount("0")}
                    className="bouncy flex min-h-[44px] flex-1 items-center justify-center rounded-2xl neu px-2 py-2 text-center text-xs font-bold text-muted-foreground hover:text-foreground active:scale-95"
                  >
                    純共同 (0)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          onClick={save}
          className="bouncy mt-4 h-14 w-full rounded-3xl text-base font-extrabold text-primary-foreground active:scale-95"
          style={{
            backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
            boxShadow: "var(--shadow-pop)",
          }}
        >
          {isEdit ? "儲存修改 ✏️" : "記下來 🧡"}
        </button>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}
