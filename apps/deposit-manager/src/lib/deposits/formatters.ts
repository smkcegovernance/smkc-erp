const CRORE = 10000000;
const LAKH = 100000;
const THOUSAND = 1000;

function roundCompact(n: number): string {
  return parseFloat(n.toFixed(2)).toLocaleString('en-IN');
}

/**
 * Format currency amount in Indian numbering system.
 * ≥ 1 Cr → "X.XX Cr", ≥ 1 Lakh → "X.XX Lacs", ≥ 1000 → "X.XX K", else ₹ X
 */
export function formatAmount(amount?: number): string {
  if (amount == null || isNaN(amount)) return '₹ 0';
  if (amount >= CRORE) return `₹ ${roundCompact(amount / CRORE)} Cr`;
  if (amount >= LAKH)  return `₹ ${roundCompact(amount / LAKH)} Lacs`;
  if (amount >= THOUSAND) return `₹ ${roundCompact(amount / THOUSAND)}K`;
  return `₹ ${amount.toLocaleString('en-IN')}`;
}

/**
 * Compact form for tables/cards.
 * ≥ 1 Cr → "X.XX Cr", ≥ 1 Lakh → "X.XX Lacs", ≥ 1000 → "X.XXK", else ₹ X
 */
export function formatAmountCompact(amount?: number): string {
  if (amount == null || isNaN(amount)) return '₹ 0';
  if (amount >= CRORE) return `₹ ${roundCompact(amount / CRORE)} Cr`;
  if (amount >= LAKH)  return `₹ ${roundCompact(amount / LAKH)} Lacs`;
  if (amount >= THOUSAND) return `₹ ${roundCompact(amount / THOUSAND)}K`;
  return `₹ ${amount.toLocaleString('en-IN')}`;
}

/**
 * Returns a short label-badge preview string (no ₹ sign) shown next to amount inputs.
 * e.g. 35000000 → "3.5 Cr", 3500000 → "35 Lacs", 35000 → "35K", 350 → "₹ 350"
 */
export function formatAmountPreview(raw: string | number): string {
  const amount = typeof raw === 'string' ? parseFloat(raw) : raw;
  if (!amount || isNaN(amount) || amount <= 0) return '';
  if (amount >= CRORE) return `${parseFloat((amount / CRORE).toFixed(2))} Cr`;
  if (amount >= LAKH)  return `${parseFloat((amount / LAKH).toFixed(2))} Lacs`;
  if (amount >= THOUSAND) return `${parseFloat((amount / THOUSAND).toFixed(2))}K`;
  return `₹ ${amount}`;
}

/**
 * Format date for Indian locale
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
