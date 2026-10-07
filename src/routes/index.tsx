import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Cloud } from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { BottomNav, type Tab } from "@/components/ustwo/BottomNav";
import { HomeTab } from "@/components/ustwo/HomeTab";
import { SavingsTab } from "@/components/ustwo/SavingsTab";
import { OverviewTab } from "@/components/ustwo/OverviewTab";
import { StatsTab } from "@/components/ustwo/StatsTab";
import { SettingsTab } from "@/components/ustwo/SettingsTab";
import { AddModal } from "@/components/ustwo/AddModal";
import { CloudModal } from "@/components/ustwo/CloudModal";
import { Avatar } from "@/components/ustwo/shared";
import { PEOPLE, UsTwoProvider, toKey, useUsTwo, type UserId, type Txn } from "@/lib/ustwo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")(({
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
}));

function UserSwitcher() {
  const { activeUser, setActiveUser, people } = useUsTwo();
  return (
    <div className="glass-strong flex items-center gap-1 rounded-full p-1">
      {(["me", "her"] as UserId[]).map((u) => (
        <button
          key={u}
          onClick={() => setActiveUser(u)}
          className={cn(
            "bouncy flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3 text-xs font-bold",
            activeUser === u ? "text-primary-foreground" : "text-muted-foreground",
          )}
          style={
            activeUser === u
              ? { backgroundColor: people[u].color, boxShadow: "var(--shadow-pop)" }
              : undefined
          }
        >
          <Avatar who={u} size="sm" />
          {u === "me" ? `以${people[u].zh}的身分` : `以${people[u].zh}的身分`}
        </button>
      ))}
    </div>
  );
}

function App() {
  const { isPaired, coupleCode, cloudStatus } = useUsTwo();
  const [tab, setTab] = useState<Tab>("home");
  const [selected, setSelected] = useState(() => toKey(new Date()));
  const [adding, setAdding] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Txn | null>(null);
  const [cloudOpen, setCloudOpen] = useState(false);

  const handleEdit = (t: Txn) => {
    setEditingTxn(t);
  };

  return (
    <div className="ambient-glow min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md px-4 pb-36 pt-6">
        <header className="mb-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">我們倆的記帳小窩</h1>
              <p className="text-xs font-medium text-muted-foreground">
                UsTwo Ledger · 一起把日子記成甜的 🧡
              </p>
            </div>
            <button
              onClick={() => setCloudOpen(true)}
              className={cn(
                "bouncy flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold glass shadow-sm",
                isPaired && cloudStatus === "connected"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-muted-foreground",
              )}
              title="雲端雙人同步設定"
            >
              <Cloud className="h-3.5 w-3.5 text-primary" />
              <span>{isPaired && coupleCode ? coupleCode : "雙人同步"}</span>
            </button>
          </div>
          <UserSwitcher />
        </header>

        {tab === "home" && <HomeTab selected={selected} onSelect={setSelected} onEdit={handleEdit} />}
        {tab === "savings" && <SavingsTab />}
        {tab === "overview" && <OverviewTab onEdit={handleEdit} />}
        {tab === "stats" && <StatsTab onEdit={handleEdit} />}
        {tab === "settings" && <SettingsTab onOpenCloud={() => setCloudOpen(true)} />}
      </div>

      <button
        onClick={() => setAdding(true)}
        aria-label="Add expense"
        className="bouncy fixed bottom-28 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground"
        style={{
          backgroundImage: "linear-gradient(140deg, var(--caramel), var(--caramel-soft))",
          boxShadow: "var(--shadow-pop), var(--shadow-neu)",
        }}
      >
        <Plus className="h-8 w-8" strokeWidth={2.6} />
      </button>

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

      <BottomNav tab={tab} onChange={setTab} />
      <Toaster position="top-center" />
    </div>
  );
}
