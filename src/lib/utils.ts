/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSKU(category: string, title: string): string {
  const catPart = (category || "GEN")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 4);

  const titleClean = (title || "PROD")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word.substring(0, 4))
    .join("-");

  const randSuffix = Math.floor(100 + Math.random() * 900); // 3-digit suffix for uniqueness
  return `${catPart || "GEN"}-${titleClean || "ITEM"}-${randSuffix}`;
}

