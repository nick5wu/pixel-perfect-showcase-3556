import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  UtensilsCrossed,
  Coffee,
  ShoppingBasket,
  Heart,
  TrainFront,
  Gamepad2,
  Cat,
  Home,
  Gift,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import photoCafe from "@/assets/photo-cafe.jpg";
import photoHotpot from "@/assets/photo-hotpot.jpg";
import photoCat from "@/assets/photo-cat.jpg";
import photoTrain from "@/assets/photo-train.jpg";

export type UserId = "me" | "her";

export type Category =
  | "food"
  | "coffee"
  | "grocery"
  | "date"
  | "transit"
  | "fun"
  | "pet"
  | "home"
  | "gift"
  | "income";

export const CATEGORIES: Record<Category, { label: string; zh: string; icon: LucideIcon; tint: string }> = {
  food: { label: "Food", zh: "吃飯", icon: UtensilsCrossed, tint: "var(--cat-1)" },
  coffee: { label: "Coffee", zh: "咖啡", icon: Coffee, tint: "var(--cat-2)" },
  grocery: { label: "Groceries", zh: "採買", icon: ShoppingBasket, tint: "var(--cat-3)" },
  date: { label: "Date", zh: "約會", icon: Heart, tint: "var(--cat-4)" },
  transit: { label: "Transit", zh: "交通", icon: TrainFront, tint: "var(--cat-5)" },
  fun: { label: "Fun", zh: "娛樂", icon: Gamepad2, tint: "var(--cat-6)" },
  pet: { label: "Pet", zh: "毛孩", icon: Cat, tint: "var(--cat-7)" },
  home: { label: "Home", zh: "居家", icon: Home, tint: "var(--cat-8)" },
  gift: { label: "Gift", zh: "禮物", icon: Gift, tint: "var(--cat-4)" },
  income: { label: "Income", zh: "收入", icon: Wallet, tint: "var(--cat-9)" },
};

export type Txn = {
  id: string;
  date: string; // yyyy-MM-dd
  amount: number;
  kind: "expense" | "income";
  category: Category;
  note: string;
  payer: UserId;
  isPrivate: boolean;
  photo?: string;
};

export type Goal = {
  id: string;
  title: string;
  zh: string;
  emoji: string;
  target: number;
  saved: number;
};

export const PEOPLE: Record<UserId, { name: string; zh: string; emoji: string; color: string }> = {
  me: { name: "Me", zh: "我", emoji: "🐻", color: "var(--mine)" },
  her: { name: "Her", zh: "她", emoji: "🐰", color: "var(--hers)" },
};

export function toKey(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shift(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toKey(d);
}

export const money = (n: number) => `NT$${Math.round(n).toLocaleString()}`;

const seed: Txn[] = [
  { id: "t1", date: shift(0), amount: 280, kind: "expense", category: "coffee", note: "早晨兩杯拿鐵 ☕", payer: "me", isPrivate: false, photo: photoCafe },
  { id: "t2", date: shift(0), amount: 145, kind: "expense", category: "grocery", note: "全聯買雞蛋牛奶", payer: "her", isPrivate: false },
  { id: "t3", date: shift(0), amount: 620, kind: "expense", category: "gift", note: "偷偷買的生日禮物 🤫", payer: "me", isPrivate: true },
  { id: "t4", date: shift(-1), amount: 1480, kind: "expense", category: "food", note: "火鍋約會，湯頭超讚", payer: "her", isPrivate: false, photo: photoHotpot },
  { id: "t5", date: shift(-1), amount: 90, kind: "expense", category: "transit", note: "捷運來回", payer: "me", isPrivate: false },
  { id: "t6", date: shift(-2), amount: 760, kind: "expense", category: "pet", note: "貓罐頭 + 貓砂", payer: "her", isPrivate: false, photo: photoCat },
  { id: "t7", date: shift(-2), amount: 350, kind: "expense", category: "fun", note: "夾娃娃機手滑", payer: "her", isPrivate: true },
  { id: "t8", date: shift(-3), amount: 1120, kind: "expense", category: "transit", note: "宜蘭小旅行火車票", payer: "me", isPrivate: false, photo: photoTrain },
  { id: "t9", date: shift(-3), amount: 240, kind: "expense", category: "coffee", note: "巷口手沖", payer: "her", isPrivate: false },
  { id: "t10", date: shift(-4), amount: 18000, kind: "income", category: "income", note: "接案入帳", payer: "me", isPrivate: false },
  { id: "t11", date: shift(-5), amount: 560, kind: "expense", category: "date", note: "電影日 🍿", payer: "me", isPrivate: false },
  { id: "t12", date: shift(-6), amount: 2100, kind: "expense", category: "home", note: "IKEA 抱枕與燭台", payer: "her", isPrivate: false },
  { id: "t13", date: shift(-8), amount: 430, kind: "expense", category: "food", note: "巷口滷味宵夜", payer: "me", isPrivate: false },
  { id: "t14", date: shift(-11), amount: 980, kind: "expense", category: "grocery", note: "週末大採買", payer: "her", isPrivate: false },
  { id: "t15", date: shift(-13), amount: 1500, kind: "expense", category: "fun", note: "演唱會門票", payer: "me", isPrivate: false },
];

const goalSeed: Goal[] = [
  { id: "g1", title: "Trip to Japan", zh: "日本行", emoji: "🗼", target: 120000, saved: 74500 },
  { id: "g2", title: "New Sofa", zh: "新沙發", emoji: "🛋️", target: 32000, saved: 21800 },
  { id: "g3", title: "Rainy Day Fund", zh: "安心基金", emoji: "☂️", target: 60000, saved: 15400 },
  { id: "g4", title: "Cat's Vet Fund", zh: "貓咪醫藥費", emoji: "🐱", target: 20000, saved: 18200 },
];

type Store = {
  activeUser: UserId;
  setActiveUser: (u: UserId) => void;
  txns: Txn[];
  addTxn: (t: Omit<Txn, "id">) => void;
  visible: Txn[];
  goals: Goal[];
  addToGoal: (id: string, amount: number) => void;
  anniversary: string;
};

const Ctx = createContext<Store | null>(null);

export function UsTwoProvider({ children }: { children: ReactNode }) {
  const [activeUser, setActiveUser] = useState<UserId>("me");
  const [txns, setTxns] = useState<Txn[]>(seed);
  const [goals, setGoals] = useState<Goal[]>(goalSeed);

  const value = useMemo<Store>(
    () => ({
      activeUser,
      setActiveUser,
      txns,
      addTxn: (t) => setTxns((prev) => [{ ...t, id: `t${Date.now()}` }, ...prev]),
      visible: txns.filter((t) => !t.isPrivate || t.payer === activeUser),
      goals,
      addToGoal: (id, amount) =>
        setGoals((prev) =>
          prev.map((g) => (g.id === id ? { ...g, saved: Math.min(g.target, g.saved + amount) } : g)),
        ),
      anniversary: "2021-10-16",
    }),
    [activeUser, txns, goals],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUsTwo() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUsTwo must be used inside UsTwoProvider");
  return ctx;
}
