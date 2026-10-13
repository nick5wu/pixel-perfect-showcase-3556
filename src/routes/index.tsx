import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Cloud, Lock, Unlock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";
import { BottomNav, type Tab } from "@/components/ustwo/BottomNav";
import { HomeTab } from "@/components/ustwo/HomeTab";
import { SavingsTab } from "@/components/ustwo/SavingsTab";
import { OverviewTab } from "@/components/ustwo/OverviewTab";
import { StatsTab } from "@/components/ustwo/StatsTab";
import { SettingsTab } from "@/components/ustwo/SettingsTab";
import { AddModal } from "@/components/ustwo/AddModal";
import { CloudModal } from "@/components/ustwo/CloudModal";
import { PinModal } from "@/components/ustwo/PinModal";
import { FarmView } from "@/components/farm";
import { UsTwoProvider, toKey, useUsTwo, type Txn, type UserId } from "@/lib/ustwo";
import { useVaultLock } from "@/lib/vaultLock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UsTwo Ledger 我們倆的記帳小窩" },
      {
        name: "description",
        content: "情侶專屬的溫暖記帳小窩：共同帳本、私人花費、夢想撲滿與可愛的日曆檢視。",
      },
      { property: "og:title", content: "UsTwo Ledger 我們倆的記帳小窩" },
      {
        property: "og:description",
        content: "情侶專屬的溫暖記帳小窩：共同帳本、私人花費、夢想撲滿與可愛的日曆檢視。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<div className="ambient-glow min-h-screen bg-background" />}>
      <UsTwoProvider>
        <App />
      </UsTwoProvider>
    </ClientOnly>
  ),
});

