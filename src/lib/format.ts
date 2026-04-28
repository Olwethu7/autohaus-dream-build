export const formatGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);

export const formatMiles = (n: number) =>
  new Intl.NumberFormat("en-GB").format(n) + " mi";
