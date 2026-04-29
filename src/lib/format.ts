// South African Rand currency + km distance
export const formatGBP = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n);

export const formatMiles = (n: number) =>
  new Intl.NumberFormat("en-ZA").format(n) + " km";

// Aliases with proper names (kept old ones for backwards compatibility)
export const formatZAR = formatGBP;
export const formatKm = formatMiles;
