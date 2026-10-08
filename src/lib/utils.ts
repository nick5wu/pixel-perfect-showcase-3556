import { useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * useBodyScrollLock - Lock document body scroll when a modal, drawer, or sheet is open.
 * Restores original overflow on unmount or when locked becomes false.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (typeof document === "undefined" || !isLocked) {
      return undefined;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isLocked]);
}

