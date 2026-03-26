import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string | number | null | undefined): string {
  if (!value) return "Sob consulta";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "Sob consulta";
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(num);
}
