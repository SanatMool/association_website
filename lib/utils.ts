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
  // Take only YYYY-MM-DD — handles full ISO strings like "2026-06-10T08:30:00.000Z"
  const datePart = dateString.substring(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export function formatMonthYear(dateString: string): string {
  const datePart = dateString.substring(0, 10);
  const [year, month] = datePart.split("-").map(Number);
  return `${MONTHS[month - 1]} ${year}`;
}

export function formatDay(dateString: string): number {
  return parseInt(dateString.substring(8, 10), 10);
}

export function formatMonthShort(dateString: string): string {
  const month = parseInt(dateString.substring(5, 7), 10);
  return MONTHS[month - 1].slice(0, 3);
}
