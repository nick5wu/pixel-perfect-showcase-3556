import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

import { getSupabase, isSupabaseConfigured } from "./supabase";
import {
  getStoredCouple,
  setStoredCouple,
  clearStoredCouple,
  createCoupleInCloud,
  joinCoupleInCloud,
  fetchCoupleRemoteData,
  saveTxnInCloud,
  deleteTxnInCloud,
  saveGoalInCloud,
  deleteGoalInCloud,
  updateCoupleMetaInCloud,
} from "./couple";

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
  icon: string;
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
  icon: string;
  tint: string;
  target: number;
  saved: number;
};

export type PersonProfile = {
  name: string;
  zh: string;
  emoji: string;
  color: string;
};

export const DEFAULT_PEOPLE: Record<UserId, PersonProfile> = {
  me: { name: "Me", zh: "我", emoji: "🐻", color: "var(--mine)" },
  her: { name: "Her", zh: "她", emoji: "🐰", color: "var(--hers)" },
};

export let PEOPLE: Record<UserId, PersonProfile> = { ...DEFAULT_PEOPLE };

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

// ─── Seed data (used for first launch / offline mode) ─────────────────────────

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

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS = {
  txns: "ustwo:txns",
  goals: "ustwo:goals",
  categories: "ustwo:categories",
  anniversary: "ustwo:anniversary",
  people: "ustwo:people",
  budget: "ustwo:budget",
  darkMode: "ustwo:darkMode",
  activeUser: "ustwo:active_user",
} as const;

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function lsSet<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

// ─── Store types ──────────────────────────────────────────────────────────────

export type DarkMode = "light" | "dark" | "system";
export type CloudStatus = "connected" | "connecting" | "offline" | "unconfigured";

type Store = {
  activeUser: UserId;
  setActiveUser: (u: UserId) => void;
  txns: Txn[];
  addTxn: (t: Omit<Txn, "id">) => void;
  updateTxn: (id: string, patch: Partial<Omit<Txn, "id">>) => void;
  deleteTxn: (id: string) => void;
  visible: Txn[];
  goals: Goal[];
  addToGoal: (id: string, amount: number) => void;
  addGoal: (g: Omit<Goal, "id" | "saved">) => void;
  removeGoal: (id: string) => void;
  anniversary: string;
  setAnniversary: (d: string) => void;
  people: Record<UserId, PersonProfile>;
  setPerson: (u: UserId, patch: Partial<PersonProfile>) => void;
  categories: CatDef[];
  getCat: (id: Category) => CatDef;
  addCategory: (c: Omit<CatDef, "id" | "custom">) => CatDef;
  removeCategory: (id: Category) => void;
  budget: number; // monthly joint budget in NTD, 0 = disabled
  setBudget: (n: number) => void;
  darkMode: DarkMode;
  setDarkMode: (m: DarkMode) => void;

  // Cloud & Pairing fields
  cloudStatus: CloudStatus;
  coupleId: string | null;
  coupleCode: string | null;
  isPaired: boolean;
  createCoupleAccount: (customCode?: string) => Promise<{ ok: boolean; code?: string; error?: string }>;
  joinCoupleAccount: (code: string) => Promise<{ ok: boolean; error?: string }>;
  disconnectCoupleAccount: () => void;
  syncLocalToCloud: () => Promise<{ ok: boolean; count: number; error?: string }>;
  refreshFromCloud: () => Promise<void>;
};

// ─── Context & Provider ───────────────────────────────────────────────────────

const Ctx = createContext<Store | null>(null);

