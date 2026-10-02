import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  Croissant, Sandwich, Soup, CupSoda, Cookie, Coffee, ShoppingBasket, ShoppingBag, TrainFront,
  Lightbulb, Heart, Cat, Gamepad2, Gift, Home, Wallet, Trophy, TrendingUp, Laptop, Mail, PiggyBank,
  Pizza, IceCreamCone, Shirt, Plane, Car, Bus, Fuel, Pill, Dumbbell, Book, Music, Film, Scissors,
  Baby, Dog, Flower2, Smartphone, Sparkles, Star, Umbrella, Bike, Popcorn, Coins,
  type LucideIcon,
} from "lucide-react";

import photoCafe from "@/assets/photo-cafe.jpg";
import photoHotpot from "@/assets/photo-hotpot.jpg";
import photoCat from "@/assets/photo-cat.jpg";
import photoTrain from "@/assets/photo-train.jpg";

export type UserId = "me" | "her";

export type Kind = "expense" | "income";
export type Category = string;

/** Stamp-style icon library users can pick from. */
export const ICONS: Record<string, LucideIcon> = {
  croissant: Croissant, sandwich: Sandwich, soup: Soup, cupsoda: CupSoda, cookie: Cookie,
  coffee: Coffee, pizza: Pizza, icecream: IceCreamCone, popcorn: Popcorn, basket: ShoppingBasket,
  bag: ShoppingBag, train: TrainFront, bus: Bus, car: Car, bike: Bike, fuel: Fuel, plane: Plane,
  bulb: Lightbulb, home: Home, heart: Heart, cat: Cat, dog: Dog, game: Gamepad2, film: Film,
  music: Music, book: Book, gift: Gift, flower: Flower2, shirt: Shirt, scissors: Scissors,
  pill: Pill, dumbbell: Dumbbell, baby: Baby, phone: Smartphone, umbrella: Umbrella,
  sparkles: Sparkles, star: Star, wallet: Wallet, trophy: Trophy, trend: TrendingUp,
  laptop: Laptop, mail: Mail, piggy: PiggyBank, coins: Coins,
};

const tint = (i: number) => `var(--cat-${i + 1})`;
export const TINTS: string[] = Array.from({ length: 9 }, (_, i) => tint(i));

export type CatDef = {
  id: Category;
  zh: string;
  kind: Kind;
  icon: string; // key in ICONS
  tint: string;
  custom?: boolean;
};

const DEFAULT_CATS: CatDef[] = [
  { id: "breakfast", zh: "早餐", kind: "expense", icon: "croissant", tint: tint(6) },
  { id: "lunch", zh: "午餐", kind: "expense", icon: "sandwich", tint: tint(0) },
  { id: "dinner", zh: "晚餐", kind: "expense", icon: "soup", tint: tint(3) },
  { id: "coffee", zh: "咖啡飲料", kind: "expense", icon: "coffee", tint: tint(1) },
  { id: "snack", zh: "點心宵夜", kind: "expense", icon: "cookie", tint: tint(6) },
  { id: "grocery", zh: "超市採買", kind: "expense", icon: "basket", tint: tint(2) },
  { id: "daily", zh: "生活用品", kind: "expense", icon: "bag", tint: tint(7) },
  { id: "transit", zh: "交通", kind: "expense", icon: "train", tint: tint(4) },
  { id: "home", zh: "居家水電", kind: "expense", icon: "bulb", tint: tint(7) },
  { id: "date", zh: "約會", kind: "expense", icon: "heart", tint: tint(3) },
  { id: "fun", zh: "娛樂", kind: "expense", icon: "game", tint: tint(5) },
  { id: "pet", zh: "毛孩", kind: "expense", icon: "cat", tint: tint(6) },
  { id: "gift", zh: "禮物", kind: "expense", icon: "gift", tint: tint(3) },
  { id: "salary", zh: "薪水", kind: "income", icon: "wallet", tint: tint(8) },
  { id: "bonus", zh: "獎金", kind: "income", icon: "trophy", tint: tint(6) },
  { id: "invest", zh: "投資理財", kind: "income", icon: "trend", tint: tint(2) },
  { id: "side", zh: "接案副業", kind: "income", icon: "laptop", tint: tint(4) },
  { id: "redpacket", zh: "紅包禮金", kind: "income", icon: "mail", tint: tint(3) },
  { id: "otherin", zh: "其他收入", kind: "income", icon: "coins", tint: tint(1) },
];

const FALLBACK: CatDef = { id: "?", zh: "其他", kind: "expense", icon: "sparkles", tint: tint(1) };
export const iconOf = (c: CatDef): LucideIcon => ICONS[c.icon] ?? Sparkles;

