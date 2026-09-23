import { useState } from "react";
import { Camera, Lock, X, Delete } from "lucide-react";
import { toast } from "sonner";
import {
  CATEGORIES,
  PEOPLE,
  money,
  toKey,
  useUsTwo,
  type Category,
  type UserId,
} from "@/lib/ustwo";
import { Avatar } from "./shared";
import { cn } from "@/lib/utils";

const PAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "del"];

export function AddModal({
  open,
  onClose,
  date,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
}) {
  const { activeUser, addTxn } = useUsTwo();
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState<UserId>(activeUser);
  const [category, setCategory] = useState<Category>("food");
  const [note, setNote] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  if (!open) return null;

  const press = (k: string) => {
    if (k === "del") setAmount((a) => a.slice(0, -1));
    else setAmount((a) => (a.length > 7 ? a : (a + k).replace(/^0+(?=\d)/, "")));
  };

  const save = () => {
    const value = Number(amount);
    if (!value) {
      toast("先輸入金額唷 ✨");
      return;
    }
    addTxn({
      date: date || toKey(new Date()),
      amount: value,
      kind: category === "income" ? "income" : "expense",
      category,
      note: note.trim(),
      payer,
      isPrivate,
      ...(photo ? { photo } : {}),
    });
    toast.success(isPrivate ? "已偷偷記下來 🤫" : "記好囉，甜甜的一筆 🧡");
    setAmount("");
    setNote("");
    setPhoto(null);
    setIsPrivate(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/35 backdrop-blur-sm"
      />
      <div className="glass-strong pop-in relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2.5rem] p-5 pb-8">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
        <button
          onClick={onClose}
          className="bouncy absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full neu"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-center text-xs font-semibold text-muted-foreground">記一筆 · {date}</p>
        <p className="mt-1 text-center text-4xl font-extrabold tabular-nums">
          {amount ? money(Number(amount)) : <span className="text-muted-foreground">NT$0</span>}
        </p>

        {/* Payer */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(["me", "her"] as UserId[]).map((u) => (
            <button
              key={u}
              onClick={() => setPayer(u)}
              className={cn(
                "bouncy flex items-center justify-center gap-2 rounded-3xl px-3 py-2.5 text-sm font-bold",
                payer === u ? "text-primary-foreground" : "neu text-muted-foreground",
              )}
              style={
                payer === u
                  ? { backgroundColor: PEOPLE[u].color, boxShadow: "var(--shadow-pop)" }
                  : undefined
              }
            >
              <Avatar who={u} size="sm" />
              {PEOPLE[u].zh}付
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className="mt-4 grid grid-cols-5 gap-2">
          {(Object.keys(CATEGORIES) as Category[]).map((c) => {
            const Icon = CATEGORIES[c].icon;
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className="bouncy flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-semibold"
                style={{
                  backgroundColor: active
                    ? `color-mix(in oklch, ${CATEGORIES[c].tint} 28%, white)`
                    : "transparent",
                  boxShadow: active ? "var(--shadow-soft)" : "none",
                }}
              >
                <Icon
                  className="h-5 w-5"
                  style={{ color: `color-mix(in oklch, ${CATEGORIES[c].tint} 80%, black)` }}
                />
                {CATEGORIES[c].zh}
              </button>
            );
          })}
        </div>

        {/* Numpad */}
        <div className="mt-4 grid grid-cols-3 gap-2">
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

        {/* Note + photo */}
        <div className="mt-4 flex items-center gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="寫點什麼呢？例如：巷口的鬆餅"
            className="h-12 flex-1 rounded-2xl neu-inset px-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => setPhoto(photo ? null : "polaroid")}
            className="bouncy flex h-12 w-12 items-center justify-center rounded-2xl neu"
            aria-label="Add photo"
          >
            <Camera className="h-5 w-5 text-primary" />
          </button>
        </div>

        {photo && (
          <div className="mt-3 flex justify-center">
            <div className="polaroid rotate-[-2deg] rounded-md">
              <div className="flex h-24 w-24 items-center justify-center rounded-sm bg-secondary text-2xl">
                📷
              </div>
              <p className="mt-1 text-center text-[10px] text-muted-foreground">照片預覽</p>
            </div>
          </div>
        )}

        {/* Private */}
        <button
          onClick={() => setIsPrivate((p) => !p)}
          className="glass bouncy mt-4 flex w-full items-center justify-between rounded-3xl px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="h-4 w-4" /> 私人花費 Private
          </span>
          <span
            className={cn("relative h-7 w-12 rounded-full transition-colors")}
            style={{ backgroundColor: isPrivate ? "var(--caramel)" : "var(--border)" }}
          >
            <span
              className="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all"
              style={{ left: isPrivate ? "1.55rem" : "0.25rem" }}
            />
          </span>
        </button>
        <p className="mt-1.5 px-2 text-[11px] text-muted-foreground">
          私人花費只會出現在你自己的統計頁，另一半完全看不到。
        </p>

        <button
          onClick={save}
          className="bouncy mt-4 h-14 w-full rounded-3xl text-base font-extrabold text-primary-foreground"
          style={{
            backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
            boxShadow: "var(--shadow-pop)",
          }}
        >
          記下來 🧡
        </button>
      </div>
    </div>
  );
}