export function UsTwoProvider({ children }: { children: ReactNode }) {
  const [activeUser, setActiveUserRaw] = useState<UserId>(() => lsGet(LS.activeUser, "me"));

  const [txns, setTxnsRaw] = useState<Txn[]>(() => lsGet(LS.txns, seed));
  const [goals, setGoalsRaw] = useState<Goal[]>(() => lsGet(LS.goals, goalSeed));
  const [categories, setCategoriesRaw] = useState<CatDef[]>(() => lsGet(LS.categories, DEFAULT_CATS));
  const [anniversary, setAnniversaryRaw] = useState<string>(() => lsGet(LS.anniversary, "2021-10-16"));
  const [people, setPeopleRaw] = useState<Record<UserId, PersonProfile>>(() => lsGet(LS.people, DEFAULT_PEOPLE));
  const [budget, setBudgetRaw] = useState<number>(() => lsGet(LS.budget, 0));
  const [darkMode, setDarkModeRaw] = useState<DarkMode>(() => lsGet(LS.darkMode, "system") as DarkMode);

  // Couple Cloud State
  const [coupleId, setCoupleId] = useState<string | null>(() => getStoredCouple().coupleId);
  const [coupleCode, setCoupleCode] = useState<string | null>(() => getStoredCouple().coupleCode);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("connecting");

  // Keep ref of coupleId & activeUser for callbacks and listeners
  const coupleIdRef = useRef<string | null>(coupleId);
  coupleIdRef.current = coupleId;

  const activeUserRef = useRef<UserId>(activeUser);
  activeUserRef.current = activeUser;

  const setActiveUser = useCallback((u: UserId) => {
    setActiveUserRaw(u);
    lsSet(LS.activeUser, u);
  }, []);

  // Persisting wrappers
  const setTxns = useCallback((u: Txn[] | ((p: Txn[]) => Txn[])) => {
    setTxnsRaw((p) => {
      const n = typeof u === "function" ? u(p) : u;
      lsSet(LS.txns, n);
      return n;
    });
  }, []);

  const setGoals = useCallback((u: Goal[] | ((p: Goal[]) => Goal[])) => {
    setGoalsRaw((p) => {
      const n = typeof u === "function" ? u(p) : u;
      lsSet(LS.goals, n);
      return n;
    });
  }, []);

  const setCategories = useCallback((u: CatDef[] | ((p: CatDef[]) => CatDef[])) => {
    setCategoriesRaw((p) => {
      const n = typeof u === "function" ? u(p) : u;
      lsSet(LS.categories, n);
      return n;
    });
  }, []);

  const setAnniversary = useCallback((d: string) => {
    setAnniversaryRaw(d);
    lsSet(LS.anniversary, d);
    if (coupleIdRef.current) {
      updateCoupleMetaInCloud(coupleIdRef.current, { anniversary: d });
    }
  }, []);

  const setBudget = useCallback((n: number) => {
    setBudgetRaw(n);
    lsSet(LS.budget, n);
    if (coupleIdRef.current) {
      updateCoupleMetaInCloud(coupleIdRef.current, { budget: n });
    }
  }, []);

  const setDarkMode = useCallback((m: DarkMode) => {
    setDarkModeRaw(m);
    lsSet(LS.darkMode, m);
  }, []);

  const setPeople = useCallback(
    (u: Record<UserId, PersonProfile> | ((p: Record<UserId, PersonProfile>) => Record<UserId, PersonProfile>)) => {
      setPeopleRaw((p) => {
        const n = typeof u === "function" ? u(p) : u;
        lsSet(LS.people, n);
        PEOPLE = n;
        if (coupleIdRef.current) {
          updateCoupleMetaInCloud(coupleIdRef.current, { people: n });
        }
        return n;
      });
    },
    [],
  );

  useEffect(() => {
    PEOPLE = people;
  }, [people]);

  // Apply dark mode to <html> element
  useEffect(() => {
    const html = document.documentElement;
    const apply = (m: DarkMode) => {
      if (m === "dark") html.classList.add("dark");
      else if (m === "light") html.classList.remove("dark");
      else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        prefersDark ? html.classList.add("dark") : html.classList.remove("dark");
      }
    };
    apply(darkMode);
    if (darkMode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [darkMode]);

  // ─── Cloud sync logic ────────────────────────────────────────────────────────

  const refreshFromCloud = useCallback(async () => {
    const cid = coupleIdRef.current;
    if (!cid || !isSupabaseConfigured()) {
      setCloudStatus(isSupabaseConfigured() ? "offline" : "unconfigured");
      return;
    }

    try {
      const data = await fetchCoupleRemoteData(cid, activeUserRef.current);
      if (data) {
        setCloudStatus("connected");
        if (data.txns && data.txns.length > 0) {
          setTxns(data.txns);
        }
        if (data.goals && data.goals.length > 0) {
          setGoals(data.goals);
        }
        if (data.couple) {
          if (data.couple.anniversary) setAnniversaryRaw(data.couple.anniversary);
          if (data.couple.budget !== undefined) setBudgetRaw(Number(data.couple.budget));
          if (data.couple.people) {
            setPeopleRaw(data.couple.people);
            PEOPLE = data.couple.people;
          }
        }
      }
    } catch (err) {
      console.warn("refreshFromCloud error:", err);
      setCloudStatus("offline");
    }
  }, [setTxns, setGoals]);

  // Initial load & when coupleId or activeUser changes
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setCloudStatus("unconfigured");
      return;
    }
    if (!coupleId) {
      setCloudStatus("offline");
      return;
    }

    refreshFromCloud();

    // Setup Supabase Realtime channel for live partner updates
    const client = getSupabase();
    if (!client) return;

    const channel = client
      .channel(`couple_${coupleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `couple_id=eq.${coupleId}` },
        () => {
          refreshFromCloud();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goals", filter: `couple_id=eq.${coupleId}` },
        () => {
          refreshFromCloud();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "couples", filter: `id=eq.${coupleId}` },
        () => {
          refreshFromCloud();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setCloudStatus("connected");
        }
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [coupleId, activeUser, refreshFromCloud]);

  // ─── Pair / Cloud Operations ──────────────────────────────────────────────────

  const createCoupleAccount = useCallback(
    async (customCode?: string) => {
      if (!isSupabaseConfigured()) {
        return { ok: false, error: "尚未設定 Supabase 網址與 Key" };
      }
      setCloudStatus("connecting");
      const res = await createCoupleInCloud({
        couple_code: customCode,
        anniversary,
        budget,
        people,
      });

      if (res.ok && res.couple) {
        setCoupleId(res.couple.id);
        setCoupleCode(res.couple.couple_code);
        setCloudStatus("connected");
        // Also upload current local transactions & goals to initialize the room!
        for (const t of txns) {
          saveTxnInCloud(t, res.couple.id);
        }
        for (const g of goals) {
          saveGoalInCloud(g, res.couple.id);
        }
        return { ok: true, code: res.couple.couple_code };
      }
      setCloudStatus("offline");
      return { ok: false, error: res.error || "建立失敗" };
    },
    [anniversary, budget, people, txns, goals],
  );

  const joinCoupleAccount = useCallback(
    async (code: string) => {
      if (!isSupabaseConfigured()) {
        return { ok: false, error: "尚未設定 Supabase 網址與 Key" };
      }
      setCloudStatus("connecting");
      const res = await joinCoupleInCloud(code);
      if (res.ok && res.couple) {
        setCoupleId(res.couple.id);
        setCoupleCode(res.couple.couple_code);
        setCloudStatus("connected");
        // Immediately fetch data from the joined room
        const data = await fetchCoupleRemoteData(res.couple.id, activeUserRef.current);
        if (data) {
          if (data.txns) setTxns(data.txns);
          if (data.goals) setGoals(data.goals);
          if (data.couple) {
            if (data.couple.anniversary) setAnniversaryRaw(data.couple.anniversary);
            if (data.couple.budget !== undefined) setBudgetRaw(Number(data.couple.budget));
            if (data.couple.people) {
              setPeopleRaw(data.couple.people);
              PEOPLE = data.couple.people;
            }
          }
        }
        return { ok: true };
      }
      setCloudStatus("offline");
      return { ok: false, error: res.error || "加入失敗" };
    },
    [setTxns, setGoals],
  );

  const disconnectCoupleAccount = useCallback(() => {
    clearStoredCouple();
    setCoupleId(null);
    setCoupleCode(null);
    setCloudStatus(isSupabaseConfigured() ? "offline" : "unconfigured");
  }, []);

  const syncLocalToCloud = useCallback(async () => {
    if (!coupleIdRef.current || !isSupabaseConfigured()) {
      return { ok: false, count: 0, error: "尚未綁定小窩或未連線 Supabase" };
    }
    const cid = coupleIdRef.current;
    let count = 0;
    for (const t of txns) {
      const ok = await saveTxnInCloud(t, cid);
      if (ok) count++;
    }
    for (const g of goals) {
      await saveGoalInCloud(g, cid);
    }
    await updateCoupleMetaInCloud(cid, { anniversary, budget, people });
    return { ok: true, count };
  }, [txns, goals, anniversary, budget, people]);

  // ─── CRUD Handlers (Optimistic local + Async cloud) ───────────────────────────

  const addTxn = useCallback(
    (t: Omit<Txn, "id">) => {
      const newTxn: Txn = { ...t, id: `t${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
      setTxns((p) => [newTxn, ...p]);
      if (coupleIdRef.current && isSupabaseConfigured()) {
        saveTxnInCloud(newTxn, coupleIdRef.current);
      }
    },
    [setTxns],
  );

  const updateTxn = useCallback(
    (id: string, patch: Partial<Omit<Txn, "id">>) => {
      setTxns((p) => {
        const next = p.map((t) => (t.id === id ? { ...t, ...patch } : t));
        const updated = next.find((t) => t.id === id);
        if (updated && coupleIdRef.current && isSupabaseConfigured()) {
          saveTxnInCloud(updated, coupleIdRef.current);
        }
        return next;
      });
    },
    [setTxns],
  );

  const deleteTxn = useCallback(
    (id: string) => {
      setTxns((p) => p.filter((t) => t.id !== id));
      if (coupleIdRef.current && isSupabaseConfigured()) {
        deleteTxnInCloud(id, coupleIdRef.current);
      }
    },
    [setTxns],
  );

  const addToGoal = useCallback(
    (id: string, amount: number) => {
      setGoals((p) => {
        const next = p.map((g) =>
          g.id === id ? { ...g, saved: Math.min(g.target, g.saved + amount) } : g,
        );
        const updated = next.find((g) => g.id === id);
        if (updated && coupleIdRef.current && isSupabaseConfigured()) {
          saveGoalInCloud(updated, coupleIdRef.current);
        }
        return next;
      });
    },
    [setGoals],
  );

  const addGoal = useCallback(
    (g: Omit<Goal, "id" | "saved">) => {
      const newGoal: Goal = { ...g, id: `g${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, saved: 0 };
      setGoals((p) => [...p, newGoal]);
      if (coupleIdRef.current && isSupabaseConfigured()) {
        saveGoalInCloud(newGoal, coupleIdRef.current);
      }
    },
    [setGoals],
  );

  const removeGoal = useCallback(
    (id: string) => {
      setGoals((p) => p.filter((g) => g.id !== id));
      if (coupleIdRef.current && isSupabaseConfigured()) {
        deleteGoalInCloud(id, coupleIdRef.current);
      }
    },
    [setGoals],
  );

  // ─── Privacy Filter ──────────────────────────────────────────────────────────
  // STRICT PRIVACY:
  // - In Home, Calendar, Overview: ONLY public/joint transactions (!t.isPrivate)
  //   Partner NEVER sees private transactions anywhere.
  // - In StatsTab:
  //   - "共同支出": !t.isPrivate
  //   - "個人私房錢": t.isPrivate && t.payer === activeUser
  const visible = useMemo(
    () => txns.filter((t) => !t.isPrivate),
    [txns],
  );

  const value = useMemo<Store>(
    () => ({
      activeUser,
      setActiveUser,
      txns,
      addTxn,
      updateTxn,
      deleteTxn,
      visible,
      goals,
      addToGoal,
      addGoal,
      removeGoal,
      anniversary,
      setAnniversary,
      people,
      setPerson: (u, patch) => setPeople((p) => ({ ...p, [u]: { ...p[u], ...patch } })),
      categories,
      getCat: (id) => categories.find((c) => c.id === id) ?? FALLBACK,
      addCategory: (c) => {
        const def: CatDef = { ...c, id: `c${Date.now()}`, custom: true };
        setCategories((p) => [...p, def]);
        return def;
      },
      removeCategory: (id) => setCategories((p) => p.filter((c) => c.id !== id || !c.custom)),
      budget,
      setBudget,
      darkMode,
      setDarkMode,

      cloudStatus,
      coupleId,
      coupleCode,
      isPaired: Boolean(coupleId && coupleCode),
      createCoupleAccount,
      joinCoupleAccount,
      disconnectCoupleAccount,
      syncLocalToCloud,
      refreshFromCloud,
    }),
    [
      activeUser,
      setActiveUser,
      txns,
      addTxn,
      updateTxn,
      deleteTxn,
      visible,
      goals,
      addToGoal,
      addGoal,
      removeGoal,
      anniversary,
      setAnniversary,
      people,
      setPeople,
      categories,
      setCategories,
      budget,
      setBudget,
      darkMode,
      setDarkMode,
      cloudStatus,
      coupleId,
      coupleCode,
      createCoupleAccount,
      joinCoupleAccount,
      disconnectCoupleAccount,
      syncLocalToCloud,
      refreshFromCloud,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUsTwo() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUsTwo must be used inside UsTwoProvider");
  return ctx;
}
