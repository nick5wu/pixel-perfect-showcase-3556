import { getSupabase } from "./supabase";
import type { Txn, Goal, PersonProfile, CatDef, UserId } from "./ustwo";

export type CoupleRecord = {
  id: string;
  couple_code: string;
  name: string;
  anniversary: string;
  budget: number;
  people: Record<UserId, PersonProfile>;
  created_at?: string;
};

const LS_COUPLE_ID = "ustwo:couple_id";
const LS_COUPLE_CODE = "ustwo:couple_code";

export function getStoredCouple(): { coupleId: string | null; coupleCode: string | null } {
  if (typeof window === "undefined") return { coupleId: null, coupleCode: null };
  const coupleId = localStorage.getItem(LS_COUPLE_ID);
  const coupleCode = localStorage.getItem(LS_COUPLE_CODE);
  return { coupleId, coupleCode };
}

export function setStoredCouple(coupleId: string, coupleCode: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_COUPLE_ID, coupleId);
  localStorage.setItem(LS_COUPLE_CODE, coupleCode);
}

export function clearStoredCouple() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_COUPLE_ID);
  localStorage.removeItem(LS_COUPLE_CODE);
}

/** Generate a cute readable couple code e.g. USTWO-6832 */
export function generateCoupleCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `USTWO-${num}`;
}

/** Create a new couple room in Supabase */
export async function createCoupleInCloud(
  initialData?: Partial<CoupleRecord>,
): Promise<{ ok: boolean; couple?: CoupleRecord; error?: string }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: "未連線至 Supabase 雲端" };

  const id = `cp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const code = initialData?.couple_code || generateCoupleCode();

  const record: CoupleRecord = {
    id,
    couple_code: code.toUpperCase().trim(),
    name: initialData?.name || "我們倆的記帳小窩",
    anniversary: initialData?.anniversary || "2021-10-16",
    budget: initialData?.budget ?? 0,
    people: initialData?.people || {
      me: { name: "Me", zh: "我", emoji: "🐻", color: "var(--mine)" },
      her: { name: "Her", zh: "她", emoji: "🐰", color: "var(--hers)" },
    },
  };

  const { data, error } = await client
    .from("couples")
    .insert([record])
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  setStoredCouple(data.id, data.couple_code);
  return { ok: true, couple: data as CoupleRecord };
}

/** Join an existing couple room with code */
export async function joinCoupleInCloud(
  code: string,
): Promise<{ ok: boolean; couple?: CoupleRecord; error?: string }> {
  const client = getSupabase();
  if (!client) return { ok: false, error: "未連線至 Supabase 雲端" };

  const trimmed = code.toUpperCase().trim();
  if (!trimmed) return { ok: false, error: "請輸入邀請碼" };

  const { data, error } = await client
    .from("couples")
    .select("*")
    .eq("couple_code", trimmed)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: `找不到代碼「${trimmed}」的小窩，請確認代碼是否正確` };

  setStoredCouple(data.id, data.couple_code);
  return { ok: true, couple: data as CoupleRecord };
}

/**
 * Fetch couple data with STRICT PRIVACY FILTERING:
 * - Public txns (!is_private)
 * - Private txns belonging ONLY to the activeUser (is_private && payer = activeUser)
 * Partner's private transactions are strictly filtered out by the database query!
 */
export async function fetchCoupleRemoteData(coupleId: string, activeUser: UserId) {
  const client = getSupabase();
  if (!client) return null;

  try {
    // 1. Fetch couple metadata
    const coupleRes = await client.from("couples").select("*").eq("id", coupleId).maybeSingle();

    // 2. Fetch transactions with strict privacy filter
    // Query condition: couple_id = coupleId AND (is_private = false OR (is_private = true AND payer = activeUser))
    const txnsRes = await client
      .from("transactions")
      .select("*")
      .eq("couple_id", coupleId)
      .or(`is_private.eq.false,and(is_private.eq.true,payer.eq.${activeUser})`)
      .order("date", { ascending: false });

    // 3. Fetch goals
    const goalsRes = await client.from("goals").select("*").eq("couple_id", coupleId);

    // Map DB snake_case columns to app Txn format
    const txns: Txn[] = (txnsRes.data || []).map((t: any) => ({
      id: t.id,
      date: t.date,
      amount: Number(t.amount),
      kind: t.kind,
      category: t.category,
      note: t.note || "",
      payer: t.payer as UserId,
      isPrivate: Boolean(t.is_private),
      photo: t.photo || undefined,
    }));

    const goals: Goal[] = (goalsRes.data || []).map((g: any) => ({
      id: g.id,
      title: g.title,
      zh: g.zh,
      icon: g.icon,
      tint: g.tint,
      target: Number(g.target),
      saved: Number(g.saved),
    }));

    return {
      couple: coupleRes.data as CoupleRecord | null,
      txns,
      goals,
    };
  } catch (err) {
    console.warn("fetchCoupleRemoteData error:", err);
    return null;
  }
}

/** Save or update transaction in Supabase */
export async function saveTxnInCloud(txn: Txn, coupleId: string) {
  const client = getSupabase();
  if (!client) return false;

  const row = {
    id: txn.id,
    couple_id: coupleId,
    date: txn.date,
    amount: txn.amount,
    kind: txn.kind,
    category: txn.category,
    note: txn.note,
    payer: txn.payer,
    is_private: txn.isPrivate,
    photo: txn.photo || null,
  };

  const { error } = await client.from("transactions").upsert(row);
  if (error) console.warn("saveTxnInCloud error:", error.message);
  return !error;
}

/** Delete transaction in Supabase */
export async function deleteTxnInCloud(id: string, coupleId: string) {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("couple_id", coupleId);
  return !error;
}

/** Save or update goal in Supabase */
export async function saveGoalInCloud(goal: Goal, coupleId: string) {
  const client = getSupabase();
  if (!client) return false;

  const row = {
    id: goal.id,
    couple_id: coupleId,
    title: goal.title,
    zh: goal.zh,
    icon: goal.icon,
    tint: goal.tint,
    target: goal.target,
    saved: goal.saved,
  };

  const { error } = await client.from("goals").upsert(row);
  return !error;
}

/** Delete goal in Supabase */
export async function deleteGoalInCloud(id: string, coupleId: string) {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from("goals").delete().eq("id", id).eq("couple_id", coupleId);
  return !error;
}

/** Update couple settings (budget, anniversary, people) */
export async function updateCoupleMetaInCloud(
  coupleId: string,
  patch: Partial<Pick<CoupleRecord, "anniversary" | "budget" | "people" | "name">>,
) {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from("couples").update(patch).eq("id", coupleId);
  return !error;
}
