/**
 * ============================================================================
 * UsTwo Ledger - 私房錢防窺 4 位數 PIN 碼保險箱 (Private Vault PIN Lock)
 * ============================================================================
 * 
 * 解決痛點：
 * 解決同一台手機共用查看帳本時，任何一人只需點擊「切換身分」，
 * 即可直接看穿對方私人禮物花費或私房錢明細的隱私漏洞。
 */

import { useState, useEffect, useCallback } from "react";

const PIN_STORAGE_KEY = "ustwo:vault_pin";

// Session-level memory state so unlocking persists while using the app
let sessionUnlocked = false;
const listeners = new Set<(unlocked: boolean) => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn(sessionUnlocked));
}

/**
 * 檢查是否已設定私房錢防窺 PIN 碼
 */
export function hasVaultPin(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(PIN_STORAGE_KEY));
}

/**
 * 設定新的 4 位數 PIN 碼
 */
export function setVaultPin(pin: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PIN_STORAGE_KEY, pin);
  sessionUnlocked = true;
  notifyListeners();
}

/**
 * 清除/關閉 PIN 碼保護
 */
export function removeVaultPin(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PIN_STORAGE_KEY);
  sessionUnlocked = true;
  notifyListeners();
}

/**
 * 驗證 PIN 碼
 */
export function verifyVaultPin(pin: string): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(PIN_STORAGE_KEY);
  return stored === pin;
}

/**
 * 嘗試解鎖保險箱
 */
export function unlockVault(pin: string): boolean {
  if (verifyVaultPin(pin)) {
    sessionUnlocked = true;
    notifyListeners();
    return true;
  }
  return false;
}

/**
 * 手動重新鎖定保險箱
 */
export function lockVault(): void {
  sessionUnlocked = false;
  notifyListeners();
}

/**
 * React Hook：監聽與控制保險箱解鎖狀態
 */
export function useVaultLock() {
  const [hasPin, setHasPinState] = useState<boolean>(() => hasVaultPin());
  const [isUnlocked, setIsUnlockedState] = useState<boolean>(() => {
    if (!hasVaultPin()) return true; // 未設密碼視為常開
    return sessionUnlocked;
  });

  useEffect(() => {
    const handler = (unlocked: boolean) => {
      setIsUnlockedState(!hasVaultPin() || unlocked);
      setHasPinState(hasVaultPin());
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const refreshState = useCallback(() => {
    const configured = hasVaultPin();
    setHasPinState(configured);
    setIsUnlockedState(!configured || sessionUnlocked);
  }, []);

  return {
    hasPin,
    isUnlocked,
    unlock: (pin: string) => {
      const ok = unlockVault(pin);
      refreshState();
      return ok;
    },
    lock: () => {
      lockVault();
      refreshState();
    },
    setPin: (newPin: string) => {
      setVaultPin(newPin);
      refreshState();
    },
    removePin: () => {
      removeVaultPin();
      refreshState();
    },
    refresh: refreshState,
  };
}
