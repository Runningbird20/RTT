export function getAverage(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  return total / values.length;
}

export function getPercentageChange(previous: number, current: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return ((current - previous) / previous) * 100;
}

export function formatSignedPercentage(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const prefix = rounded > 0 ? '+' : '';

  return `${prefix}${rounded}%`;
}
