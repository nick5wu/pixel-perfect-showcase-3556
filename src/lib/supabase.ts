import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Storage keys for user-configured credentials (fallback if .env is not present)
const LS_SUPABASE_URL = "ustwo:supabase_url";
const LS_SUPABASE_KEY = "ustwo:supabase_anon_key";

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

let clientInstance: SupabaseClient | null = null;
let currentUrl = "";
let currentKey = "";

function normalizeUrl(raw: string): string {
  return raw.trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || "";
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || "";

  if (envUrl && envKey) {
    return { url: normalizeUrl(envUrl), anonKey: envKey };
  }

  if (typeof window !== "undefined") {
    const storedUrl = localStorage.getItem(LS_SUPABASE_URL)?.trim() || "";
    const storedKey = localStorage.getItem(LS_SUPABASE_KEY)?.trim() || "";
    return { url: normalizeUrl(storedUrl), anonKey: storedKey };
  }

  return { url: "", anonKey: "" };
}

export function isSupabaseConfigured(): boolean {
  const cfg = getSupabaseConfig();
  return Boolean(cfg.url && cfg.anonKey && cfg.url.startsWith("http"));
}

export function saveSupabaseConfig(url: string, anonKey: string): boolean {
  if (typeof window === "undefined") return false;
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  if (cleanUrl) localStorage.setItem(LS_SUPABASE_URL, cleanUrl);
  else localStorage.removeItem(LS_SUPABASE_URL);

  if (cleanKey) localStorage.setItem(LS_SUPABASE_KEY, cleanKey);
  else localStorage.removeItem(LS_SUPABASE_KEY);

  // Reset client to reinitialize on next get
  clientInstance = null;
  currentUrl = "";
  currentKey = "";
  return isSupabaseConfigured();
}

export function clearSupabaseConfig() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LS_SUPABASE_URL);
    localStorage.removeItem(LS_SUPABASE_KEY);
  }
  clientInstance = null;
  currentUrl = "";
  currentKey = "";
}

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !url.startsWith("http")) {
    return null;
  }

  if (clientInstance && currentUrl === url && currentKey === anonKey) {
    return clientInstance;
  }

  try {
    clientInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    currentUrl = url;
    currentKey = anonKey;
    return clientInstance;
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    return null;
  }
}

/** Test if connection and tables are accessible */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  const client = getSupabase();
  if (!client) {
    return { ok: false, message: "尚未填寫有效的 Supabase Project URL 與 Anon Key" };
  }
  try {
    // Attempt a light select on couples or health check
    const { error } = await client.from("couples").select("id").limit(1);
    if (error) {
      if (error.code === "42P01") {
        // Table does not exist
        return {
          ok: false,
          message: "連線成功，但尚未建立資料表！請至 Supabase SQL Editor 執行專屬 schema 腳本。",
        };
      }
      return { ok: false, message: `連線失敗: ${error.message} (${error.code})` };
    }
    return { ok: true, message: "Supabase 連線成功！雲端資料表已就緒 🟢" };
  } catch (e: any) {
    return { ok: false, message: e.message || "連線異常，請確認網路與網址" };
  }
}

/**
 * Upload receipt/photo to Supabase Storage bucket 'receipts'
 * Returns public URL, or null if upload fails
 */
export async function uploadReceiptPhoto(
  fileOrBlob: Blob | File,
  coupleId: string,
): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const ext = fileOrBlob.type.includes("png") ? "png" : "jpg";
    const filename = `${coupleId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await client.storage
      .from("receipts")
      .upload(filename, fileOrBlob, {
        cacheControl: "3600",
        upsert: true,
        contentType: fileOrBlob.type || "image/jpeg",
      });

    if (uploadError) {
      console.warn("Storage upload error (fallback to local base64):", uploadError.message);
      return null;
    }

    const { data } = client.storage.from("receipts").getPublicUrl(filename);
    return data.publicUrl || null;
  } catch (err) {
    console.warn("Upload receipt photo failed:", err);
    return null;
  }
}
