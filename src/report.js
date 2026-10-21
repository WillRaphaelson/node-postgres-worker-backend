export function validAmounts(values) {
  return Array.isArray(values) && values.length > 0 && values.length <= 1000 &&
    values.every(value => Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000);
}

export function totalCents(values) {
  if (!validAmounts(values)) throw new Error('Invalid amountsCents');
  return values.reduce((sum, value) => sum + value, 0);
}
