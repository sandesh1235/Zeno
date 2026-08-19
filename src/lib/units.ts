export type WeightUnit = 'kg' | 'lb';

export const kgToLb = (n: number) => n * 2.20462;

export const fromKg = (kg: number, unit: WeightUnit) => (unit === 'kg' ? kg : kgToLb(kg));

export const formatNumber = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(1));

export const showWeight = (kg: number, unit: WeightUnit) => `${formatNumber(fromKg(kg, unit))} ${unit}`;
