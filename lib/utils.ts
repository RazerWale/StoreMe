import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// Creates a deep copy
export const parseStringify = (value: unknown) => {
  return JSON.parse(JSON.stringify(value));
};
