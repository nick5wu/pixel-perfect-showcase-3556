/**
 * UsTwo Ledger - 專屬離線二進位相片儲存庫 (IndexedDB Photo Storage)
 * 
 * 解決痛點：
 * 徹底解除手機瀏覽器 LocalStorage 5MB 的硬性配額限制，
 * 將離線發票收據與拍立得相片存入瀏覽器 IndexedDB (配額高達數百 MB)，
 * 避免 QuotaExceededError 導致系統崩潰與資料損毀。
 */

import { useState, useEffect } from "react";

const DB_NAME = "ustwo_offline_storage";
const DB_VERSION = 1;
const STORE_NAME = "receipt_photos";

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("IndexedDB 不受此環境支援"));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error("無法開啟 IndexedDB 資料庫"));
    };
  });

  return dbPromise;
}

/**
 * 將相片 Blob 儲存至 IndexedDB
 * @param blob 相片 Blob 物件
 * @returns 本地虛擬協議 URI (例如：idb://photo_1773456789_a1b2c)
 */
export async function savePhotoBlob(blob: Blob): Promise<string> {
  const db = await getDb();
  const id = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(blob, id);

    request.onsuccess = () => {
      resolve(`idb://${id}`);
    };

    request.onerror = () => {
      reject(request.error || new Error("儲存相片至 IndexedDB 失敗"));
    };
  });
}

/**
 * 從 IndexedDB 讀取相片 Blob
 * @param uri 本地虛擬協議 URI (例如：idb://photo_xxx)
 */
export async function getPhotoBlob(uri: string): Promise<Blob | null> {
  if (!uri || !uri.startsWith("idb://")) return null;
  const id = uri.replace("idb://", "");

  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as Blob || null);
    };

    request.onerror = () => {
      reject(request.error || new Error("讀取 IndexedDB 相片失敗"));
    };
  });
}

/**
 * 刪除 IndexedDB 中的指定相片
 */
export async function deletePhotoBlob(uri: string): Promise<void> {
  if (!uri || !uri.startsWith("idb://")) return;
  const id = uri.replace("idb://", "");

  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("刪除 IndexedDB 相片失敗"));
  });
}

// 記憶體中的 ObjectURL 快取池，避免頻繁建立洩漏記憶體
const objectUrlCache = new Map<string, string>();

/**
 * 非同步解析相片網址
 * 支援：雲端 URL (http/https)、舊版 Base64 (data:)、以及 IndexedDB (idb://)
 */
export async function resolvePhotoUrl(rawUri?: string | null): Promise<string | null> {
  if (!rawUri) return null;

  // 常規網址、Base64 或靜態檔案直接回傳
  if (
    rawUri.startsWith("http://") ||
    rawUri.startsWith("https://") ||
    rawUri.startsWith("data:") ||
    rawUri.startsWith("/") ||
    rawUri.startsWith("@")
  ) {
    return rawUri;
  }

  // IndexedDB 虛擬協議
  if (rawUri.startsWith("idb://")) {
    if (objectUrlCache.has(rawUri)) {
      return objectUrlCache.get(rawUri)!;
    }

    try {
      const blob = await getPhotoBlob(rawUri);
      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        objectUrlCache.set(rawUri, objectUrl);
        return objectUrl;
      }
    } catch (err) {
      console.warn("無法自 IndexedDB 解析相片:", err);
    }
  }

  return rawUri;
}

/**
 * React 自訂 Hook：動態解析相片 URI
 */
export function useResolvedPhoto(rawUri?: string | null): string | null {
  const [resolved, setResolved] = useState<string | null>(() => {
    if (!rawUri) return null;
    if (rawUri.startsWith("http") || rawUri.startsWith("data:") || rawUri.startsWith("/")) {
      return rawUri;
    }
    return objectUrlCache.get(rawUri) || null;
  });

  useEffect(() => {
    let isMounted = true;

    if (!rawUri) {
      setResolved(null);
      return;
    }

    if (rawUri.startsWith("http") || rawUri.startsWith("data:") || rawUri.startsWith("/")) {
      setResolved(rawUri);
      return;
    }

    resolvePhotoUrl(rawUri).then((url) => {
      if (isMounted) {
        setResolved(url);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [rawUri]);

  return resolved;
}
