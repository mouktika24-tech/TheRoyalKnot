const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function toRoundedRupees(amount) {
  let value;

  if (typeof amount === 'number' && Number.isFinite(amount)) {
    value = amount.toFixed(2);
  } else if (typeof amount === 'string') {
    value = amount.trim();
  } else {
    return 0n;
  }

  const match = value.match(/^(-?)(\d+)(?:\.(\d{1,}))?$/);
  if (!match) return 0n;

  const [, sign, whole, fraction = ''] = match;
  let rupees = BigInt(whole);
  if (Number(fraction.padEnd(2, '0').slice(0, 2)) >= 50) rupees += 1n;
  return sign ? -rupees : rupees;
}

export function formatCurrency(amount) {
  return INR_FORMATTER.format(toRoundedRupees(amount));
}
