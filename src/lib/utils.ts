import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidRedirect(url?: string | null): boolean {
  if (!url) return false;
  // Must start with '/' and not '//' to prevent protocol-relative URLs
  return url.startsWith('/') && !url.startsWith('//');
}
