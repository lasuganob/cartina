export function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: "PHP",
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}
