import { useEffect, useRef, useState } from "react";
import { Camera, CalendarDays, Lock, Users, X, Delete, Plus, Check, ImageOff } from "lucide-react";
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
import { DatePicker } from "./DatePicker";
import { cn } from "@/lib/utils";

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
  const { activeUser, addTxn, updateTxn, categories, addCategory, removeCategory, coupleId } = useUsTwo();
  const isEdit = !!initialTxn;

  const [amount, setAmount] = useState(isEdit ? String(initialTxn.amount) : "");
  // Date is directly taken from the current selected/today date, no complex picker here
  const [date, setDate] = useState(isEdit ? initialTxn.date : (defaultDate || todayStr()));
  const [kind, setKind] = useState<Kind>(isEdit ? initialTxn.kind : "expense");
  const [category, setCategory] = useState<Category>(isEdit ? initialTxn.category : "breakfast");
  const [note, setNote] = useState(isEdit ? initialTxn.note : "");

  // 1. Private First: Default is personal expense (isShared = false).
  // Only when user explicitly enables "轉為共同花費" does it become a joint expense.
  const [isShared, setIsShared] = useState(isEdit ? !initialTxn.isPrivate : false);
  const [forPartnerAmount, setForPartnerAmount] = useState(
    isEdit && initialTxn.forPartnerAmount ? String(initialTxn.forPartnerAmount) : "",
  );

  const [photo, setPhoto] = useState<string | null>(isEdit ? (initialTxn.photo ?? null) : null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("sparkles");
  const [newTint, setNewTint] = useState<string>("var(--cat-1)");

  const fileRef = useRef<HTMLInputElement>(null);
  const list = categories.filter((c) => c.kind === kind);

  // Sync date when defaultDate changes for add mode
  useEffect(() => {
    if (!isEdit) setDate(defaultDate || todayStr());
  }, [defaultDate, isEdit]);

  const switchKind = (k: Kind) => {
    setKind(k);
    setCategory(categories.find((c) => c.kind === k)?.id ?? "");
    setCreating(false);
    setEditing(false);
  };

  const createCat = () => {
    const zh = newName.trim();
    if (!zh) {
      toast("幫細項取個名字吧 ✨");
      return;
    }
    const def = addCategory({ zh, kind, icon: newIcon, tint: newTint });
    setCategory(def.id);
    setNewName("");
    setCreating(false);
    toast.success(`新增了「${zh}」`);
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
      const b64 = await compressImage(file);
      setPhoto(b64);
      toast.success("照片已備妥 📷");
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
      category,
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

  if (!open) return null;

  const money_ = (n: number) => `NT$${Math.round(n).toLocaleString()}`;
  const totalVal = Number(amount || 0);
  const partnerVal = Number(forPartnerAmount || 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/35 backdrop-blur-sm"
      />

      <div
        className="glass-strong pop-in relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2.5rem] p-5"
        style={{
          // Safe Area protection for Android gesture pill and navigation keys
          paddingBottom: "max(env(safe-area-inset-bottom), 28px)",
        }}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />

        <button
          onClick={onClose}
          className="bouncy absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full neu"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
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

        {/* Subcategories */}
        <div className="mt-3 flex items-center justify-between px-1">
          <p className="text-xs font-bold text-muted-foreground">選擇細項</p>
          {list.some((c) => c.custom) && (
            <button onClick={() => setEditing((e) => !e)} className="text-xs font-bold text-primary">
              {editing ? "完成" : "編輯自訂"}
            </button>
          )}
        </div>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {list.map((c) => {
            const Icon = iconOf(c);
            const active = category === c.id;
            return (
              <div key={c.id} className="relative">
                <button
                  onClick={() => setCategory(c.id)}
                  className="bouncy flex w-full flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-semibold"
                  style={{
                    backgroundColor: active ? `color-mix(in oklch, ${c.tint} 22%, white)` : "transparent",
                    boxShadow: active ? "var(--shadow-soft)" : "none",
                  }}
                >
                  <Stamp tint={c.tint}>
                    <Icon
                      className="h-[18px] w-[18px]"
                      strokeWidth={2.2}
                      style={{ color: `color-mix(in oklch, ${c.tint} 75%, black)` }}
                    />
                  </Stamp>
                  <span className="w-full truncate px-0.5 text-center">{c.zh}</span>
                </button>
                {editing && c.custom && (
                  <button
                    aria-label={`刪除 ${c.zh}`}
                    onClick={() => {
                      removeCategory(c.id);
                      if (category === c.id) setCategory(list[0]?.id ?? "");
                    }}
                    className="pop-in absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={() => setCreating((v) => !v)}
            className="bouncy flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-semibold text-muted-foreground"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-border">
              <Plus className="h-4 w-4" />
            </span>
            新增
          </button>
        </div>

        {creating && (
          <div className="glass pop-in mt-3 space-y-3 rounded-3xl p-4">
            <div className="flex items-center gap-3">
              <Stamp tint={newTint} big>
                {(() => {
                  const I = ICONS[newIcon] ?? Plus;
                  return (
                    <I
                      className="h-5 w-5"
                      strokeWidth={2.2}
                      style={{ color: `color-mix(in oklch, ${newTint} 75%, black)` }}
                    />
                  );
                })()}
              </Stamp>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value.slice(0, 6))}
                placeholder={kind === "expense" ? "例如：健身房" : "例如：二手拍賣"}
                className="h-11 flex-1 rounded-2xl neu-inset px-4 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex justify-between">
              {TINTS.map((t) => (
                <button
                  key={t}
                  aria-label="選擇顏色"
                  onClick={() => setNewTint(t)}
                  className="bouncy flex h-7 w-7 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${t} 45%, white)`,
                    boxShadow: newTint === t ? `0 0 0 2px ${t}` : "none",
                  }}
                >
                  {newTint === t && (
                    <Check
                      className="h-3.5 w-3.5"
                      style={{ color: `color-mix(in oklch, ${t} 70%, black)` }}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="no-scrollbar grid max-h-36 grid-cols-8 gap-1.5 overflow-y-auto">
              {Object.entries(ICONS).map(([key, I]) => (
                <button
                  key={key}
                  aria-label={key}
                  onClick={() => setNewIcon(key)}
                  className="bouncy flex h-9 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: newIcon === key ? `color-mix(in oklch, ${newTint} 30%, white)` : "transparent",
                  }}
                >
                  <I
                    className="h-4 w-4"
                    strokeWidth={2.2}
                    style={{
                      color:
                        newIcon === key
                          ? `color-mix(in oklch, ${newTint} 75%, black)`
                          : "var(--muted-foreground)",
                    }}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={createCat}
              className="bouncy h-11 w-full rounded-2xl text-sm font-extrabold text-primary-foreground"
              style={{ backgroundColor: "var(--caramel)", boxShadow: "var(--shadow-soft)" }}
            >
              新增細項
            </button>
          </div>
        )}

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
                src={photo}
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
              aria-label="Toggle shared expense"
              className="relative h-7 w-12 rounded-full transition-colors"
              style={{ backgroundColor: isShared ? "var(--caramel)" : "var(--border)" }}
            >
              <span
                className="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all"
                style={{ left: isShared ? "1.55rem" : "0.25rem" }}
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
                <div className="flex h-11 flex-1 items-center gap-1.5 rounded-2xl neu-inset px-3.5">
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
                    className="bouncy flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl neu text-muted-foreground"
                    title="清空"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Quick breakdown preset buttons */}
              {totalVal > 0 && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setForPartnerAmount(String(Math.round(totalVal / 2)))}
                    className="bouncy flex-1 rounded-2xl neu py-1.5 text-center text-[11px] font-bold text-muted-foreground hover:text-foreground"
                  >
                    各付一半 ({Math.round(totalVal / 2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setForPartnerAmount(String(totalVal))}
                    className="bouncy flex-1 rounded-2xl neu py-1.5 text-center text-[11px] font-bold text-muted-foreground hover:text-foreground"
                  >
                    我全幫出 ({totalVal})
                  </button>
                  <button
                    type="button"
                    onClick={() => setForPartnerAmount("0")}
                    className="bouncy flex-1 rounded-2xl neu py-1.5 text-center text-[11px] font-bold text-muted-foreground hover:text-foreground"
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
          className="bouncy mt-4 h-14 w-full rounded-3xl text-base font-extrabold text-primary-foreground"
          style={{
            backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
            boxShadow: "var(--shadow-pop)",
          }}
        >
          {isEdit ? "儲存修改 ✏️" : "記下來 🧡"}
        </button>
      </div>
    </div>
  );
}