function App() {
  const { isPaired, coupleCode, cloudStatus, activeUser, setActiveUser, people } = useUsTwo();
  const { hasPin, isUnlocked, lock } = useVaultLock();
  const [tab, setTab] = useState<Tab>("home");
  const [selected, setSelected] = useState(() => toKey(new Date()));
  const [adding, setAdding] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Txn | null>(null);
  const [cloudOpen, setCloudOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingSwitchUser, setPendingSwitchUser] = useState<UserId | null>(null);

  const handleEdit = (t: Txn) => {
    setEditingTxn(t);
  };

  const handleSwitchUser = (target: UserId) => {
    if (target === activeUser) return;
    if (hasPin && !isUnlocked) {
      setPendingSwitchUser(target);
      setPinModalOpen(true);
      return;
    }
    setActiveUser(target);
    toast.success(`已切換記帳身分：${people[target].emoji} ${people[target].zh}`);
  };

  const handlePinSuccess = () => {
    setPinModalOpen(false);
    if (pendingSwitchUser) {
      setActiveUser(pendingSwitchUser);
      toast.success(`已驗證身分並切換為：${people[pendingSwitchUser].emoji} ${people[pendingSwitchUser].zh}`);
      setPendingSwitchUser(null);
    }
  };

  return (
    <div
      className="ambient-glow min-h-screen bg-background"
      style={{
        // Android notification bar / status bar safe area protection:
        // When in farm mode, FarmHeader itself handles sticky safe-area-inset-top padding
        paddingTop: tab === "farm" ? 0 : "max(env(safe-area-inset-top), 24px)",
      }}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-md",
          tab === "farm" ? "px-0 sm:px-2" : "px-4"
        )}
        style={{
          // Reserve space above bottom navigation & Android gesture/3-button bar
          paddingBottom: "calc(max(env(safe-area-inset-bottom), 24px) + 96px)",
        }}
      >
        {tab !== "farm" && (
          <header className="mb-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">我們倆的記帳小窩</h1>
                <p className="text-xs font-medium text-muted-foreground">
                  UsTwo Ledger · 一起把日子記成甜的 🧡
                </p>
              </div>
              <button
                onClick={() => setCloudOpen(true)}
                className={cn(
                  "bouncy flex min-h-[48px] items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold glass shadow-xs shrink-0 active:scale-95",
                  isPaired && cloudStatus === "connected"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-muted-foreground",
                )}
                title="雲端雙人同步設定"
                aria-label="雲端雙人同步設定"
              >
                <Cloud className="h-4 w-4 text-primary" />
                <span>{isPaired && coupleCode ? coupleCode : "雙人同步"}</span>
              </button>
            </div>

            {/* Active User Switcher Bar with Vault Lock Security */}
            <div className="flex items-center justify-between rounded-2xl glass px-3 py-1.5 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-muted-foreground">當前身分：</span>
                <div className="flex items-center gap-1">
                  {(["me", "her"] as const).map((who) => {
                    const p = people[who];
                    const isActive = activeUser === who;
                    return (
                      <button
                        key={who}
                        type="button"
                        onClick={() => handleSwitchUser(who)}
                        className={cn(
                          "bouncy flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "neu text-muted-foreground hover:text-foreground",
                        )}
                        aria-label={`切換至${p.zh}`}
                      >
                        <span>{p.emoji}</span>
                        <span>{p.zh}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vault Security Status & Quick Lock Toggle */}
              {hasPin ? (
                isUnlocked ? (
                  <button
                    type="button"
                    onClick={() => {
                      lock();
                      toast.success("🔒 私房錢保險箱已立即上鎖！");
                    }}
                    className="bouncy flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-500/15 dark:text-emerald-300 dark:bg-emerald-950/40 active:scale-95"
                    title="保險箱已解鎖 · 點擊立即上鎖"
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    <span>已解鎖 · 上鎖</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingSwitchUser(null);
                      setPinModalOpen(true);
                    }}
                    className="bouncy flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold text-amber-800 bg-amber-500/15 dark:text-amber-200 dark:bg-amber-950/40 active:scale-95"
                    title="私房錢已上鎖 · 點擊輸入 PIN 碼解鎖"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>私房錢已鎖</span>
                  </button>
                )
              ) : null}
            </div>
          </header>
        )}

        {/* Android Material Shared-Axis fluid Tab Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.985 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="w-full"
          >
            {tab === "home" && <HomeTab selected={selected} onSelect={setSelected} onEdit={handleEdit} />}
            {tab === "savings" && <SavingsTab />}
            {tab === "overview" && <OverviewTab onEdit={handleEdit} />}
            {tab === "farm" && <FarmView onBack={() => setTab("home")} />}
            {tab === "stats" && <StatsTab onEdit={handleEdit} />}
            {tab === "settings" && <SettingsTab onOpenCloud={() => setCloudOpen(true)} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Add Expense Action Button with Android Safe Area offset */}
      {tab !== "farm" && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setAdding(true)}
          aria-label="Add expense"
          className="bouncy fixed right-5 z-40 flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground shadow-2xl active:scale-90"
          style={{
            bottom: "calc(max(env(safe-area-inset-bottom), 24px) + 80px)",
            backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
            boxShadow: "var(--shadow-pop), var(--shadow-neu)",
          }}
        >
          <Plus className="h-8 w-8" strokeWidth={2.6} />
        </motion.button>
      )}

      {/* Cloud Modal */}
      <CloudModal open={cloudOpen} onClose={() => setCloudOpen(false)} />

      {/* Add modal */}
      <AddModal open={adding} onClose={() => setAdding(false)} date={selected} />

      {/* Edit modal */}
      {editingTxn && (
        <AddModal
          open={true}
          onClose={() => setEditingTxn(null)}
          date={editingTxn.date}
          initialTxn={editingTxn}
        />
      )}

      {/* PIN Lock Modal */}
      <PinModal
        open={pinModalOpen}
        mode="unlock"
        title="解鎖私密保險箱"
        description="已啟用 4 碼 PIN 密碼保護，請輸入密碼以解鎖私房錢帳本與切換身分"
        onSuccess={handlePinSuccess}
        onCancel={() => {
          setPinModalOpen(false);
          setPendingSwitchUser(null);
        }}
      />

      <BottomNav tab={tab} onChange={setTab} />
      <Toaster position="top-center" />
    </div>
  );
}
