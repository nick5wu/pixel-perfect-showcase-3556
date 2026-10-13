/**
 * ============================================================================
 * UsTwo Ledger - 4 位數 PIN 碼解鎖與設定彈窗 (PinModal)
 * ============================================================================
 * 
 * 依照 save-money-rules 規範：
 * - 48px 觸控熱區按鍵
 * - Framer Motion 彈簧過場與震動回饋
 * - 暖色調燕麥黏土風與毛玻璃遮罩
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, KeyRound, X, Delete, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useVaultLock } from "@/lib/vaultLock";
import { useBodyScrollLock } from "@/lib/utils";

interface PinModalProps {
  open: boolean;
  mode: "unlock" | "setup";
  title?: string;
  description?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const PAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "cancel", "0", "del"];

export function PinModal({
  open,
  mode,
  title,
  description,
  onSuccess,
  onCancel,
}: PinModalProps) {
  useBodyScrollLock(open);
  const { unlock, setPin } = useVaultLock();

  const [entered, setEntered] = useState("");
  const [firstEntered, setFirstEntered] = useState<string | null>(null); // For setup confirmation
  const [errorShake, setErrorShake] = useState(false);

  useEffect(() => {
    if (open) {
      setEntered("");
      setFirstEntered(null);
      setErrorShake(false);
    }
  }, [open]);

  if (!open) return null;

  const handleDigit = (digit: string) => {
    if (digit === "cancel") {
      onCancel();
      return;
    }
    if (digit === "del") {
      setEntered((p) => p.slice(0, -1));
      return;
    }
    if (entered.length >= 4) return;

    const next = entered + digit;
    setEntered(next);

    if (next.length === 4) {
      if (mode === "unlock") {
        const ok = unlock(next);
        if (ok) {
          toast.success("🔓 私密帳本已解鎖");
          onSuccess();
        } else {
          setErrorShake(true);
          toast.error("PIN 碼錯誤，請重新輸入 ❌");
          setTimeout(() => {
            setEntered("");
            setErrorShake(false);
          }, 600);
        }
      } else if (mode === "setup") {
        if (!firstEntered) {
          // First time entry in setup mode
          setFirstEntered(next);
          setEntered("");
          toast.info("請再次輸入確認 PIN 碼 🔑");
        } else {
          // Confirming second entry in setup mode
          if (next === firstEntered) {
            setPin(next);
            toast.success("✨ 私房錢防窺 PIN 碼設定成功！");
            onSuccess();
          } else {
            setErrorShake(true);
            toast.error("兩次輸入的 PIN 碼不一致，請重試 ⚠️");
            setTimeout(() => {
              setFirstEntered(null);
              setEntered("");
              setErrorShake(false);
            }, 600);
          }
        }
      }
    }
  };

  const defaultTitle =
    mode === "unlock"
      ? "輸入 PIN 碼解鎖"
      : firstEntered
        ? "再次確認 PIN 碼"
        : "設定 4 位數 PIN 碼";

  const defaultDesc =
    mode === "unlock"
      ? "查看私房錢明細或切換身分需先進行驗證"
      : firstEntered
        ? "請再次鍵入以確認密碼"
        : "為同一設備上的個人花費設定專屬防窺密碼";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-foreground/45 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="glass-strong relative z-10 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl overflow-hidden select-none"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
        }}
      >
        <button
          onClick={onCancel}
          className="bouncy absolute right-5 top-5 flex min-h-[48px] min-w-[48px] h-12 w-12 items-center justify-center rounded-full neu active:scale-95"
          aria-label="關閉"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon & Title */}
        <div className="text-center pt-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {mode === "unlock" ? <Lock className="h-7 w-7" /> : <KeyRound className="h-7 w-7" />}
          </div>
          <h3 className="text-lg font-extrabold text-foreground">{title || defaultTitle}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{description || defaultDesc}</p>
        </div>

        {/* 4-digit indicators */}
        <motion.div
          animate={errorShake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="my-6 flex justify-center items-center gap-4"
        >
          {[0, 1, 2, 3].map((i) => {
            const isFilled = i < entered.length;
            return (
              <div
                key={i}
                className="flex h-12 w-12 items-center justify-center rounded-2xl neu transition-all"
                style={{
                  backgroundColor: isFilled ? "var(--caramel)" : undefined,
                  boxShadow: isFilled ? "var(--shadow-pop)" : "var(--neu-inset)",
                }}
              >
                {isFilled && <div className="h-3 w-3 rounded-full bg-primary-foreground shadow-sm" />}
              </div>
            );
          })}
        </motion.div>

        {/* Numeric Numpad */}
        <div className="grid grid-cols-3 gap-2.5">
          {PAD.map((k) => {
            if (k === "cancel") {
              return (
                <button
                  key={k}
                  onClick={() => handleDigit(k)}
                  className="bouncy flex min-h-[52px] h-13 items-center justify-center rounded-2xl text-xs font-bold text-muted-foreground active:scale-95"
                >
                  取消
                </button>
              );
            }
            if (k === "del") {
              return (
                <button
                  key={k}
                  onClick={() => handleDigit(k)}
                  className="bouncy flex min-h-[52px] h-13 items-center justify-center rounded-2xl neu text-foreground active:scale-95"
                  aria-label="刪除最後一位"
                >
                  <Delete className="h-5 w-5" />
                </button>
              );
            }
            return (
              <button
                key={k}
                onClick={() => handleDigit(k)}
                className="bouncy flex min-h-[52px] h-13 items-center justify-center rounded-2xl neu text-lg font-extrabold text-foreground active:scale-95"
              >
                {k}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
