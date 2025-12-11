import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// Creates a deep copy
export const parseStringify = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value));
