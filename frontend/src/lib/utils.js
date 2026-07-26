import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const buttonVariants = {
  yellow: 'bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/20',
  yellowOutline: 'border border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-white',
  yellowGhost: 'text-sky-500 hover:bg-sky-500/20',
}
