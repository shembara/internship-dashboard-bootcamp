import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { progressHubTimeZone } from "@/lib/progress-hub/week";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: progressHubTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
