import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatDate(dateString: string): string {
  // Parse date parts directly to avoid locale/timezone hydration mismatches
  const [year, month, day] = dateString.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export function formatMonthYear(dateString: string): string {
  const [year, month] = dateString.split("-").map(Number);
  return `${MONTHS[month - 1]} ${year}`;
}

export function formatDay(dateString: string): number {
  return parseInt(dateString.split("-")[2], 10);
}

export function formatMonthShort(dateString: string): string {
  const month = parseInt(dateString.split("-")[1], 10);
  return MONTHS[month - 1].slice(0, 3);
}
