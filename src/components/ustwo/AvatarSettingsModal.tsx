import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Check, Sparkles, Upload, User, X, Trash2 } from "lucide-react";
import { AVATAR_PRESETS, useUsTwo, type UserId, type AvatarPreset } from "@/lib/ustwo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AvatarSettingsModalProps {
  open: boolean;
  onClose: () => void;
  initialUserId?: UserId;
}

export function AvatarSettingsModal({
  open,
  onClose,
  initialUserId = "me",
}: AvatarSettingsModalProps) {
  const { people, setPerson } = useUsTwo();
  const [selectedUser, setSelectedUser] = useState<UserId>(initialUserId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImgError, setPreviewImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProfile = people[selectedUser];
  const isCustomAvatar = currentProfile?.avatarType === "custom" && Boolean(currentProfile.avatarUrl);

  // Compress image on client via canvas to ensure fast load and low storage usage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("請選擇有效的相片檔案 📷");
      return;
    }

    setIsProcessing(true);
    try {
      const base64 = await compressImage(file, 380);
      setPreviewImgError(false);
      setPerson(selectedUser, {
        avatarType: "custom",
        avatarUrl: base64,
      });
      toast.success(`已為「${currentProfile.zh}」更新自訂相片頭像 🌟`);
    } catch (err) {
      console.error("Failed to compress image:", err);
      toast.error("圖片處理失敗，請嘗試其他照片 ⚠️");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSelectPreset = (preset: AvatarPreset) => {
    setPerson(selectedUser, {
      avatarType: "preset",
      avatarPresetId: preset.id,
      emoji: preset.emoji,
    });
    toast.success(`已切換為「${preset.name}」可愛形象 ✨`);
  };

  const handleRemoveCustomAvatar = () => {
    // Revert to default preset
    const fallbackPresetId = selectedUser === "me" ? "bear_tsung" : "rabbit_jung";
    const defaultPreset = AVATAR_PRESETS.find((p) => p.id === fallbackPresetId) || AVATAR_PRESETS[0]!;

    setPerson(selectedUser, {
      avatarType: "preset",
      avatarPresetId: defaultPreset.id,
      emoji: defaultPreset.emoji,
      avatarUrl: undefined,
    });
    toast.success(`已恢復為預設頭像 🐻`);
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

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: "100%", scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: "100%", scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-card/95 border border-white/60 dark:border-white/10 p-6 shadow-2xl backdrop-blur-xl max-h-[90vh] flex flex-col"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
            }}
          >
            {/* Header Drag Handle for Android */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/30 sm:hidden shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-foreground flex items-center gap-1.5">
                    雙人頭像與形象
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    自訂上傳照片或挑選專屬 Q 版動物形象
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

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Scrollable Content */}
            <div className="mt-4 space-y-5 overflow-y-auto overscroll-contain pr-1 flex-1">
              {/* Partner Switcher Tabs */}
              <div className="grid grid-cols-2 gap-1.5 rounded-2xl neu-inset p-1.5">
                {(["me", "her"] as const).map((uid) => {
                  const p = people[uid];
                  const isActive = selectedUser === uid;
                  return (
                    <button
                      key={uid}
                      type="button"
                      onClick={() => {
                        setSelectedUser(uid);
                        setPreviewImgError(false);
                      }}
                      className={cn(
                        "bouncy flex min-h-[48px] items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all",
                        isActive
                          ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="text-lg">
                        {p.avatarType === "custom" && p.avatarUrl ? "📷" : p.emoji}
                      </span>
                      <span>{p.zh}</span>
                      <span className="text-[10px] opacity-60">({p.name})</span>
                    </button>
                  );
                })}
              </div>

              {/* Current Avatar Big Preview Card */}
              <div className="glass flex flex-col items-center justify-center rounded-3xl p-5 border border-white/60 dark:border-white/10 text-center relative overflow-hidden">
                <div className="relative">
                  {/* Outer Glow Ring */}
                  <div
                    className="absolute -inset-2 rounded-full blur-md opacity-40 transition-all"
                    style={{
                      backgroundColor: currentProfile.color,
                    }}
                  />

                  {/* Avatar Element */}
                  <div
                    className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-card shadow-lg overflow-hidden"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${currentProfile.color} 24%, white)`,
                    }}
                  >
                    {isCustomAvatar && !previewImgError ? (
                      <img
                        src={currentProfile.avatarUrl}
                        alt={currentProfile.zh}
                        className="h-full w-full object-cover aspect-square"
                        onError={() => setPreviewImgError(true)}
                      />
                    ) : (
                      <span className="text-5xl select-none">
                        {currentProfile.emoji || (selectedUser === "her" ? "🐰" : "🐻")}
                      </span>
                    )}
                  </div>

                  {/* Camera / Edit Badge */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="bouncy absolute bottom-0 right-0 flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-card active:scale-90"
                    title="上傳自訂照片"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3">
                  <h4 className="text-base font-extrabold text-foreground">
                    {currentProfile.zh}
                  </h4>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                    {isCustomAvatar ? "📷 現正使用：自訂照片頭像" : `✨ 現正使用：${currentProfile.emoji} Q 版形象`}
                  </p>
                </div>

                {/* Upload or Revert Actions */}
                <div className="mt-4 flex items-center gap-2 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="bouncy flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-2xl bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground transition-all active:scale-95 shadow-xs"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{isProcessing ? "處理中..." : "上傳相片"}</span>
                  </button>

                  {isCustomAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveCustomAvatar}
                      className="bouncy flex min-h-[48px] items-center justify-center gap-1 rounded-2xl border border-destructive/30 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-all active:scale-95"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>恢復預設</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Preset Animals Section */}
              <div>
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <span className="text-xs font-black tracking-tight text-foreground">
                    可愛 Q 版形象選項
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    點擊即可立即套用
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected =
                      currentProfile.avatarType === "preset" &&
                      currentProfile.avatarPresetId === preset.id;

                    return (
                      <motion.button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        whileTap={{ scale: 0.96 }}
                        className={cn(
                          "bouncy relative flex items-center gap-3 rounded-2xl p-3 text-left transition-all",
                          "border min-h-[60px] cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                            : "border-border/50 bg-card/60 hover:border-primary/40 hover:bg-card/90"
                        )}
                      >
                        {/* Preset Icon */}
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-xs border border-white/60 dark:border-white/10"
                          style={{
                            backgroundColor: `color-mix(in oklch, ${preset.color} 22%, white)`,
                          }}
                        >
                          {preset.emoji}
                        </div>

                        {/* Preset Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-xs font-black text-foreground">
                              {preset.name}
                            </p>
                            {isSelected && (
                              <Check className="h-4 w-4 shrink-0 text-primary stroke-[3]" />
                            )}
                          </div>
                          <p className="truncate text-[10px] font-semibold text-muted-foreground mt-0.5">
                            {preset.desc}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Confirm Button */}
            <div className="mt-5 pt-2 border-t border-border/40 shrink-0">
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
                完成頭像設定
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Helper function to compress image client-side using HTML Canvas */
function compressImage(file: File, maxSize = 380): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Crop square or scale maintaining aspect ratio
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Unable to create canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // High quality webp / jpeg data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
