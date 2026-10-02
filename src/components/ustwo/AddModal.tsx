import { useState } from "react";
import { Camera, Lock, X, Delete, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import {
  ICONS,
  TINTS,
  iconOf,
  PEOPLE,
  money,
  toKey,
  useUsTwo,
  type Category,
  type Kind,
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
  const { activeUser, addTxn, categories, addCategory, removeCategory } = useUsTwo();
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState<UserId>(activeUser);
  const [kind, setKind] = useState<Kind>("expense");
  const [category, setCategory] = useState<Category>("breakfast");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("sparkles");
  const [newTint, setNewTint] = useState<string>("var(--cat-1)");
  const list = categories.filter((c) => c.kind === kind);

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
      kind,
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

        {/* Kind */}
        <div className="glass mt-4 grid grid-cols-2 gap-1 rounded-full p-1">
          {(["expense", "income"] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => switchKind(k)}
              className={cn(
                "bouncy rounded-full py-2 text-sm font-extrabold transition-colors",
                kind === k ? "text-primary-foreground" : "text-muted-foreground",
              )}
              style={kind === k ? { backgroundColor: k === "expense" ? "var(--caramel)" : "var(--cat-9)", boxShadow: "var(--shadow-soft)" } : undefined}
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
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} style={{ color: `color-mix(in oklch, ${c.tint} 75%, black)` }} />
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
                  return <I className="h-5 w-5" strokeWidth={2.2} style={{ color: `color-mix(in oklch, ${newTint} 75%, black)` }} />;
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
                  style={{ backgroundColor: `color-mix(in oklch, ${t} 45%, white)`, boxShadow: newTint === t ? `0 0 0 2px ${t}` : "none" }}
                >
                  {newTint === t && <Check className="h-3.5 w-3.5" style={{ color: `color-mix(in oklch, ${t} 70%, black)` }} />}
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
                  style={{ backgroundColor: newIcon === key ? `color-mix(in oklch, ${newTint} 30%, white)` : "transparent" }}
                >
                  <I className="h-4 w-4" strokeWidth={2.2} style={{ color: newIcon === key ? `color-mix(in oklch, ${newTint} 75%, black)` : "var(--muted-foreground)" }} />
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

/** Warm planner-stamp badge: soft cream disc with a dashed inner ring. */
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