export type Txn = {
  id: string;
  date: string; // yyyy-MM-dd
  amount: number;
  kind: Kind;
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
  icon: string; // key in ICONS
  tint: string;
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
  { id: "t4", date: shift(-1), amount: 1480, kind: "expense", category: "dinner", note: "火鍋約會，湯頭超讚", payer: "her", isPrivate: false, photo: photoHotpot },
  { id: "t5", date: shift(-1), amount: 90, kind: "expense", category: "transit", note: "捷運來回", payer: "me", isPrivate: false },
  { id: "t6", date: shift(-2), amount: 760, kind: "expense", category: "pet", note: "貓罐頭 + 貓砂", payer: "her", isPrivate: false, photo: photoCat },
  { id: "t7", date: shift(-2), amount: 350, kind: "expense", category: "fun", note: "夾娃娃機手滑", payer: "her", isPrivate: true },
  { id: "t8", date: shift(-3), amount: 1120, kind: "expense", category: "transit", note: "宜蘭小旅行火車票", payer: "me", isPrivate: false, photo: photoTrain },
  { id: "t9", date: shift(-3), amount: 240, kind: "expense", category: "coffee", note: "巷口手沖", payer: "her", isPrivate: false },
  { id: "t10", date: shift(-4), amount: 18000, kind: "income", category: "side", note: "接案入帳", payer: "me", isPrivate: false },
  { id: "t11", date: shift(-5), amount: 560, kind: "expense", category: "date", note: "電影日 🍿", payer: "me", isPrivate: false },
  { id: "t12", date: shift(-6), amount: 2100, kind: "expense", category: "home", note: "IKEA 抱枕與燭台", payer: "her", isPrivate: false },
  { id: "t13", date: shift(-8), amount: 430, kind: "expense", category: "snack", note: "巷口滷味宵夜", payer: "me", isPrivate: false },
  { id: "t14", date: shift(-11), amount: 980, kind: "expense", category: "grocery", note: "週末大採買", payer: "her", isPrivate: false },
  { id: "t15", date: shift(-13), amount: 1500, kind: "expense", category: "fun", note: "演唱會門票", payer: "me", isPrivate: false },
];

const goalSeed: Goal[] = [
  { id: "g1", title: "Trip to Japan", zh: "日本行", icon: "plane", tint: tint(4), target: 120000, saved: 74500 },
  { id: "g2", title: "New Sofa", zh: "新沙發", icon: "home", tint: tint(0), target: 32000, saved: 21800 },
  { id: "g3", title: "Rainy Day Fund", zh: "安心基金", icon: "umbrella", tint: tint(2), target: 60000, saved: 15400 },
  { id: "g4", title: "Cat's Vet Fund", zh: "貓咪醫藥費", icon: "cat", tint: tint(6), target: 20000, saved: 18200 },
];

type Store = {
  activeUser: UserId;
  setActiveUser: (u: UserId) => void;
  txns: Txn[];
  addTxn: (t: Omit<Txn, "id">) => void;
  visible: Txn[];
  goals: Goal[];
  addToGoal: (id: string, amount: number) => void;
  addGoal: (g: Omit<Goal, "id" | "saved">) => void;
  removeGoal: (id: string) => void;
  anniversary: string;
  categories: CatDef[];
  getCat: (id: Category) => CatDef;
  addCategory: (c: Omit<CatDef, "id" | "custom">) => CatDef;
  removeCategory: (id: Category) => void;
};

const Ctx = createContext<Store | null>(null);

export function UsTwoProvider({ children }: { children: ReactNode }) {
  const [activeUser, setActiveUser] = useState<UserId>("me");
  const [txns, setTxns] = useState<Txn[]>(seed);
  const [goals, setGoals] = useState<Goal[]>(goalSeed);
  const [categories, setCategories] = useState<CatDef[]>(DEFAULT_CATS);

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
      addGoal: (g) => setGoals((prev) => [...prev, { ...g, id: `g${Date.now()}`, saved: 0 }]),
      removeGoal: (id) => setGoals((prev) => prev.filter((g) => g.id !== id)),
      anniversary: "2021-10-16",
      categories,
      getCat: (id) => categories.find((c) => c.id === id) ?? FALLBACK,
      addCategory: (c) => {
        const def: CatDef = { ...c, id: `c${Date.now()}`, custom: true };
        setCategories((prev) => [...prev, def]);
        return def;
      },
      removeCategory: (id) => setCategories((prev) => prev.filter((c) => c.id !== id || !c.custom)),
    }),
    [activeUser, txns, goals, categories],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUsTwo() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUsTwo must be used inside UsTwoProvider");
  return ctx;
}
